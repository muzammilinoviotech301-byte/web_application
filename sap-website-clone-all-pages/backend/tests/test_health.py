from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_lists_api_prefix() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["api"] == "/api/v1"


def test_health_reports_supabase_state() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["supabase"] in {"configured", "not_configured"}
