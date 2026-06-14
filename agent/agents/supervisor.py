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
    if d.act:
        record, side_effects = action.act(d, snapshot, draft)
        # Always append a comprehensive status announcement so voice covers ALL
        # crowded platforms (e.g. both A and B RED), not just the one acted on.
        status_se = action.status_announce(snapshot, safety_r.failsafe)
        side_effects.dashboard_msgs.extend(status_se.dashboard_msgs)
        return TickResult(True, d.reason, decision=record, side_effects=side_effects)

    # Produce a voice status announcement for every non-action tick so the
    # TTS system speaks in ALL situations — green, yellow, crowded-but-stuck,
    # or fail-safe/no-data — not just when the agent takes action.
    side_effects = action.status_announce(snapshot, safety_r.failsafe)
    return TickResult(False, d.reason, side_effects=side_effects)
