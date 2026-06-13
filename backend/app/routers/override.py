"""POST /api/override — operator override hook (Rules.md §1.6).

Phase 1 acknowledges + broadcasts the override to the dashboard. Full action
cancellation is wired alongside the agent in Phase 3/4.
"""
from fastapi import APIRouter

from ..models import OverrideIn
from ..ws import manager

router = APIRouter()


@router.post("/api/override")
async def override(body: OverrideIn):
    await manager.broadcast("dashboard", {
        "type": "override",
        "action_id": body.action_id,
        "decision": body.decision,
    })
    return {"ok": True, "action_id": body.action_id, "decision": body.decision}
