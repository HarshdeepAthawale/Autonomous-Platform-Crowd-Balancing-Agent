"""POST /api/override — operator override hook (Rules.md §1.6).

Looks up the decision by id, reverses its train hold (if any), marks the
decision as operator-overridden, and tells the agent not to re-hold that
train. Broadcasts the override + refreshed state so the dashboard/boards
clear the HELD badge immediately.
"""
from fastapi import APIRouter

from ..agent_runner import decisions, mark_overridden
from ..deps import schedule
from ..models import OverrideIn
from ..services import broadcast_state
from ..ws import manager

router = APIRouter()


@router.post("/api/override")
async def override(body: OverrideIn):
    rec = next((d for d in decisions() if d.get("decision_id") == body.action_id), None)
    cancelled = False

    if rec and body.decision == "cancel":
        rec["operator_override"] = True
        hold = (rec.get("plan") or {}).get("hold")
        train_id = hold.get("train_id") if hold else None
        if train_id and train_id in schedule.trains:
            schedule.cancel_hold(train_id)
            mark_overridden(train_id)   # agent won't re-hold it
            cancelled = True

    await manager.broadcast("dashboard", {
        "type": "override",
        "action_id": body.action_id,
        "decision": body.decision,
        "cancelled": cancelled,
    })
    if cancelled:
        await broadcast_state()   # push fresh state so HELD clears everywhere

    return {"ok": True, "action_id": body.action_id, "decision": body.decision, "cancelled": cancelled}
