"""Unit tests for the three parallel perception agents (Crowd / Train / Safety)."""
from agent.agents import crowd, safety, train
from agent.models import Policy
from tests.conftest import platform


def test_crowd_agent_flags_red_rising(worked_example):
    r = crowd.analyze(worked_example)
    assert r.crowded_rising == ["A"]
    assert r.density["A"] == 92.0
    assert r.trend["B"] == "stable"


def test_crowd_agent_ignores_red_but_not_rising():
    snap = [platform("A", 92.0, "RED", "stable", "12045", 6.0)]
    assert crowd.analyze(snap).crowded_rising == []


def test_train_agent_holdability(worked_example):
    r = train.analyze(worked_example)
    assert r.holdable["A"] is True
    assert r.next_train["A"]["train_id"] == "12045"


def test_train_agent_not_holdable_when_held(worked_example):
    worked_example[0]["next_train"]["held"] = True
    assert train.analyze(worked_example).holdable["A"] is False


def test_safety_agent_breaches_and_failsafe(worked_example):
    r = safety.analyze(worked_example, Policy())
    assert r.breaches == ["A"]
    assert r.failsafe is False


def test_safety_agent_failsafe_on_empty():
    r = safety.analyze([], Policy())
    assert r.failsafe is True
    assert "fail-safe" in r.reason


def test_safety_is_safe_target():
    p = Policy()
    assert safety.is_safe_target(platform("B", 35.0, "GREEN", "stable", "1", 5), p)
    assert not safety.is_safe_target(platform("B", 90.0, "RED", "rising", "1", 5), p)
    assert not safety.is_safe_target(platform("B", 80.0, "YELLOW", "stable", "1", 5), p)
