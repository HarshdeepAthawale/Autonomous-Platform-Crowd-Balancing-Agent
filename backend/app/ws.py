"""WebSocket connection manager with channel fan-out (Schema.md §4).

Channels: "dashboard" and "display:{platform_id}". Dead sockets are dropped on
the next broadcast.
"""
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.channels: dict[str, list[WebSocket]] = {}

    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        self.channels.setdefault(channel, []).append(ws)

    def disconnect(self, channel: str, ws: WebSocket):
        conns = self.channels.get(channel, [])
        if ws in conns:
            conns.remove(ws)

    async def broadcast(self, channel: str, msg: dict):
        for ws in list(self.channels.get(channel, [])):
            try:
                await ws.send_json(msg)
            except Exception:
                self.disconnect(channel, ws)


manager = ConnectionManager()
