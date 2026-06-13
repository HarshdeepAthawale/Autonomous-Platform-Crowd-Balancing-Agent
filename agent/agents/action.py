"""Action Agent — turns a validated Plan into executable side effects + wording.

Produces: the hold call descriptor, the dashboard agent_action message, signage +
redirect messages for the displays, and the AgentDecision record (Schema.md §2.5).
Calm bilingual wording comes from the draft fn (template by default; Claude if a
key is set). The Action Agent never re-decides — it only executes.
"""
from datetime import datetime, timezone

from ..llm import template_draft
from ..types import DecisionOutput, Plan, SideEffects


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _by_id(snapshot, pid):
    return next((p for p in snapshot if p["platform_id"] == pid), None)


def _signage(pid, snapshot, banner):
    p = _by_id(snapshot, pid) or {}
    return pid, {
        "type": "signage",
        "platform_id": pid,
        "zone": p.get("zone"),
        "count": p.get("count"),
        "banner": banner,
    }


def _decision_record(red_p, plan: Plan, d: dict, actions: list[str]) -> dict:
    return {
        "decision_id": f"dec_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S_%f')}",
        "ts": _now_iso(),
        "trigger": {
            "platform_id": red_p["platform_id"],
            "zone": red_p.get("zone"),
            "density_pct": red_p.get("density_pct"),
            "rising": red_p.get("trend") == "rising",
        },
        "reasoning": d["reasoning"],
        "plan": {
            "hold": ({"train_id": plan.hold.train_id, "minutes": plan.hold.minutes}
                     if plan.hold else None),
            "redirect": ({"from": plan.redirect.from_platform,
                          "to": plan.redirect.to_platform, "mode": plan.redirect.mode}
                         if plan.redirect else None),
            "announce": plan.announce,
        },
        "actions_taken": actions,
        "source": d.get("source", "rule"),
        "announcement": {"ja": d.get("announcement_ja", ""), "en": d.get("announcement_en", "")},
        "operator_override": False,
        "outcome": None,
    }


def act(decision: DecisionOutput, snapshot: list[dict], draft=None) -> tuple[dict, SideEffects]:
    draft = draft or (lambda ctx: template_draft(ctx))
    red_p, target, plan = decision.red_p, decision.target, decision.plan
    minutes = plan.hold.minutes if plan.hold else 0

    if target is None:
        # Hold-only + operator alert.
        d = draft({"hold_only": True, "red_id": red_p["platform_id"],
                   "red_pct": red_p["density_pct"], "train_id": plan.hold.train_id,
                   "minutes": minutes})
        record = _decision_record(red_p, plan, d, ["HOLD", "ANNOUNCE", "OPERATOR_ALERT"])
        se = SideEffects(
            hold=plan.hold,
            dashboard_msgs=[{"type": "agent_action", "decision": record}],
            display_msgs=[_signage(red_p["platform_id"], snapshot,
                                   f"列車保留 +{minutes}分 / Train held +{minutes}m for your safety")],
        )
        return record, se

    d = draft({
        "red_id": red_p["platform_id"], "red_pct": red_p["density_pct"],
        "target_id": target["platform_id"], "target_zone": target["zone"],
        "target_pct": target["density_pct"], "target_eta": target["next_train"]["eta_min"],
        "train_id": plan.hold.train_id, "minutes": minutes,
    })
    record = _decision_record(red_p, plan, d,
                             ["HOLD", "REDIRECT_SUGGESTION", "ANNOUNCE", "SIGNAGE"])
    se = SideEffects(
        hold=plan.hold,
        dashboard_msgs=[{"type": "agent_action", "decision": record}],
        display_msgs=[
            _signage(red_p["platform_id"], snapshot,
                     f"列車保留 +{minutes}分 / Train held +{minutes}m for your safety"),
            _signage(target["platform_id"], snapshot,
                     f"ゆとりあり / Extra capacity — train in {target['next_train']['eta_min']} min"),
            (red_p["platform_id"], {"type": "redirect", "from": red_p["platform_id"],
                                    "to": target["platform_id"],
                                    "text": d.get("redirect_text", ""), "mode": "suggestion"}),
        ],
    )
    return record, se
