"""The LangGraph form must produce the same decision as the engine (fidelity).

Skipped automatically if langgraph isn't installed (it's an optional dep).
"""
import pytest

pytest.importorskip("langgraph")

from agent.agents.supervisor import run_tick   # noqa: E402
from agent.graph import run_graph                # noqa: E402


def test_graph_matches_supervisor_golden(worked_example, policy):
    via_supervisor = run_tick(worked_example, policy)
    via_graph = run_graph(worked_example, policy)
    assert via_graph.action == via_supervisor.action is True
    assert via_graph.decision["plan"] == via_supervisor.decision["plan"]


def test_graph_no_action_when_safe(policy):
    from tests.conftest import platform
    snap = [platform("A", 30.0, "GREEN", "stable", "12045", 6.0)]
    assert run_graph(snap, policy).action is False
