# Phase 1 — Foundation & Backend Skeleton (In-Depth)
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A privacy-safe FastAPI backend that ingests arrivals + density, fuses them into
per-platform live state, classifies zones, and streams updates over WebSockets.
**Duration estimate:** ~1–1.5 days · **Owner:** Backend
**Depends on:** nothing · **Unblocks:** Phase 2 (CV target), Phase 3 (agent perception), Phase 4 (UI mocks)

---

## 1. Objectives
1. Stand up a runnable FastAPI service with clean module boundaries.
2. Define Pydantic models that **mirror [../Schema.md] exactly** — with *no PII fields*.
3. Ingest two signals: ticket arrivals (`/api/scan`) and density readings (`/api/density`).
4. Maintain an in-memory live state + rolling time-series, with **TTL auto-expiry**.
5. Provide a mock train schedule + mock hold endpoint.
6. Broadcast state, agent actions, and graph points over WebSockets.
7. Centralize all thresholds/caps in config — no magic numbers.

## 2. Exit Criteria (Definition of Done)
- [ ] `GET /api/state` returns a correct `PlatformState[]` with zone classification.
- [ ] Posting scans increments the right platform's arrival counter.
- [ ] Posting density updates density %, count, and trend.
- [ ] Expired records are purged ≤1h after train departure (verified via a fast-clock test).
- [ ] `/ws/dashboard` pushes a `state_update` on every change.
- [ ] No model/table can hold name/phone/face/payment fields (code-reviewed).

---

## 3. Directory Layout
```
backend/
├── app/
│   ├── main.py              # FastAPI app + router mount + WS endpoints
│   ├── config.py            # thresholds, caps, loop period, retention (env-driven)
│   ├── models.py            # Pydantic: ArrivalEvent, DensityReading, PlatformState, ...
│   ├── store.py             # in-memory live state + time-series + TTL sweep
│   ├── schedule.py          # mock TrainSchedule + hold logic
│   ├── fusion.py            # arrivals + density + schedule -> PlatformState
│   ├── zones.py             # density % -> GREEN/YELLOW/RED + trend
│   ├── ws.py                # ConnectionManager (broadcast helpers)
│   └── routers/
│       ├── scan.py          # POST /api/scan
│       ├── density.py       # POST /api/density
│       ├── state.py         # GET /api/state
│       ├── scheduling.py    # POST /api/scheduling/hold (mock)
│       └── override.py      # POST /api/override
├── tests/
│   ├── test_zones.py
│   ├── test_store_expiry.py
│   └── test_state_endpoint.py
├── requirements.txt
└── .env.example
```

## 4. Dependencies (`requirements.txt`)
```
fastapi
uvicorn[standard]
pydantic>=2
python-dotenv
pandas
numpy
pytest
httpx            # test client
```

---

## 5. Implementation Detail

### 5.1 Config (`config.py`)
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    green_max: float = 60.0          # < green_max  -> GREEN
    yellow_max: float = 85.0         # < yellow_max -> YELLOW, else RED
    hold_max_min: int = 10
    grace_min: int = 5
    loop_period_sec: int = 20
    retention_after_departure_min: int = 60
    platform_capacity: dict[str, int] = {"A": 200, "B": 200}
    claude_api_key: str = ""         # used in Phase 3
    class Config: env_file = ".env"

settings = Settings()
```

### 5.2 Models (`models.py`) — privacy-locked
Mirror [../Schema.md]. **Whitelist only** these fields; never add PII.
```python
from datetime import datetime
from enum import Enum
from pydantic import BaseModel

class Zone(str, Enum): GREEN="GREEN"; YELLOW="YELLOW"; RED="RED"
class Trend(str, Enum): RISING="rising"; FALLING="falling"; STABLE="stable"

class ScanIn(BaseModel):        # request body — ONLY these two fields accepted
    platform_id: str
    train_id: str

class DensityIn(BaseModel):
    platform_id: str
    count: int
    density_pct: float | None = None   # server computes if omitted

class NextTrain(BaseModel):
    train_id: str; eta_min: float; held: bool=False; hold_min: int=0

class PlatformState(BaseModel):
    platform_id: str; density_pct: float; count: int
    trend: Trend; zone: Zone; arrival_rate_per_min: float
    next_train: NextTrain | None; capacity: int; ts: datetime
```
> **Guardrail:** `ScanIn` deliberately has no name/phone/seat fields. FastAPI drops any
> extra keys in the JSON body, so PII sent by a client is discarded at the edge.

### 5.3 Zone classifier (`zones.py`)
```python
def classify(density_pct: float) -> Zone:
    if density_pct < settings.green_max:  return Zone.GREEN
    if density_pct < settings.yellow_max: return Zone.YELLOW
    return Zone.RED

def trend_of(history: list[float]) -> Trend:
    if len(history) < 2: return Trend.STABLE
    delta = history[-1] - history[-min(len(history),5)]
    return Trend.RISING if delta > 2 else Trend.FALLING if delta < -2 else Trend.STABLE
```

### 5.4 Store + TTL (`store.py`)
- Live dict `platform_id -> rolling deque[DensityReading]` (last N for trend/graph).
- Arrival counters keyed by `(platform_id, train_id)`.
- `expires_at = train_departure + retention_after_departure_min`.
- `sweep(now)` purges expired entries; called from a background task each loop tick.
- Inject a `clock()` callable so tests can fast-forward time.

### 5.5 Fusion (`fusion.py`)
Combine latest density + arrival rate + schedule into `PlatformState`; compute
`arrival_rate_per_min` from arrival timestamps in a rolling window.

### 5.6 WebSocket manager (`ws.py`)
```python
class ConnectionManager:
    def __init__(self): self.active: list[WebSocket] = []
    async def connect(self, ws): await ws.accept(); self.active.append(ws)
    def disconnect(self, ws): self.active.remove(ws)
    async def broadcast(self, msg: dict):
        for ws in list(self.active):
            try: await ws.send_json(msg)
            except Exception: self.disconnect(ws)
```
Message types (per [../Schema.md]): `state_update`, `agent_action`, `graph_point`.

### 5.7 Endpoints
| Method | Path | Behavior |
|---|---|---|
| POST | `/api/scan` | validate `ScanIn` → bump arrival counter → broadcast `state_update` |
| POST | `/api/density` | store reading → recompute zone/trend → broadcast |
| GET | `/api/state` | return fused `PlatformState[]` |
| POST | `/api/scheduling/hold` | mock: set `held`, push `current_eta += minutes` (cap `hold_max_min`) |
| POST | `/api/override` | log override; cancel a referenced action |
| WS | `/ws/dashboard` | subscribe to live updates |
| WS | `/ws/display/{platform_id}` | subscribe to signage/redirect messages |

---

## 6. Testing
- `test_zones.py`: 59→GREEN, 60→YELLOW, 85→RED boundary cases; trend rising/falling.
- `test_store_expiry.py`: insert, fast-forward clock past TTL, assert purged.
- `test_state_endpoint.py`: post scans+density via `httpx` test client, assert fused state.
- Manual: `uvicorn app.main:app --reload`, hit `/docs`, post sample payloads.

## 7. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| PII accidentally added to a model later | Code-review rule + a test asserting `ScanIn.model_fields` set is exactly `{platform_id, train_id}` |
| WS clients leak on disconnect | `ConnectionManager` removes on send failure |
| Time-based expiry hard to test | Inject `clock()` for deterministic fast-forward |
| Density % missing from client | Server computes `count / capacity * 100` |

## 8. Deliverables
- Runnable backend (`uvicorn app.main:app`).
- Passing test suite.
- `.env.example` with all config keys.
- Updated [../Tracker.md] (Phase 1 rows → ✅).

## 9. Handoff to Phase 2 & 3
- Phase 2 posts real density to `POST /api/density`.
- Phase 3 reads `GET /api/state` each tick and calls `POST /api/scheduling/hold`.
- Phase 4 connects to `/ws/dashboard` (can start against mocked broadcasts now).
