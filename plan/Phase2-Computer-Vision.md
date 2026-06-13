# Phase 2 — Computer Vision Density Pipeline (In-Depth)
### Autonomous Platform Crowd-Balancing Agent
**Goal:** Real-time, per-platform person counting that feeds density % into the backend —
without ever storing a frame.
**Duration estimate:** ~1–1.5 days · **Owner:** CV
**Depends on:** Phase 1 (`POST /api/density`) · **Unblocks:** Phase 3 (real signals)

---

## 1. Objectives
1. Run YOLOv8 person detection on a video source (webcam or clip) in real time.
2. Convert person count → density % using per-platform capacity calibration.
3. Smooth counts (rolling average) and derive trend (rising/falling/stable).
4. Push `DensityReading` to the backend; **never write a frame to disk**.
5. Support **two sources = two platforms** (A & B) for the demo.
6. Provide a **synthetic-density fallback** driven by the "scan" buttons, so the demo
   never depends on a camera or lighting.

## 2. Exit Criteria
- [ ] Counts update at the backend within ≤2s of a frame.
- [ ] Two platforms report independent density % simultaneously.
- [ ] Frames are provably never persisted (grep: no `imwrite`/`VideoWriter`).
- [ ] Synthetic fallback produces a realistic rising/falling curve on demand.
- [ ] Rolling average visibly suppresses single-frame jitter.

---

## 3. Directory Layout
```
cv/
├── detector.py        # YOLOv8 load + per-frame person count
├── density.py         # count -> density %, rolling average, trend
├── sources.py         # webcam / video-file / multi-source manager
├── publisher.py       # POST DensityReading to backend (httpx)
├── worker.py          # main loop: for each source -> detect -> smooth -> publish
├── synthetic.py       # fallback density generator (no camera needed)
├── config.py          # source map, capacity, frame stride, model path
└── requirements.txt
```

## 4. Dependencies
```
ultralytics        # YOLOv8
opencv-python
numpy
httpx
```
Model: `yolov8n.pt` (nano — fastest, fine for person counting on a laptop). Keep weights
**out of git** (`.gitignore` already excludes `*.pt`).

---

## 5. Implementation Detail

### 5.1 Detector (`detector.py`)
```python
from ultralytics import YOLO
PERSON_CLASS = 0

class PersonCounter:
    def __init__(self, model_path="yolov8n.pt", conf=0.35):
        self.model = YOLO(model_path); self.conf = conf
    def count(self, frame) -> int:
        # stream=False, classes=[0] keeps only 'person'; frame stays in memory
        res = self.model.predict(frame, classes=[PERSON_CLASS],
                                 conf=self.conf, verbose=False)
        return int(len(res[0].boxes))
```
> **Privacy:** the frame (`numpy` array) is passed by reference and discarded after
> `count()` returns. No `cv2.imwrite`, no `VideoWriter`, ever.

### 5.2 Density + smoothing (`density.py`)
```python
from collections import deque

class DensityTracker:
    def __init__(self, capacity: int, window: int = 10):
        self.capacity = capacity; self.buf = deque(maxlen=window)
    def update(self, count: int) -> dict:
        self.buf.append(count)
        smooth = sum(self.buf) / len(self.buf)
        pct = min(100.0, round(smooth / self.capacity * 100, 1))
        return {"count": round(smooth), "density_pct": pct,
                "trend": self._trend()}
    def _trend(self):
        if len(self.buf) < 4: return "stable"
        d = self.buf[-1] - self.buf[0]
        return "rising" if d > 3 else "falling" if d < -3 else "stable"
```

### 5.3 Sources (`sources.py`)
- Webcam: `cv2.VideoCapture(0)` / `(1)` for two cameras.
- Clips: `cv2.VideoCapture("platformA.mp4")` (loop on EOF for continuous demo).
- **Frame stride:** process every Nth frame (e.g. 3) to hit the latency budget on CPU.

### 5.4 Worker loop (`worker.py`)
```python
for frame in source:                 # per platform, on a thread/process
    if i % STRIDE: continue
    n = counter.count(frame)
    reading = tracker.update(n)
    publisher.send(platform_id, reading)   # POST /api/density
```
Run one worker per platform (thread, asyncio task, or two processes).

### 5.5 Synthetic fallback (`synthetic.py`)
Generate density from the backend's arrival counter (or a scripted curve): each "scan"
button press nudges the platform's synthetic count up; idle decays it down. This lets the
**entire demo run with no camera** and makes the worked scenario (A→92%) deterministic.

---

## 6. Calibration
`density_pct = smoothed_count / platform_capacity * 100`. Set `platform_capacity` per
platform in config (matches backend `settings.platform_capacity`). For clips, pick a
capacity that makes the clip's max crowd ≈ 90–95% so the Red zone triggers on cue.

## 7. Performance Targets
| Metric | Target | Lever |
|---|---|---|
| Frame→backend latency | ≤2s | `yolov8n`, frame stride, lower resolution |
| Per-source FPS (CPU) | ≥3–5 effective | stride + resize input to 480p |
| Jitter | smoothed | rolling window (8–10 frames) |

## 8. Testing
- Unit: `DensityTracker.update` math + trend transitions.
- Integration: run worker against a sample clip → confirm backend `GET /api/state` moves.
- Privacy check: `grep -rE "imwrite|VideoWriter" cv/` returns nothing.
- Fallback: disable camera → synthetic path still drives the demo.

## 9. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| YOLO too slow on CPU | nano model + frame stride + 480p input |
| Occlusion / lighting miscounts | rolling average; thresholds tolerate noise |
| Camera unavailable at demo | synthetic fallback (primary demo path) |
| Double-counting across frames | counting per-frame snapshots, not tracking IDs (density only) |

## 10. Deliverables
- `cv/` worker counting 2 platforms into the backend.
- Synthetic fallback wired to the demo.
- Sample clips (kept out of git per privacy `.gitignore`).
- [../Tracker.md] Phase 2 rows → ✅.

## 11. Handoff to Phase 3
The agent now perceives **real** density via `GET /api/state`. Keep the synthetic path
selectable so Phase 3 + the demo are reproducible regardless of hardware.
