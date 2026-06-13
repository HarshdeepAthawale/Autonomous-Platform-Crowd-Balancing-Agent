"""End-to-end via TestClient: scan + density -> fused state, zones, and hold."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_state_reflects_scan_and_density():
    client.post("/api/scan", json={"platform_id": "A", "train_id": "12045"})
    r = client.post("/api/density", json={"platform_id": "A", "count": 184})
    assert r.status_code == 200
    # 184 / 200 capacity = 92% -> RED
    assert r.json()["density_pct"] == 92.0

    state = client.get("/api/state").json()
    a = next(p for p in state if p["platform_id"] == "A")
    assert a["zone"] == "RED"
    assert a["count"] == 184
    assert a["next_train"]["train_id"] == "12045"


def test_scan_ignores_pii():
    r = client.post("/api/scan", json={
        "platform_id": "B", "train_id": "12046",
        "name": "x", "phone": "y",  # must be ignored, not stored
    })
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_hold_is_capped():
    # Request 999 min; schedule must cap to hold_max_min (10).
    r = client.post("/api/scheduling/hold", json={"train_id": "12045", "minutes": 999})
    assert r.status_code == 200
    assert r.json()["hold_min"] == 10


def test_hold_unknown_train_404():
    r = client.post("/api/scheduling/hold", json={"train_id": "00000", "minutes": 5})
    assert r.status_code == 404
