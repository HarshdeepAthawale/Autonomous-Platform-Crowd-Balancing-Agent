"""WebSocket integration tests — verifies all three dashboard message types.

Exit criterion (Phase1 plan §2): /ws/dashboard pushes a state_update on every change.
Schema.md §4: state_update must have ts; graph_point emitted on density updates;
override broadcasts to dashboard.
"""
import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ws_sends_initial_state_update():
    """Dashboard WS connection immediately receives a state_update snapshot."""
    with client.websocket_connect("/ws/dashboard") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "state_update"
        assert "platforms" in msg
        assert "ts" in msg                        # Schema.md §4 requires ts
        assert isinstance(msg["platforms"], list)


def test_ws_state_update_pushed_on_scan():
    """Posting a scan triggers a state_update broadcast to WS subscribers."""
    with client.websocket_connect("/ws/dashboard") as ws:
        ws.receive_json()  # consume initial snapshot

        client.post("/api/scan", json={"platform_id": "A", "train_id": "12045"})
        msg = ws.receive_json()

        assert msg["type"] == "state_update"
        assert "ts" in msg
        a = next(p for p in msg["platforms"] if p["platform_id"] == "A")
        assert a["arrival_rate_per_min"] >= 0


def test_ws_state_update_and_graph_point_pushed_on_density():
    """Posting density triggers a state_update AND a graph_point on the dashboard."""
    with client.websocket_connect("/ws/dashboard") as ws:
        ws.receive_json()  # consume initial snapshot

        client.post("/api/density", json={"platform_id": "B", "count": 120})

        # Two messages expected: state_update then graph_point (or vice-versa)
        messages = [ws.receive_json(), ws.receive_json()]
        types = {m["type"] for m in messages}
        assert "state_update" in types
        assert "graph_point" in types

        gp = next(m for m in messages if m["type"] == "graph_point")
        assert gp["platform_id"] == "B"
        assert gp["density_pct"] == round(120 / 200 * 100, 1)  # 60.0
        assert "ts" in gp


def test_ws_override_broadcast():
    """POST /api/override broadcasts an override message to the dashboard."""
    with client.websocket_connect("/ws/dashboard") as ws:
        ws.receive_json()  # initial snapshot

        client.post("/api/override", json={"action_id": "dec_001", "decision": "cancel"})
        msg = ws.receive_json()

        assert msg["type"] == "override"
        assert msg["action_id"] == "dec_001"
        assert msg["decision"] == "cancel"


def test_ws_display_channel_isolated():
    """/ws/display/{id} receives signage-type messages, not dashboard messages."""
    with client.websocket_connect("/ws/display/A") as disp:
        # Display channel has no initial snapshot, so we send a scan and
        # confirm the display socket does NOT receive dashboard state_updates.
        # (it only gets messages pushed explicitly to display:A channel)
        import threading, time

        received = []

        def drain():
            time.sleep(0.5)
            try:
                received.append(disp.receive_json(timeout=0.3))
            except Exception:
                pass

        t = threading.Thread(target=drain)
        t.start()
        client.post("/api/scan", json={"platform_id": "A", "train_id": "12045"})
        t.join()

        # Display channel should NOT have received the dashboard state_update
        for msg in received:
            assert msg.get("type") != "state_update"
