"""Persistent, account-scoped hospital operations; no patient-level records."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy import MetaData, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.schema import CreateSchema
from app.db.database import engine

# Keep account credentials and operational data outside exposed public API schemas.
Base = declarative_base(metadata=MetaData(schema="edflow" if engine.dialect.name == "postgresql" else None))

def init_operations_db():
    with engine.begin() as connection:
        if engine.dialect.name == "postgresql":
            connection.execute(CreateSchema("edflow", if_not_exists=True))
            connection.execute(text("REVOKE ALL ON SCHEMA edflow FROM PUBLIC"))
        Base.metadata.create_all(bind=connection)
        if engine.dialect.name == "postgresql":
            for table in Base.metadata.sorted_tables:
                connection.execute(text(f"ALTER TABLE edflow.{table.name} ENABLE ROW LEVEL SECURITY"))
            connection.execute(text("REVOKE ALL ON ALL TABLES IN SCHEMA edflow FROM PUBLIC"))


class Account(Base):
    __tablename__ = 'ops_accounts'
    id = Column(String(36), primary_key=True)
    username = Column(String(80), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)


class SessionToken(Base):
    __tablename__ = 'ops_sessions'
    token_hash = Column(String(64), primary_key=True)
    account_id = Column(String(36), ForeignKey('ops_accounts.id'), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class Hospital(Base):
    __tablename__ = 'ops_hospitals'
    id = Column(String(36), primary_key=True)
    name = Column(String(160), nullable=False)
    timezone = Column(String(80), nullable=False, default='UTC')
    graph = Column(JSON, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Membership(Base):
    __tablename__ = 'ops_memberships'
    hospital_id = Column(String(36), ForeignKey('ops_hospitals.id'), primary_key=True)
    account_id = Column(String(36), ForeignKey('ops_accounts.id'), primary_key=True)
    role = Column(String(20), nullable=False, default='editor')


class Invitation(Base):
    __tablename__ = 'ops_invitations'
    token_hash = Column(String(64), primary_key=True)
    hospital_id = Column(String(36), ForeignKey('ops_hospitals.id'), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)


class Observation(Base):
    __tablename__ = 'ops_observations'
    __table_args__ = (UniqueConstraint('hospital_id', 'stage_id', 'observed_at', name='uq_ops_stage_time'),)
    id = Column(String(36), primary_key=True)
    hospital_id = Column(String(36), ForeignKey('ops_hospitals.id'), nullable=False, index=True)
    stage_id = Column(String(80), nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False, index=True)
    waiting = Column(Integer, nullable=False)
    occupied = Column(Integer, nullable=False)
    staffed_capacity = Column(Integer, nullable=False)
    arrivals = Column(Integer, nullable=False)
    departures = Column(Integer, nullable=False)
    interval_minutes = Column(Integer, nullable=False)
    created_by = Column(String(36), ForeignKey('ops_accounts.id'), nullable=False)


class Task(Base):
    __tablename__ = 'ops_tasks'
    id = Column(String(36), primary_key=True)
    hospital_id = Column(String(36), ForeignKey('ops_hospitals.id'), nullable=False, index=True)
    title = Column(String(240), nullable=False)
    stage_id = Column(String(80), nullable=False)
    owner = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False, default='queued')
    due_at = Column(DateTime(timezone=True), nullable=False)
    notes = Column(Text, nullable=False, default='')
    version = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class TaskEvent(Base):
    __tablename__ = 'ops_task_events'
    id = Column(String(36), primary_key=True)
    task_id = Column(String(36), ForeignKey('ops_tasks.id'), nullable=False, index=True)
    actor = Column(String(80), nullable=False)
    change = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
