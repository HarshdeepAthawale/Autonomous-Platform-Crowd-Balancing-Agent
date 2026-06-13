"""Station Supervisor — end-to-end tick through the full hierarchy."""
from agent.agents.supervisor import run_tick
from tests.conftest import platform


def test_golden_scenario_hold_redirect_announce(worked_example, policy):
    r = run_tick(worked_example, policy)
    assert r.action is True
    plan = r.decision["plan"]
    assert plan["hold"]["train_id"] == "12045"
    assert plan["hold"]["minutes"] <= policy.hold_max_min
    assert plan["redirect"] == {"from": "A", "to": "B", "mode": "suggestion"}
    assert plan["announce"] is True
    assert r.side_effects.hold.minutes == 10
    assert r.decision["announcement"]["en"]
    assert r.decision["announcement"]["ja"]


def test_side_effects_signage_and_redirect(worked_example, policy):
    r = run_tick(worked_example, policy)
    kinds = [m[1]["type"] for m in r.side_effects.display_msgs]
    assert kinds.count("signage") == 2
    assert "redirect" in kinds
    assert r.side_effects.dashboard_msgs[0]["type"] == "agent_action"


def test_no_action_when_all_safe(policy):
    snap = [platform("A", 40.0, "GREEN", "stable", "12045", 6.0),
            platform("B", 35.0, "GREEN", "stable", "12046", 9.0)]
    assert run_tick(snap, policy).action is False


def test_failsafe_on_empty(policy):
    r = run_tick([], policy)
    assert r.action is False
    assert "fail-safe" in r.reason


def test_hold_only_when_no_safe_target(policy):
    snap = [platform("A", 92.0, "RED", "rising", "12045", 6.0),
            platform("B", 95.0, "RED", "rising", "12046", 7.0)]
    r = run_tick(snap, policy)
    assert r.action is True
    assert r.decision["plan"]["redirect"] is None
    assert "OPERATOR_ALERT" in r.decision["actions_taken"]
