"""Operator override actually reverses the agent's hold (Rules.md §1.6).

Drives A into RED+rising so the agent holds 12045, then cancels via
/api/override and asserts the hold is reversed and the agent won't re-hold it.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _hold_a():
    for c in (100, 140, 170, 184):
        client.post("/api/density", json={"platform_id": "A", "count": c})
    client.post("/api/density", json={"platform_id": "B", "count": 70})
    client.post("/api/agent/tick")


def _platform(pid):
    state = client.get("/api/state").json()
    return next(p for p in state if p["platform_id"] == pid)


def test_override_cancels_hold():
    _hold_a()
    assert _platform("A")["next_train"]["held"] is True

    decs = client.get("/api/agent/decisions").json()
    dec = next(d for d in decs
               if (d.get("plan") or {}).get("hold")
               and d["plan"]["hold"]["train_id"] == "12045")

    r = client.post("/api/override", json={"action_id": dec["decision_id"], "decision": "cancel"})
    assert r.status_code == 200
    assert r.json()["cancelled"] is True

    # hold reversed
    assert _platform("A")["next_train"]["held"] is False


def test_agent_does_not_rehold_overridden_train():
    # A is still RED, but 12045 was overridden above -> agent must not re-hold it.
    client.post("/api/agent/tick")
    assert _platform("A")["next_train"]["held"] is False


def test_override_unknown_action_id_is_safe():
    r = client.post("/api/override", json={"action_id": "nope", "decision": "cancel"})
    assert r.status_code == 200
    assert r.json()["cancelled"] is False
