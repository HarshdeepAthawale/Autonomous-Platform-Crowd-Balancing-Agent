# CV — Phase 2 (Computer Vision Density Pipeline)

Per-platform person counting that feeds **density %** into the backend — and never
stores a frame. See [../plan/Phase2-Computer-Vision.md](../plan/Phase2-Computer-Vision.md).

Two paths:
- **Synthetic (default, primary demo path)** — deterministic worked-example arc, no
  camera or YOLO needed. Runs on any laptop.
- **Real YOLOv8** — `ultralytics` + `opencv` person detection from webcams/clips.

## Run
```bash
# 1) start the backend first (see ../backend/README.md)
cd backend && uvicorn app.main:app    # http://127.0.0.1:8000

# 2a) synthetic feed (default — no camera)
cd cv && python -m cv.run

# 2b) real YOLOv8 from configured sources
USE_SYNTHETIC=false python -m cv.run
```

## Test
```bash
cd cv && pytest -q        # density math, synthetic arc, payload privacy, no-frame-write
```

## Configuration (`config.py`, env-overridable)
| Key | Default | Purpose |
|-----|---------|---------|
| `BACKEND_URL` | `http://127.0.0.1:8000` | where to POST density |
| `USE_SYNTHETIC` | `true` | synthetic vs real YOLOv8 |
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
├── publisher.py   POST /api/density
├── run.py         entrypoint (picks synthetic vs real)
└── config.py
```
