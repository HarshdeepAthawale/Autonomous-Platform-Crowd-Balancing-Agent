"""Agent endpoints — manual tick (demo control) + decision history."""
from fastapi import APIRouter

from ..agent_runner import decisions, run_tick

router = APIRouter()


@router.post("/api/agent/tick")
async def tick():
    """Run one perceive->decide->act pass immediately (for the demo)."""
    r = await run_tick()
    return {"action": r.action, "reason": r.reason, "decision": r.decision}


@router.get("/api/agent/decisions")
async def get_decisions():
    return decisions()
