"""End-to-end scenario, graceful-degradation, and latency proofs.

Covers Tracker 5.1 (full worked example), 5.4 (no-LLM-key degradation), and
5.5 (latency budget). Uses the in-process TestClient so the whole stack runs:
density ingest -> fusion -> agent hierarchy -> schedule hold + WS side effects.

Each test runs against a freshly reset store/schedule with the deterministic
template (no-LLM) draft, so the suite is hermetic and order-independent.
"""
import time

import pytest
from fastapi.testclient import TestClient

from agent.llm import make_draft
from app import agent_runner, deps
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_state(monkeypatch):
    # Deterministic, offline template wording (no LLM call) for every test here.
    monkeypatch.setattr(agent_runner, "DRAFT", make_draft(None))
    # Reset the shared in-memory singletons to a clean worked-example baseline.
    deps.store.density.clear()
    deps.store.arrivals.clear()
    deps.schedule.trains.clear()
    deps.schedule._seed()
    agent_runner._history.clear()
    agent_runner._overridden.clear()
    yield


def _drive_red_rising(platform_id: str, train_safe: str = "B"):
    """Push a platform into RED + rising, keep another GREEN as a redirect target."""
    for c in (100, 140, 170, 184):
        client.post("/api/density", json={"platform_id": platform_id, "count": c})
    client.post("/api/density", json={"platform_id": train_safe, "count": 70})


# ---- 5.1 End-to-end worked example -----------------------------------------

def test_e2e_overcrowd_triggers_hold_redirect_and_recovery():
    _drive_red_rising("A")

    # Agent perceives RED -> holds the train, suggests redirect A->B.
    r = client.post("/api/agent/tick").json()
    assert r["action"] is True
    plan = r["decision"]["plan"]
    assert plan["hold"]["train_id"] == "12045"
    assert plan["hold"]["minutes"] <= 10                       # hard cap (Rules.md §1)
    assert plan["redirect"] == {"from": "A", "to": "B", "mode": "suggestion"}

    # The hold is visible in fused state.
    a = next(p for p in client.get("/api/state").json() if p["platform_id"] == "A")
    assert a["next_train"]["held"] is True

    # Recovery: A clears back below RED -> the decision is marked normalized.
    for c in (120, 80, 40):
        client.post("/api/density", json={"platform_id": "A", "count": c})
    client.post("/api/agent/tick")
    decisions = client.get("/api/agent/decisions").json()
    held_for_a = [d for d in decisions if d["trigger"]["platform_id"] == "A"]
    assert held_for_a, "expected at least one logged decision for platform A"
    assert any(d.get("outcome", {}).get("normalized") for d in held_for_a)


# ---- 5.4 Graceful degradation (no Claude/Groq key) -------------------------

def test_acts_with_bilingual_template_when_no_llm_key():
    """With the no-LLM template draft, the rule path must still act AND still
    produce both JA and EN announcement text."""
    _drive_red_rising("A")
    r = client.post("/api/agent/tick").json()
    assert r["action"] is True
    ann = r["decision"]["announcement"]
    assert ann["en"].strip(), "English announcement must be non-empty (template path)"
    assert ann["ja"].strip(), "Japanese announcement must be non-empty (bilingual)"
    assert r["decision"]["reasoning"].strip()


def test_make_draft_without_key_is_offline_template():
    """make_draft(None) returns the deterministic template path (no network)."""
    draft = make_draft(None)
    out = draft({
        "red_id": "A", "red_pct": 92.0, "target_id": "B", "target_zone": "GREEN",
        "target_pct": 35.0, "target_eta": 4, "train_id": "12045", "minutes": 5,
    })
    assert out["source"] == "rule"
    assert out["announcement_en"].strip() and out["announcement_ja"].strip()


# ---- 5.5 Latency budget ----------------------------------------------------

def test_density_ingest_under_2s():
    t0 = time.perf_counter()
    resp = client.post("/api/density", json={"platform_id": "A", "count": 90})
    dt = time.perf_counter() - t0
    assert resp.status_code == 200
    assert dt < 2.0, f"density ingest took {dt:.3f}s (budget 2s)"


def test_agent_tick_under_2s():
    _drive_red_rising("A")
    t0 = time.perf_counter()
    client.post("/api/agent/tick")
    dt = time.perf_counter() - t0
    assert dt < 2.0, f"agent tick took {dt:.3f}s (budget 2s)"
