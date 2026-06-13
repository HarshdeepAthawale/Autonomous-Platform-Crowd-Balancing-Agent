"""Decision Agent — synthesizes Crowd + Train + Safety reports into a safe Plan.

Consumes the three parallel reports and produces a validated DecisionOutput.
Every plan is checked by the Safety Agent's hard gate before it leaves here.
"""
from ..types import (CrowdReport, DecisionOutput, Hold, Plan, Policy, Redirect,
                     SafetyReport, TrainReport)
from . import safety


def _by_id(snapshot: list[dict], pid: str) -> dict | None:
    return next((p for p in snapshot if p["platform_id"] == pid), None)


def best_alternative(red_p: dict, snapshot: list[dict], policy: Policy) -> dict | None:
    """Greenest platform with spare capacity and a near-term train."""
    rp_train = red_p.get("next_train")
    if not rp_train:
        return None
    opts = [
        q for q in snapshot
        if q["platform_id"] != red_p["platform_id"]
        and safety.is_safe_target(q, policy)
        and q.get("next_train")
        and q["next_train"]["eta_min"] <= rp_train["eta_min"] + policy.grace_min
    ]
    return min(opts, key=lambda q: (q["density_pct"], q["next_train"]["eta_min"]),
               default=None)


def evaluate(snapshot: list[dict], policy: Policy) -> dict[str, dict | None]:
    """RED+rising platform -> its best safe alternative (or None)."""
    return {
        p["platform_id"]: best_alternative(p, snapshot, policy)
        for p in snapshot
        if p.get("zone") == "RED" and p.get("trend") == "rising"
    }


def decide(snapshot: list[dict], crowd: CrowdReport, train: TrainReport,
           safety_r: SafetyReport, policy: Policy) -> DecisionOutput:
    # Safety Agent fail-safe is absolute.
    if safety_r.failsafe:
        return DecisionOutput(False, safety_r.reason)

    if not crowd.crowded_rising:
        return DecisionOutput(False, "all platforms within safe limits")

    red_id = crowd.crowded_rising[0]
    red_p = _by_id(snapshot, red_id)

    # No-thrash: Train Agent says this platform's train is already held.
    if not train.holdable.get(red_id, False):
        rt = train.next_train.get(red_id)
        if rt and rt.get("held"):
            return DecisionOutput(False, f"already holding {rt['train_id']} for {red_id}")
        return DecisionOutput(False, f"{red_id} RED but no train to hold — operator alert")

    red_train = train.next_train[red_id]
    target = best_alternative(red_p, snapshot, policy)
    minutes = policy.hold_max_min

    if target is None:
        # Hold-only + operator alert (no safe target to redirect to).
        plan = Plan(hold=Hold(red_train["train_id"], minutes), redirect=None, announce=True)
    else:
        plan = Plan(
            hold=Hold(red_train["train_id"], minutes),
            redirect=Redirect(red_id, target["platform_id"], "suggestion"),
            announce=True,
        )

    ok, why = safety.validate_plan(plan, snapshot, policy)
    if not ok:
        return DecisionOutput(False, f"plan rejected by safety rules: {why}")

    reason = ("hold-only (no safe target)" if target is None
              else "hold + redirect + announce")
    return DecisionOutput(True, reason, red_p=red_p, target=target, plan=plan)
