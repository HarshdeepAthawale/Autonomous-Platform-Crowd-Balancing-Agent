"""POST /api/scan — log an anonymous arrival (platform + train only)."""
from fastapi import APIRouter

from ..deps import schedule, store
from ..models import ScanIn
from ..services import broadcast_state

router = APIRouter()


@router.post("/api/scan")
async def scan(body: ScanIn):
    # Only platform_id + train_id reach us; any PII in the payload is already dropped.
    expires_at = schedule.expiry_for(body.platform_id)
    store.add_arrival(body.platform_id, body.train_id, expires_at)
    await broadcast_state()
    return {"ok": True, "platform_count": store.arrival_count(body.platform_id)}
