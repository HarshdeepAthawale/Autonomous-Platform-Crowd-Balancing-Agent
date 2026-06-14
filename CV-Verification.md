# CV Verification — Real YOLOv8 on a connected machine

The demo uses the **synthetic** density feed (deterministic, no camera). This runbook is
for proving the **real YOLOv8** path works end-to-end and for measuring frame→backend
latency. It must be run on a machine **with internet + a webcam (or a sample clip)** —
the weights download (~6 MB) and `ultralytics`/`opencv` install both need a connection.

> Privacy holds on this path too: frames are processed in memory and discarded. There is
> no `cv2.imwrite` / `VideoWriter` anywhere (enforced by `cv/tests/test_privacy.py`).
> Only `platform_id`, `count`, `density_pct` leave the worker.

---

## 1. Install (one time)

```bash
cd cv
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt        # ultralytics + opencv-python + httpx + pydantic-settings
```

The first `YOLO("yolov8n.pt")` call auto-downloads the nano weights to the cwd. To
pre-fetch:
```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

## 2. Run the real pipeline

Start the backend first (separate terminal):
```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8000
```

Then the CV feed — run `python -m cv.run` **from the project root** (so the `cv` package
resolves), with the cv venv active:
```bash
source cv/.venv/bin/activate
```

**A) HYBRID (recommended for the demo)** — webcam drives Platform A (real YOLO), Platform B
stays synthetic GREEN so the agent can redirect A→B:
```bash
CV_MODE=hybrid LOG_LATENCY=true python -m cv.run
```
Stand in front of the camera → A's gauge climbs Green→Red (small `WEBCAM_CAPACITY`, default
4: 1 person 25%, 3 → 75% YELLOW, 4 → RED) → the agent holds A's train and suggests B. Solo
demo? set `WEBCAM_CAPACITY=1`. Tune `WEBCAM_SOURCE` for the camera index.

**B) Webcam for every platform** (`{"A":"0","B":"1"}` = camera indexes):
```bash
CV_MODE=real LOG_LATENCY=true python -m cv.run
```

**C) Sample clip(s)** — point a platform at a video file instead of a camera index.
`SOURCES` is JSON, `platform_id -> webcam index or clip path`:
```bash
CV_MODE=real LOG_LATENCY=true \
  SOURCES='{"A":"/path/to/people_clip.mp4","B":"/path/to/empty_platform.mp4"}' \
  python -m cv.run
```
(A clip loops automatically on EOF, so it runs as a continuous demo feed.)

## 3. What success looks like

- Worker logs per-frame lines like `[cv/worker] A detect 38ms count=12` (LOG_LATENCY=true).
- `curl http://localhost:8000/api/state` shows **`density_pct` / `count` moving** for the
  platform whose source has people in frame, and the **zone** changing GREEN→YELLOW→RED as
  the crowd grows.
- The Dashboard (`http://localhost:5173/`) gauge + graph track the same numbers live.
- The agent loop reacts to a real RED exactly as it does in the synthetic demo.

## 4. Latency check (Tracker 5.5, real path)

With `LOG_LATENCY=true`, read the `detect …ms` figures:
- **Per-frame detection** on `yolov8n` CPU is typically ~30–80 ms (faster on GPU).
- End-to-end **frame → `/api/density` → fused `/api/state`** should land **≤ 2 s**
  (publishing is throttled to `PUBLISH_INTERVAL_SEC`, default 1 s).

Tune for the latency budget via env (see `cv/config.py`):
| Env | Default | Effect |
|-----|---------|--------|
| `FRAME_STRIDE` | `3` | process every Nth frame (higher = less CPU, more lag) |
| `RESIZE_WIDTH` | `640` | downscale before detect (smaller = faster) |
| `CONF` | `0.35` | detection confidence threshold |
| `PUBLISH_INTERVAL_SEC` | `1.0` | min seconds between backend publishes |
| `PLATFORM_CAPACITY` | `{"A":200,"B":200}` | **must match backend** for correct density % |

## 5. Control-flow tests (no camera needed)

The worker loop (stride, publish throttle, clip re-open) is fake-injected and runs without
YOLO or a camera:
```bash
cd cv && source .venv/bin/activate && pytest -q     # 19 pass
```

## 6. Record the result

When verified, note it in [Tracker.md](Tracker.md) row 2.1 (real YOLO inference) with the
measured per-frame ms and the machine/GPU used.
