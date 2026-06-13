"""POST /api/density — ingest a per-platform headcount reading from the CV worker."""
from fastapi import APIRouter

from ..config import settings
from ..deps import schedule, store
from ..models import DensityIn
from ..services import broadcast_graph_point, broadcast_state
from ..zones import trend_of

router = APIRouter()


@router.post("/api/density")
async def density(body: DensityIn):
    pct = body.density_pct
    if pct is None:
        cap = settings.platform_capacity.get(body.platform_id, 200)
        pct = min(100.0, round(body.count / cap * 100, 1))

    trend = trend_of(store.density_history(body.platform_id) + [pct])
    expires_at = schedule.expiry_for(body.platform_id)
    store.add_density(body.platform_id, body.count, pct, trend, expires_at)
    await broadcast_state()
    await broadcast_graph_point(body.platform_id, pct)  # Schema.md §4
    return {"ok": True, "density_pct": pct, "trend": trend.value}
