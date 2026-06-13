"""Cross-cutting helpers shared by routers and the WS endpoints."""
from .deps import schedule, store
from .fusion import build_states
from .ws import manager


def state_payload() -> dict:
    states = build_states(store, schedule)
    return {
        "type": "state_update",
        "platforms": [s.model_dump(mode="json") for s in states],
    }


async def broadcast_state():
    await manager.broadcast("dashboard", state_payload())
