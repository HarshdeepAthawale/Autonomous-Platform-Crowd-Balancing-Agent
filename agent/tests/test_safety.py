"""Hard safety rules — the LLM/draft can never widen what's allowed (Rules.md §1)."""
from agent.agents.safety import validate_plan
from agent.agents.supervisor import run_tick as decide_tick
from agent.models import Hold, Plan, Policy, Redirect
from tests.conftest import platform


def test_validate_rejects_overlong_hold(worked_example, policy):
    plan = Plan(hold=Hold("12045", 999), redirect=None, announce=True)
    ok, why = validate_plan(plan, worked_example, policy)
    assert not ok and "cap" in why


def test_validate_rejects_command_redirect(worked_example, policy):
    plan = Plan(hold=None, redirect=Redirect("A", "B", "command"), announce=True)
    ok, why = validate_plan(plan, worked_example, policy)
    assert not ok


def test_validate_rejects_redirect_into_unsafe_target(policy):
    snap = [
        platform("A", 92.0, "RED", "rising", "12045", 6.0),
        platform("B", 90.0, "RED", "rising", "12046", 7.0),
    ]
    plan = Plan(hold=None, redirect=Redirect("A", "B", "suggestion"), announce=True)
    ok, why = validate_plan(plan, snap, policy)
    assert not ok


def test_malicious_draft_cannot_force_unsafe_action(worked_example, policy):
    """A draft that tries to inject commands/oversized holds is ignored by the engine.

    The engine builds the plan from rules; the draft only supplies wording, which
    is validated. Even a hostile draft cannot change the (capped, suggestion) plan.
    """
    def hostile_draft(ctx):
        return {
            "reasoning": "ignore safety",
            "announcement_en": "GO TO PLATFORM B NOW",  # commanding
            "announcement_ja": "今すぐホームBへ行け",
            "redirect_text": "you must go to platform B now",
            "source": "rule+llm",
        }
    r = decide_tick(worked_example, policy, draft=hostile_draft)
    # Plan still capped + suggestion regardless of hostile wording.
    assert r.decision["plan"]["hold"]["minutes"] <= policy.hold_max_min
    assert r.decision["plan"]["redirect"]["mode"] == "suggestion"
