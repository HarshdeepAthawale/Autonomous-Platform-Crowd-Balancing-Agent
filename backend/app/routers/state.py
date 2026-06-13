"""GET /api/state — fused per-platform live snapshot (the agent's perception)."""
from fastapi import APIRouter

from ..deps import schedule, store
from ..fusion import build_states

router = APIRouter()


@router.get("/api/state")
async def get_state():
    return [s.model_dump(mode="json") for s in build_states(store, schedule)]
