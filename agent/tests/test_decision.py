"""Decision Agent — best-alternative selection + synthesis of the 3 reports."""
from agent.agents import crowd, decision, safety, train
from agent.agents.decision import best_alternative, evaluate
from agent.types import Policy
from tests.conftest import platform


def _decide(snapshot, policy):
    return decision.decide(snapshot, crowd.analyze(snapshot), train.analyze(snapshot),
                           safety.analyze(snapshot, policy), policy)


def test_best_alternative_picks_green_with_near_train(worked_example, policy):
    red = worked_example[0]
    alt = best_alternative(red, worked_example, policy)
    assert alt["platform_id"] == "B"


def test_best_alternative_skips_red_and_full(policy):
    red = platform("A", 92.0, "RED", "rising", "12045", 6.0)
    snap = [red,
            platform("B", 90.0, "RED", "rising", "12046", 7.0),
            platform("C", 80.0, "YELLOW", "stable", "12047", 8.0)]
    assert best_alternative(red, snap, policy) is None


def test_evaluate_maps_red_rising(worked_example, policy):
    cand = evaluate(worked_example, policy)
    assert set(cand) == {"A"}
    assert cand["A"]["platform_id"] == "B"


def test_decide_produces_hold_redirect(worked_example, policy):
    d = _decide(worked_example, policy)
    assert d.act is True
    assert d.plan.hold.train_id == "12045"
    assert d.plan.redirect.to_platform == "B"
    assert d.plan.redirect.mode == "suggestion"


def test_decide_hold_only_when_no_target(policy):
    snap = [platform("A", 92.0, "RED", "rising", "12045", 6.0),
            platform("B", 95.0, "RED", "rising", "12046", 7.0)]
    d = _decide(snap, policy)
    assert d.act is True
    assert d.plan.redirect is None


def test_decide_no_action_when_safe(policy):
    snap = [platform("A", 40.0, "GREEN", "stable", "12045", 6.0)]
    assert _decide(snap, policy).act is False


def test_decide_no_thrash_when_held(worked_example, policy):
    worked_example[0]["next_train"]["held"] = True
    d = _decide(worked_example, policy)
    assert d.act is False
    assert "already holding" in d.reason
