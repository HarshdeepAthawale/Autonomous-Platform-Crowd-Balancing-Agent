"""FastAPI entrypoint — routers, WebSocket endpoints, and the TTL sweep task.

Run: uvicorn app.main:app --reload   (from the backend/ directory)
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .agent_runner import agent_loop
from .config import settings
from .deps import store
from .routers import agent, density, override, scan, scheduling, state
from .services import state_payload
from .ws import manager


async def _sweep_loop():
    """Purge expired records every loop tick (Rules.md §2.5 auto-expiry)."""
    while True:
        store.sweep()
        await asyncio.sleep(settings.loop_period_sec)


@asynccontextmanager
async def lifespan(app: FastAPI):
    tasks = [
        asyncio.create_task(_sweep_loop()),
        asyncio.create_task(agent_loop()),   # autonomous Station Supervisor loop
    ]
    try:
        yield
    finally:
        for t in tasks:
            t.cancel()


app = FastAPI(title="Crowd-Balancing Agent — Backend", version="0.1.0", lifespan=lifespan)

# Demo-permissive CORS; tighten for real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (scan, density, state, scheduling, override, agent):
    app.include_router(r.router)


@app.get("/health")
async def health():
    return {"ok": True, "service": "crowd-balancing-backend"}


@app.websocket("/ws/dashboard")
async def ws_dashboard(ws: WebSocket):
    await manager.connect("dashboard", ws)
    await ws.send_json(state_payload())  # initial snapshot to this client
    try:
        while True:
            await ws.receive_text()  # keep-alive; client may ping
    except WebSocketDisconnect:
        manager.disconnect("dashboard", ws)


@app.websocket("/ws/display/{platform_id}")
async def ws_display(ws: WebSocket, platform_id: str):
    channel = f"display:{platform_id}"
    await manager.connect(channel, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(channel, ws)
