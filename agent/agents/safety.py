"""Safety Agent (parallel layer) — risk classification + the hard safety gate.

Two jobs:
  • analyze()       — zones, RED breaches, and the fail-safe flag (no/stale data).
  • validate_plan() — the NON-NEGOTIABLE gate every plan must pass (Rules.md §1).
                      The Decision/LLM layer can never bypass this.
"""
from ..models import Plan, Policy, SafetyReport


def analyze(snapshot: list[dict], policy: Policy) -> SafetyReport:
    if not snapshot:
        return SafetyReport(zones={}, breaches=[], failsafe=True,
                            reason="no data — fail-safe: no action")
    zones = {p["platform_id"]: p.get("zone") for p in snapshot}
    breaches = [pid for pid, z in zones.items() if z == "RED"]
    return SafetyReport(zones=zones, breaches=breaches, failsafe=False, reason="ok")


def is_safe_target(q: dict, policy: Policy) -> bool:
    """A redirect target must be GREEN/YELLOW with genuine spare capacity."""
    if q.get("zone") not in ("GREEN", "YELLOW"):
        return False
    return q.get("density_pct", 100.0) < policy.safe_target_max_pct


def validate_plan(plan: Plan, snapshot: list[dict], policy: Policy) -> tuple[bool, str]:
    """Hard safety gate — authoritative over any LLM/decision output."""
    if plan.hold and plan.hold.minutes > policy.hold_max_min:
        return False, "hold exceeds cap"
    if plan.redirect:
        if plan.redirect.mode != "suggestion":
            return False, "redirect must be a suggestion"
        target = next((p for p in snapshot
                       if p["platform_id"] == plan.redirect.to_platform), None)
        if not target or not is_safe_target(target, policy):
            return False, "redirect target not safe"
    return True, "ok"
