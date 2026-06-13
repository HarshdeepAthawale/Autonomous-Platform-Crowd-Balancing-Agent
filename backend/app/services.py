"""Cross-cutting helpers shared by routers and the WS endpoints."""
from datetime import datetime, timezone

from .deps import schedule, store
from .fusion import build_states
from .ws import manager


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def state_payload() -> dict:
    states = build_states(store, schedule)
    return {
        "type": "state_update",
        "platforms": [s.model_dump(mode="json") for s in states],
        "ts": _now_iso(),  # Schema.md §4
    }


def graph_point_payload(platform_id: str, density_pct: float) -> dict:
    """Schema.md §4: emitted on every density update so the chart can stream."""
    return {
        "type": "graph_point",
        "platform_id": platform_id,
        "density_pct": density_pct,
        "ts": _now_iso(),
    }


async def broadcast_state():
    await manager.broadcast("dashboard", state_payload())


async def broadcast_graph_point(platform_id: str, density_pct: float):
    await manager.broadcast("dashboard", graph_point_payload(platform_id, density_pct))
