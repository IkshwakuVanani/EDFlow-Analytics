from datetime import datetime, timedelta, timezone
from uuid import uuid4
from fastapi.testclient import TestClient
from app.main import app


def auth(client):
    username = 'test-' + uuid4().hex[:12]
    response = client.post('/ops/auth/register', json={'username': username, 'password': 'strong-testing-password'})
    assert response.status_code == 201, response.text
    return {'Authorization': 'Bearer ' + response.json()['token']}, username


def setup_hospital(client, headers):
    response = client.post('/ops/hospitals', headers=headers, json={'name': 'Test hospital', 'timezone': 'America/New_York', 'graph': {'nodes': [{'id': 'ed', 'label': 'Emergency', 'kind': 'arrival'}, {'id': 'bed', 'label': 'Bed placement', 'kind': 'care'}], 'edges': [{'source': 'ed', 'target': 'bed', 'label': 'Placement'}]}})
    assert response.status_code == 201, response.text
    return response.json()


def records():
    end = datetime.now(timezone.utc).replace(second=0, microsecond=0) - timedelta(minutes=1)
    return [{'stage_id': stage, 'observed_at': (end - timedelta(hours=2-i)).isoformat(), 'waiting': 2 + i*3 if stage == 'ed' else 1, 'occupied': 8, 'staffed_capacity': 10, 'arrivals': 6, 'departures': 4, 'interval_minutes': 60} for i in range(3) for stage in ('ed', 'bed')]


def test_hospital_flow_import_analysis_and_isolation():
    with TestClient(app) as client:
        headers, _ = auth(client)
        other, _ = auth(client)
        hospital = setup_hospital(client, headers)
        path = '/ops/hospitals/' + hospital['id']
        assert client.get('/ops/hospitals').status_code == 401
        assert client.get('/ops/hospitals', headers=other).json() == []
        assert client.get(path + '/analysis', headers=other).status_code == 404
        assert client.post(path + '/observations', headers=other, json={'observations': records()}).status_code == 404
        data = records()
        validated = client.post(path + '/observations', headers=headers, json={'observations': data, 'dry_run': True})
        assert validated.json()['accepted'] == 6
        assert client.get(path + '/observations', headers=headers).json() == []
        imported = client.post(path + '/observations', headers=headers, json={'observations': data})
        assert imported.json() == {'accepted': 6, 'duplicates': 0, 'dry_run': False}
        repeated = client.post(path + '/observations', headers=headers, json={'observations': data})
        assert repeated.json()['duplicates'] == 6
        result = client.get(path + '/analysis', headers=headers)
        assert result.status_code == 200, result.text
        report = result.json()
        assert report['observation_count'] == 6
        assert report['complete_snapshots'] == 3
        ed = report['stages'][0]
        assert ed['queue_change'] == 6
        assert ed['queue_slope_per_hour'] == 3
        assert ed['projected_waiting_60m'] == 11
        assert ed['departures_per_hour'] == 4
        assert report['timeline'][-1]['waiting'] == 9
        assert report['timeline'][-1]['rolling_waiting'] == 6
        assert any('Largest observed queue: Emergency' in line for line in report['conclusions'])
        assert client.get(path + '/analysis?start=2026-01-01T00:00:00&end=2026-01-02T00:00:00', headers=headers).status_code == 422
        conflict = [{**data[0], 'waiting': 100}]
        assert client.post(path + '/observations', headers=headers, json={'observations': conflict}).status_code == 409
        overlap = [{**data[0], 'observed_at': (datetime.fromisoformat(data[0]['observed_at']) + timedelta(minutes=30)).isoformat()}]
        assert client.post(path + '/observations', headers=headers, json={'observations': overlap}).status_code == 422
        invalid = [{**data[0], 'stage_id': 'missing'}]
        assert client.post(path + '/observations', headers=headers, json={'observations': invalid}).status_code == 422
        assert len(client.get(path + '/observations', headers=headers).json()) == 6
        # Referenced stages cannot disappear and orphan their real history.
        assert client.put(path + '/graph', headers=headers, json={'version': 1, 'nodes': [], 'edges': []}).status_code == 409


def test_collaboration_audit_conflicts_and_session_revocation():
    with TestClient(app) as client:
        headers, username = auth(client)
        collaborator, _ = auth(client)
        hospital = setup_hospital(client, headers)
        path = '/ops/hospitals/' + hospital['id']
        code = client.post(path + '/invitations', headers=headers).json()['code']
        assert client.post('/ops/invitations/accept', headers=collaborator, json={'code': code}).status_code == 200
        assert client.post('/ops/invitations/accept', headers=collaborator, json={'code': code}).status_code == 404
        assert client.post(path + '/invitations', headers=collaborator).status_code == 403
        assert client.get('/ops/hospitals', headers=collaborator).json()[0]['id'] == hospital['id']
        task = client.post(path + '/tasks', headers=headers, json={'title': 'Coordinate transport', 'stage_id': 'ed', 'owner': 'Transport team', 'due_at': (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(), 'notes': 'Check staffing'}).json()
        payload = {'version': task['version'], 'status': 'in_progress', 'owner': 'Transport lead', 'notes': 'Pickup in progress'}
        changed = client.patch(path + '/tasks/' + task['id'], headers=collaborator, json=payload)
        assert changed.status_code == 200, changed.text
        assert changed.json()['version'] == 2
        assert client.patch(path + '/tasks/' + task['id'], headers=headers, json=payload).status_code == 409
        history = client.get(path + '/tasks/' + task['id'] + '/history', headers=headers).json()
        assert len(history) == 2
        assert history[0]['actor'] == username
        assert client.post('/ops/auth/logout', headers=headers).status_code == 204
        assert client.get('/ops/hospitals', headers=headers).status_code == 401


def test_graph_versions_validation_and_stale_analysis():
    with TestClient(app) as client:
        headers, _ = auth(client)
        hospital = setup_hospital(client, headers)
        path = '/ops/hospitals/' + hospital['id']
        graph = {**hospital['graph'], 'version': 1}
        assert client.put(path + '/graph', headers=headers, json=graph).json()['version'] == 2
        assert client.put(path + '/graph', headers=headers, json=graph).status_code == 409
        invalid = {**graph, 'version': 2, 'edges': [{'source': 'ed', 'target': 'missing'}]}
        assert client.put(path + '/graph', headers=headers, json=invalid).status_code == 422
        data = [{**row, 'observed_at': (datetime.fromisoformat(row['observed_at']) - timedelta(hours=2)).isoformat()} for row in records() if row['stage_id'] == 'ed']
        assert client.post(path + '/observations', headers=headers, json={'observations': data}).status_code == 200
        report = client.get(path + '/analysis', headers=headers).json()
        assert report['timeline'] == []
        assert report['stages'][0]['projected_waiting_60m'] is None
        assert any('omit stages' in warning for warning in report['warnings'])
        assert any('latest observation' in warning for warning in report['warnings'])
        future = [{**data[0], 'observed_at': (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()}]
        assert client.post(path + '/observations', headers=headers, json={'observations': future}).status_code == 422


def test_production_api_is_operations_only():
    from app.production import create_app
    with TestClient(create_app(prefix='/api')) as client:
        assert client.get('/api/health').status_code == 200
        assert client.get('/api/ops/hospitals').status_code == 401
        assert client.get('/api/capacity/command-center').status_code == 404
        assert client.get('/api/models/model-summary').status_code == 404


def test_hosted_api_requires_persistent_database(monkeypatch):
    import pytest
    from app.production import create_app
    monkeypatch.setenv('VERCEL', '1')
    monkeypatch.setenv('DATABASE_URL', 'sqlite:////tmp/transient.db')
    with pytest.raises(RuntimeError, match='persistent PostgreSQL'):
        with TestClient(create_app()):
            pass
