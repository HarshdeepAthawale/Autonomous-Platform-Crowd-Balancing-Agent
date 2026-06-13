"""Station Supervisor Agent — top of the hierarchy.

Orchestrates one tick:
  1. fan out to the parallel layer (Crowd ∥ Train ∥ Safety)
  2. hand the three reports to the Decision Agent
  3. if it decides to act, hand the plan to the Action Agent
Returns a TickResult the runner executes.
"""
from ..models import Policy, TickResult
from . import action, crowd, decision, safety, train


def gather_reports(snapshot: list[dict], policy: Policy):
    """Run the three independent perception agents (logically parallel)."""
    return (
        crowd.analyze(snapshot),
        train.analyze(snapshot),
        safety.analyze(snapshot, policy),
    )


def run_tick(snapshot: list[dict], policy: Policy, draft=None) -> TickResult:
    crowd_r, train_r, safety_r = gather_reports(snapshot, policy)

    d = decision.decide(snapshot, crowd_r, train_r, safety_r, policy)
    if not d.act:
        return TickResult(False, d.reason)

    record, side_effects = action.act(d, snapshot, draft)
    return TickResult(True, d.reason, decision=record, side_effects=side_effects)
