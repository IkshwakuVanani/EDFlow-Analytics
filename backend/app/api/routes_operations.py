from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import os
import secrets
from uuid import uuid4
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.operations import Account, Hospital, Invitation, Membership, Observation, SessionToken, Task, TaskEvent
from app.schemas.operations import Credentials, FlowGraph, GraphUpdate, HospitalCreate, InvitationAccept, ObservationBatch, TaskCreate, TaskUpdate
from app.services.operations_analysis import analyze, utc

router = APIRouter(prefix='/ops', tags=['hospital operations'])
bearer = HTTPBearer(auto_error=False)


def now():
    return datetime.now(timezone.utc)


def digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    return salt + ':' + hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()


def current_account(credentials: HTTPAuthorizationCredentials = Depends(bearer), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(401, 'Sign in to continue')
    session = db.get(SessionToken, digest(credentials.credentials))
    if not session or utc(session.expires_at) <= now():
        raise HTTPException(401, 'Your session expired. Sign in again.')
    account = db.get(Account, session.account_id)
    if not account:
        raise HTTPException(401, 'Account not found')
    return account


def hospital_access(hospital_id, account, db):
    membership = db.get(Membership, (hospital_id, account.id))
    hospital = db.get(Hospital, hospital_id) if membership else None
    if not hospital:
        raise HTTPException(404, 'Hospital workspace not found')
    return hospital


def hospital_json(hospital):
    return {'id': hospital.id, 'name': hospital.name, 'timezone': hospital.timezone, 'graph': hospital.graph, 'version': hospital.version}


def issue_session(account, db):
    token = secrets.token_urlsafe(48)
    db.add(SessionToken(token_hash=digest(token), account_id=account.id, expires_at=now() + timedelta(days=7)))
    db.commit()
    return {'token': token, 'username': account.username}


@router.post('/auth/register', status_code=201)
def register(payload: Credentials, db: Session = Depends(get_db)):
    if os.getenv('EDFLOW_ALLOW_REGISTRATION', 'true').lower() != 'true':
        raise HTTPException(403, 'Account registration is disabled')
    account = Account(id=str(uuid4()), username=payload.username.lower(), password_hash=password_hash(payload.password))
    db.add(account)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'This username is unavailable')
    return issue_session(account, db)


@router.post('/auth/login')
def login(payload: Credentials, db: Session = Depends(get_db)):
    account = db.scalar(select(Account).where(Account.username == payload.username.lower()))
    stored = account.password_hash if account else password_hash('invalid-password')
    candidate = password_hash(payload.password, stored.split(':')[0])
    if not account or not hmac.compare_digest(candidate, stored):
        raise HTTPException(401, 'Incorrect username or password')
    return issue_session(account, db)


@router.get('/auth/me')
def me(account=Depends(current_account)):
    return {'username': account.username}


@router.post('/auth/logout', status_code=204)
def logout(credentials=Depends(bearer), account=Depends(current_account), db: Session = Depends(get_db)):
    db.execute(delete(SessionToken).where(SessionToken.token_hash == digest(credentials.credentials)))
    db.commit()


@router.get('/hospitals')
def list_hospitals(account=Depends(current_account), db: Session = Depends(get_db)):
    rows = db.scalars(select(Hospital).join(Membership).where(Membership.account_id == account.id).order_by(Hospital.name)).all()
    return [hospital_json(row) for row in rows]


@router.post('/hospitals', status_code=201)
def create_hospital(payload: HospitalCreate, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital = Hospital(id=str(uuid4()), name=payload.name, timezone=payload.timezone, graph=payload.graph.model_dump())
    db.add(hospital)
    db.flush()
    db.add(Membership(hospital_id=hospital.id, account_id=account.id, role='owner'))
    db.commit()
    return hospital_json(hospital)


@router.put('/hospitals/{hospital_id}/graph')
def update_graph(hospital_id: str, payload: GraphUpdate, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital = hospital_access(hospital_id, account, db)
    db.refresh(hospital, with_for_update=True)
    graph = FlowGraph(nodes=payload.nodes, edges=payload.edges).model_dump()
    # Preserve referenced stage IDs so historical observations and tasks remain interpretable.
    ids = {n['id'] for n in graph['nodes']}
    used = set(db.scalars(select(Observation.stage_id).where(Observation.hospital_id == hospital_id)).all())
    used |= set(db.scalars(select(Task.stage_id).where(Task.hospital_id == hospital_id)).all())
    if used - ids:
        raise HTTPException(409, 'Stages with observations or tasks cannot be removed; keep their IDs in the flow.')
    result = db.execute(update(Hospital).where(Hospital.id == hospital_id, Hospital.version == payload.version).values(graph=graph, version=Hospital.version + 1))
    if not result.rowcount:
        db.rollback()
        raise HTTPException(409, 'Flow changed in another session. Refresh before saving.')
    db.commit()
    db.refresh(hospital)
    return hospital_json(hospital)


@router.post('/hospitals/{hospital_id}/invitations', status_code=201)
def invite(hospital_id: str, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital_access(hospital_id, account, db)
    if db.get(Membership, (hospital_id, account.id)).role != 'owner':
        raise HTTPException(403, 'Only the workspace owner can invite collaborators')
    token = secrets.token_urlsafe(32)
    db.add(Invitation(token_hash=digest(token), hospital_id=hospital_id, expires_at=now() + timedelta(hours=24)))
    db.commit()
    return {'code': token, 'expires_in_hours': 24}


@router.post('/invitations/accept')
def accept_invite(payload: InvitationAccept, account=Depends(current_account), db: Session = Depends(get_db)):
    invitation = db.get(Invitation, digest(payload.code))
    if not invitation or utc(invitation.expires_at) <= now():
        raise HTTPException(404, 'Invitation is invalid or expired')
    hospital = db.get(Hospital, invitation.hospital_id)
    # Atomic consumption makes invite codes one-use across processes.
    consumed = db.execute(delete(Invitation).where(Invitation.token_hash == invitation.token_hash))
    if not consumed.rowcount:
        db.rollback()
        raise HTTPException(409, 'Invitation was already used')
    if not db.get(Membership, (hospital.id, account.id)):
        db.add(Membership(hospital_id=hospital.id, account_id=account.id, role='editor'))
    db.commit()
    return hospital_json(hospital)


def row_dict(row):
    return {'id': row.id, 'stage_id': row.stage_id, 'observed_at': utc(row.observed_at).isoformat(), 'waiting': row.waiting, 'occupied': row.occupied, 'staffed_capacity': row.staffed_capacity, 'arrivals': row.arrivals, 'departures': row.departures, 'interval_minutes': row.interval_minutes}


@router.post('/hospitals/{hospital_id}/observations')
def import_observations(hospital_id: str, payload: ObservationBatch, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital = hospital_access(hospital_id, account, db)
    db.refresh(hospital, with_for_update=True)
    stage_ids = {node['id'] for node in hospital.graph['nodes']}
    # Reporting intervals are bounded to 24 hours. Fetch only the affected time
    # range plus possible overlapping neighbors, rather than the entire history.
    earliest = min(item.observed_at for item in payload.observations) - timedelta(days=1)
    latest = max(item.observed_at for item in payload.observations) + timedelta(days=1)
    incoming_stages = {item.stage_id for item in payload.observations}
    existing_rows = db.scalars(select(Observation).where(Observation.hospital_id == hospital_id, Observation.stage_id.in_(incoming_stages), Observation.observed_at >= earliest, Observation.observed_at <= latest)).all()
    existing = {(r.stage_id, utc(r.observed_at)): row_dict(r) for r in existing_rows}
    pending, duplicates = {}, 0
    for index, item in enumerate(payload.observations):
        if item.stage_id not in stage_ids:
            raise HTTPException(422, f'Row {index + 1}: stage {item.stage_id} is not in this hospital flow')
        key = (item.stage_id, utc(item.observed_at))
        values = item.model_dump(mode='json')
        comparison = pending.get(key) or existing.get(key)
        if comparison:
            if any(comparison[k] != v for k, v in values.items() if k != 'observed_at'):
                raise HTTPException(409, f'Row {index + 1}: conflicting values at the same stage and timestamp')
            duplicates += 1
            continue
        pending[key] = values
    # Do not double-count interval flows. A gap is permitted, but overlap is rejected.
    by_stage = {}
    for (stage, timestamp), values in {**existing, **pending}.items():
        by_stage.setdefault(stage, []).append((timestamp, values['interval_minutes']))
    for stage, intervals in by_stage.items():
        intervals.sort()
        for (previous, _), (timestamp, minutes) in zip(intervals, intervals[1:]):
            if timestamp - timedelta(minutes=minutes) < previous:
                raise HTTPException(422, f'Overlapping count intervals for stage {stage}. Set interval_minutes to the actual reporting interval.')
    if not payload.dry_run:
        for values in pending.values():
            db.add(Observation(id=str(uuid4()), hospital_id=hospital_id, created_by=account.id, **{**values, 'observed_at': datetime.fromisoformat(values['observed_at'].replace('Z', '+00:00'))}))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, 'Records changed during import. Validate and retry.')
    return {'accepted': len(pending), 'duplicates': duplicates, 'dry_run': payload.dry_run}


@router.get('/hospitals/{hospital_id}/observations')
def observations(hospital_id: str, offset: int = Query(0, ge=0), limit: int = Query(500, ge=1, le=5000), account=Depends(current_account), db: Session = Depends(get_db)):
    hospital_access(hospital_id, account, db)
    rows = db.scalars(select(Observation).where(Observation.hospital_id == hospital_id).order_by(Observation.observed_at.desc(), Observation.stage_id).offset(offset).limit(limit)).all()
    return [row_dict(row) for row in rows]


@router.get('/hospitals/{hospital_id}/analysis')
def analysis(hospital_id: str, start: Optional[datetime] = None, end: Optional[datetime] = None, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital = hospital_access(hospital_id, account, db)
    if (start and start.tzinfo is None) or (end and end.tzinfo is None):
        raise HTTPException(422, 'Include a timezone offset in analysis dates')
    end = end or now()
    start = start or end - timedelta(hours=24)
    if start >= end or end - start > timedelta(days=366):
        raise HTTPException(422, 'Choose a window between 1 second and 366 days')
    rows = db.scalars(select(Observation).where(Observation.hospital_id == hospital_id, Observation.observed_at >= start, Observation.observed_at <= end).order_by(Observation.observed_at).limit(50001)).all()
    if len(rows) > 50000:
        raise HTTPException(422, 'More than 50,000 observations. Choose a shorter analysis window.')
    return analyze(hospital.graph, rows, start, end)


def task_json(task):
    return {'id': task.id, 'title': task.title, 'stage_id': task.stage_id, 'owner': task.owner, 'status': task.status, 'due_at': utc(task.due_at).isoformat(), 'notes': task.notes, 'version': task.version, 'updated_at': utc(task.updated_at).isoformat()}


@router.get('/hospitals/{hospital_id}/tasks')
def tasks(hospital_id: str, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital_access(hospital_id, account, db)
    return [task_json(task) for task in db.scalars(select(Task).where(Task.hospital_id == hospital_id).order_by(Task.due_at)).all()]


@router.post('/hospitals/{hospital_id}/tasks', status_code=201)
def create_task(hospital_id: str, payload: TaskCreate, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital = hospital_access(hospital_id, account, db)
    if payload.stage_id not in {node['id'] for node in hospital.graph['nodes']}:
        raise HTTPException(422, 'Choose a stage in this hospital flow')
    task = Task(id=str(uuid4()), hospital_id=hospital_id, status='queued', **payload.model_dump())
    db.add(task)
    db.flush()
    db.add(TaskEvent(id=str(uuid4()), task_id=task.id, actor=account.username, change={'created': payload.model_dump(mode='json')}))
    db.commit()
    db.refresh(task)
    return task_json(task)


@router.patch('/hospitals/{hospital_id}/tasks/{task_id}')
def update_task(hospital_id: str, task_id: str, payload: TaskUpdate, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital_access(hospital_id, account, db)
    task = db.get(Task, task_id)
    if not task or task.hospital_id != hospital_id:
        raise HTTPException(404, 'Task not found')
    before = task_json(task)
    values = payload.model_dump(exclude={'version'})
    result = db.execute(update(Task).where(Task.id == task_id, Task.version == payload.version).values(**values, version=Task.version + 1, updated_at=now()))
    if not result.rowcount:
        db.rollback()
        raise HTTPException(409, 'Task changed in another session. Refresh before editing.')
    db.add(TaskEvent(id=str(uuid4()), task_id=task_id, actor=account.username, change={'before': before, 'after': values}))
    db.commit()
    db.refresh(task)
    return task_json(task)


@router.get('/hospitals/{hospital_id}/tasks/{task_id}/history')
def task_history(hospital_id: str, task_id: str, account=Depends(current_account), db: Session = Depends(get_db)):
    hospital_access(hospital_id, account, db)
    task = db.get(Task, task_id)
    if not task or task.hospital_id != hospital_id:
        raise HTTPException(404, 'Task not found')
    return [{'actor': event.actor, 'change': event.change, 'created_at': utc(event.created_at).isoformat()} for event in db.scalars(select(TaskEvent).where(TaskEvent.task_id == task_id).order_by(TaskEvent.created_at)).all()]
