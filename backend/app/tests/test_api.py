from fastapi.testclient import TestClient

from app.db import models
from app.db.database import SessionLocal, normalize_database_url
from app.main import app


def test_database_url_normalization_for_managed_postgres() -> None:
    assert normalize_database_url("postgres://user:pass@host:5432/db") == "postgresql+psycopg://user:pass@host:5432/db"
    assert (
        normalize_database_url("postgresql://user:pass@host:5432/db")
        == "postgresql+psycopg://user:pass@host:5432/db"
    )
    assert normalize_database_url("sqlite:///./edflow.db") == "sqlite:///./edflow.db"


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_hospital_list_and_detail() -> None:
    with TestClient(app) as client:
        response = client.get("/hospitals?limit=3")
        payload = response.json()
        detail = client.get(f"/hospitals/{payload['items'][0]['provider_id']}")

    assert response.status_code == 200
    assert payload["total"] >= 3
    assert "ed_departure_minutes" in payload["items"][0]
    assert detail.status_code == 200
    assert detail.json()["measures"]


def test_ed_overview_and_modeling_contracts() -> None:
    with TestClient(app) as client:
        overview = client.get("/ed/overview")
        outliers = client.get("/models/outliers")
        summary = client.get("/models/model-summary")

    assert overview.status_code == 200
    assert overview.json()["reporting_hospitals"] > 0
    assert outliers.status_code == 200
    assert isinstance(outliers.json(), list)
    assert summary.status_code == 200
    assert "operations analysis only" in summary.json()["warning"]


def test_capacity_command_center_contract() -> None:
    with TestClient(app) as client:
        response = client.get("/capacity/command-center?window_minutes=360")
        payload = response.json()

    assert response.status_code == 200
    assert payload["product_name"] == "EDFlow Orchestrator"
    assert payload["unit_name"] == "Med-Surg Capacity"
    assert len(payload["kpis"]) >= 4
    assert payload["timeline"]
    assert payload["flow_nodes"]
    assert payload["actions"][0]["expected_beds_unlocked"] > 0


def test_capacity_blockers_are_ranked_by_impact() -> None:
    with TestClient(app) as client:
        response = client.get("/capacity/blockers")
        blockers = response.json()

    assert response.status_code == 200
    impacts = [blocker["estimated_bed_hour_impact"] for blocker in blockers]
    assert impacts == sorted(impacts, reverse=True)
    assert blockers[0]["status"] in {"at_risk", "monitor"}


def test_capacity_action_update_and_simulation() -> None:
    with TestClient(app) as client:
        update = client.patch("/capacity/actions/act-discharge-meds", json={"status": "in_progress"})
        simulation = client.post(
            "/capacity/simulate",
            json={
                "extra_staffed_beds": 2,
                "evs_rooms_prioritized": 4,
                "transporters_added": 1,
                "accelerated_discharges": 3,
                "observation_overflow": 0,
            },
        )

    assert update.status_code == 200
    assert update.json()["status"] == "in_progress"
    assert simulation.status_code == 200
    assert simulation.json()["boarding_hours_reduced"] > 0


def test_capacity_action_update_persists_with_audit_event() -> None:
    with TestClient(app) as client:
        update = client.patch(
            "/capacity/actions/act-evs-priority",
            json={"status": "escalated", "owner": "House Supervisor", "note": "Escalated during deployment test"},
        )
        actions = client.get("/capacity/actions").json()

    matching_action = next(action for action in actions if action["id"] == "act-evs-priority")

    assert update.status_code == 200
    assert matching_action["status"] == "escalated"
    assert matching_action["owner"] == "House Supervisor"
    assert matching_action["escalation_state"] == "escalated"

    db = SessionLocal()
    try:
        event = (
            db.query(models.CapacityActionEvent)
            .filter(models.CapacityActionEvent.action_id == "act-evs-priority")
            .order_by(models.CapacityActionEvent.id.desc())
            .first()
        )
    finally:
        db.close()

    assert event is not None
    assert event.new_state_json["status"] == "escalated"


def test_capacity_horizon_filters_hourly_timeline() -> None:
    with TestClient(app) as client:
        short = client.get("/capacity/command-center?window_minutes=120").json()
        medium = client.get("/capacity/command-center?window_minutes=360").json()
        full = client.get("/capacity/command-center?window_minutes=720").json()
        invalid = client.get("/capacity/command-center?window_minutes=1440")
    assert [point["time"] for point in short["timeline"]] == ["08:00", "09:00", "10:00"]
    assert len(medium["timeline"]) == 7
    assert medium["timeline"][-1]["time"] == "14:00"
    assert len(full["timeline"]) == 13
    assert full["timeline"][-1]["time"] == "20:00"
    assert invalid.status_code == 422
