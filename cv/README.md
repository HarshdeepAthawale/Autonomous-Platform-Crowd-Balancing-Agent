# CV — Phase 2 (Computer Vision Density Pipeline)

Per-platform person counting that feeds **density %** into the backend — and never
stores a frame. See [../plan/Phase2-Computer-Vision.md](../plan/Phase2-Computer-Vision.md).

Three run modes (`CV_MODE`):
- **`synthetic`** (default, primary demo path) — deterministic worked-example arc, no
  camera or YOLO needed. Runs on any laptop.
- **`hybrid`** — Platform A counts **real people from the webcam** (YOLOv8), the other
  platform(s) stay synthetic GREEN so the agent can still redirect A→B. Best live demo.
- **`real`** — every platform from its configured `sources` (webcams / clips).

## Run
Run `python -m cv.run` **from the project root** (so the `cv` package resolves):
```bash
# 1) start the backend first (see ../backend/README.md)
cd backend && uvicorn app.main:app    # http://127.0.0.1:8000

# 2) from the PROJECT ROOT, with the cv venv active:
source cv/.venv/bin/activate

# 2a) synthetic feed (default — no camera)
python -m cv.run

# 2b) HYBRID: real webcam -> Platform A (YOLO), others synthetic
CV_MODE=hybrid LOG_LATENCY=true python -m cv.run

# 2c) real YOLOv8 for every platform (USE_SYNTHETIC=false is a back-compat alias)
CV_MODE=real python -m cv.run
```
> First real/hybrid run auto-downloads `yolov8n.pt` (~6 MB). The webcam platform uses a
> small `webcam_capacity` (default 4) so a handful of people fills the gauge Green→Red.

## Test
```bash
cd cv && pytest -q        # density math, synthetic arc, payload privacy, no-frame-write
```

## Configuration (`config.py`, env-overridable)
| Key | Default | Purpose |
|-----|---------|---------|
| `BACKEND_URL` | `http://127.0.0.1:8000` | where to POST density |
| `CV_MODE` | `synthetic` | `synthetic` / `hybrid` / `real` |
| `WEBCAM_PLATFORM` | `A` | which platform the webcam drives (hybrid) |
| `WEBCAM_SOURCE` | `0` | webcam index / clip path for the real platform |
| `WEBCAM_CAPACITY` | `12` | small capacity so a few people fill the gauge |
| `USE_SYNTHETIC` | `true` | back-compat: `false` ⇒ `CV_MODE=real` |
| `MODEL_PATH` | `yolov8n.pt` | YOLOv8 weights (kept out of git) |
| `FRAME_STRIDE` | `3` | process every Nth frame |
| `SMOOTHING_WINDOW` | `10` | rolling-average frames |
| `SOURCES` | `{"A":"0","B":"1"}` | platform → webcam idx / clip path |
| `PLATFORM_CAPACITY` | `{"A":200,"B":200}` | density % calibration (match backend) |

## Privacy (Rules.md §2)
- Frames are processed in memory and discarded — **no `imwrite`, no `VideoWriter`**
  anywhere (enforced by `tests/test_privacy.py`).
- The publish payload carries only `platform_id`, `count`, `density_pct` — never a frame.

## Layout
```
cv/
├── detector.py    YOLOv8 person count (real path)
├── sources.py     webcam/clip capture (real path)
├── worker.py      real CV loop: frame → detect → smooth → publish
├── density.py     count → density %, rolling average, trend
├── synthetic.py   deterministic worked-example feed (default demo path)
├── hybrid.py      webcam -> one platform (YOLO) + synthetic for the rest
├── publisher.py   POST /api/density
├── run.py         entrypoint (dispatches on CV_MODE)
└── config.py
```
