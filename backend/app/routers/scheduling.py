"""POST /api/scheduling/hold — mock hold-signal target for the agent.

Hold minutes are hard-capped in Schedule.hold() per Rules.md §1.3.
"""
from fastapi import APIRouter, HTTPException

from ..deps import schedule
from ..models import HoldIn
from ..services import broadcast_state

router = APIRouter()


@router.post("/api/scheduling/hold")
async def hold(body: HoldIn):
    if body.train_id not in schedule.trains:
        raise HTTPException(status_code=404, detail="unknown train_id")
    t = schedule.hold(body.train_id, body.minutes)
    await broadcast_state()
    return {
        "ok": True,
        "train_id": t["train_id"],
        "new_eta": t["current_eta"].isoformat(),
        "hold_min": t["hold_min"],
    }
