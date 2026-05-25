from fastapi.testclient import TestClient

from app.main import app


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
