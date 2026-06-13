# Technical Specifications
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.0 · **Last updated:** 2026-06-14

---

## 1. System Architecture

```
                          ┌──────────────────────────────────────────────┐
  PERCEPTION LAYER        │                                              │
                          ▼                                              │
 ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌────────────┐ │
 │ Gate Scanner│──▶│  Backend     │──▶│ Live Data    │──▶│ Trend Graph│ │
 │ (QR/IoT)    │   │  (FastAPI)   │   │ Store        │   │ (Recharts) │ │
 │ platform+   │   │ log arrival  │   │ time-series  │   └────────────┘ │
 │ train only  │   │ event        │   │ density/%    │                  │
 └─────────────┘   └──────────────┘   └──────┬───────┘                  │
                                             │                          │
 ┌─────────────┐   ┌──────────────┐          │                          │
 │ CCTV/Webcam │──▶│ Density      │──────────┘                          │
 │ per platform│   │ Estimator    │                                     │
 │             │   │ YOLOv8+OpenCV│                                     │
 └─────────────┘   └──────────────┘                                     │
                                             │                          │
                          ┌──────────────────▼───────────────────┐      │
  DECISION LAYER          │   AGENTIC DECISION CORE               │      │
                          │   (LangGraph + Claude)                │      │
                          │   perceive → evaluate → decide → act  │──────┘ (log/learn)
                          │   rule engine (hard) + LLM (nuance)   │
                          └───┬────────┬────────┬─────────┬───────┘
                              │        │        │         │
  ACTION LAYER          ┌─────▼──┐ ┌───▼────┐ ┌─▼──────┐ ┌▼──────────┐
                        │ Train  │ │ TTS    │ │Signage │ │ Control   │
                        │ Hold   │ │Announce│ │Displays│ │ Room      │
                        │ Signal │ │(voice) │ │red/grn │ │ Dashboard │
                        └────────┘ └────────┘ └────────┘ └───────────┘
```

The system is organized in three layers: **Perception** (gather signals),
**Decision** (the agent core), and **Action** (act on infrastructure + inform people).

---

## 2. Technology Stack

| Layer | Tools / Libraries | Purpose |
|-------|-------------------|---------|
| Ticket Scan / Entry | Web QR/barcode scanner (phone camera for demo), FastAPI endpoint | Capture platform + train ID; log arrival event |
| Crowd Detection | YOLOv8 (Ultralytics), OpenCV | Real-time per-platform person counting |
| Data & Trends | Pandas, NumPy | Rolling density %, trend (rising/falling) |
| Visualization | Recharts (dashboard), matplotlib (offline) | Density-over-time graphs, zone heatmaps |
| Agent Core | LangGraph (recommended) or CrewAI | Orchestrate perceive→decide→act loop |
| Reasoning | Claude (`claude-opus-4-8` / `claude-haiku-4-5`) | Ambiguous decisions, draft announcement text |
| Voice | TTS — ElevenLabs (free tier) or gTTS | Convert decision into calm spoken announcement |
| Backend | FastAPI + WebSockets | Real-time event handling, push to clients |
| Frontend | React + Tailwind CSS | Control room dashboard, gate/signage displays |
| Hosting | AWS EC2 (already provisioned) | Run backend + video processing for live demo |

> **Model note:** Default to the latest Claude models. Use **Claude Haiku 4.5**
> (`claude-haiku-4-5`) for the low-latency in-loop decision/phrasing calls, and
> **Claude Opus 4.8** (`claude-opus-4-8`) for richer offline analysis if needed.

---

## 3. Component Specifications

### 3.1 Gate Scanner / Ticket Entry
- **Input:** QR/barcode payload from a ticket.
- **Extracts:** `platform_id`, `train_id` **only**. Discards everything else.
- **Output:** `POST /api/scan` → `ArrivalEvent { platform_id, train_id, ts }`.
- **Privacy:** payload parsing happens server-side; no PII field is read or persisted.

### 3.2 Density Estimator (CV)
- **Model:** YOLOv8 (person class) via Ultralytics; OpenCV for frame capture.
- **Pipeline:** capture frame → detect persons → count → map to density % via
  per-platform capacity calibration → push to Live Data Store. **Frames are processed
  in memory and never saved.**
- **Smoothing:** rolling average (e.g. last N frames / 5s window) to suppress jitter.
- **Output:** `DensityReading { platform_id, count, density_pct, ts }`.
- **Demo mode:** two webcam windows or two pre-recorded clips = two platforms.

### 3.3 Backend (FastAPI)
- Ingests arrival events + density readings.
- Maintains in-memory live state + time-series store.
- Exposes REST + WebSocket; serves the agent its perception snapshot.
- Enforces data auto-expiry (≤1h after train departs).

### 3.4 Live Data Store
- **Demo:** in-memory dict + a rolling time-series (deque / Pandas frame), optionally
  SQLite or Redis for persistence.
- Holds only aggregate, anonymous records (see [Schema.md]).
- TTL-based expiry job purges records after train departure.

### 3.5 Agentic Decision Core
- **Framework:** LangGraph state graph implementing the 5-step loop (§4).
- **Hybrid control:** a deterministic **rule engine** (hard safety thresholds) runs
  first and always; the **LLM** handles nuanced multi-platform tradeoffs and drafts
  announcement wording. The LLM **cannot** override a hard rule.
- **Cadence:** loop tick every **15–30s** (configurable).
- **Determinism:** rule outcomes are reproducible; LLM calls use low temperature for
  stable phrasing.

### 3.6 Action Interfaces
| Action | Interface | Demo behavior |
|--------|-----------|---------------|
| Hold train | `POST /api/scheduling/hold` (mock) | Logged + reflected in schedule + dashboard |
| Redirect suggestion | WebSocket push to gate/platform display | Banner text on screen (suggestion tone) |
| Announcement | TTS engine → audio | Plays calm spoken message |
| Signage update | WebSocket push | Board turns red/green + live count |

---

## 4. Agent Decision Loop (Detailed)

| Step | What it does | Tooling |
|------|--------------|---------|
| **1. Perceive** | Pull live density % per platform, ticket-scan arrival rate, upcoming train ETAs | OpenCV + YOLOv8, FastAPI event stream |
| **2. Evaluate** | Classify each platform vs thresholds: **Green <60%, Yellow 60–85%, Red >85%** | Rule engine (Python) |
| **3. Decide** | If Red + nearby Green/Yellow platform with near-term train → plan: **hold + redirect + announce**. LLM drafts exact wording & decides urgency/phrasing | LangGraph + Claude |
| **4. Act** | Send hold-signal to scheduling API; push redirect to displays; trigger TTS; update signage colors | REST (scheduling, TTS), WebSocket (displays) |
| **5. Log & Learn** | Log every decision + outcome (did density normalize?) to time-series; render on dashboard | Pandas + Recharts |

### 4.1 Decision rule (pseudocode)
```python
for p in platforms:
    zone = classify(p.density_pct)            # GREEN / YELLOW / RED

    if zone == RED and p.density_rising:
        target = best_alternative(p)          # GREEN/YELLOW + near-term train
        if target and target.train_eta <= p.train_eta + GRACE_MIN:
            plan = Plan(
                hold   = HoldSignal(p.next_train, minutes=min(HOLD_MAX, needed)),
                redirect = Suggestion(from=p, to=target),  # suggestion, not order
                announce = llm.draft_announcement(p, target),  # calm tone
            )
            execute(plan)
            log(plan, reason=llm.reasoning)
```

### 4.2 Hard safety rules (non-negotiable, LLM cannot override)
- Hold duration capped at `HOLD_MAX` (e.g. +10 min) and always reversible.
- Never redirect to a platform that is itself Yellow-high/Red.
- Redirect is always a **suggestion**; never a forced/commanding instruction.
- If any signal is stale/missing → **fail safe: take no action**, alert operator.
- Operator override cancels any action immediately.

---

## 5. API Surface (Demo)

| Method | Path | Body / Params | Returns |
|--------|------|---------------|---------|
| POST | `/api/scan` | `{ platform_id, train_id }` | `{ ok, platform_count }` |
| POST | `/api/density` | `{ platform_id, count, density_pct }` | `{ ok }` |
| GET | `/api/state` | — | full per-platform live state snapshot |
| POST | `/api/scheduling/hold` *(mock)* | `{ train_id, minutes }` | `{ ok, new_eta }` |
| POST | `/api/override` | `{ action_id, decision }` | `{ ok }` |
| WS | `/ws/dashboard` | — | live state, agent actions, graph points |
| WS | `/ws/display/{platform_id}` | — | signage color, count, redirect banner |

See [Schema.md] for full payload schemas.

---

## 6. Data Flow

1. Passenger scans ticket → `POST /api/scan` → arrival event logged (`+1 platform A`).
2. Camera frame → YOLOv8 count → density % → Live Data Store.
3. Backend fuses arrival rate + density + schedule into per-platform state.
4. Agent tick: perceive snapshot → evaluate zones → decide plan → act → log.
5. Actions fan out: hold (scheduling), redirect (display WS), announce (TTS), signage (WS).
6. Dashboard receives state + action log + graph points over `/ws/dashboard`.
7. Expiry job purges records ≤1h after train departs.

---

## 7. Non-Functional Targets

| Aspect | Target |
|--------|--------|
| Density update latency | ≤ 2s frame→store |
| Agent loop period | 15–30s |
| Dashboard push latency | near-instant (WebSocket) |
| LLM call latency (in-loop) | ≤ 2s (use Haiku 4.5, low temp) |
| Privacy | 0 PII fields, 0 stored frames |
| Data retention | ≤ 1h after train departure |
| Fallback | rule-engine-only path if LLM down |

---

## 8. Deployment

- **Local demo:** `uvicorn` (FastAPI) + Vite/React dev server + YOLOv8 process. Two
  video sources for two platforms.
- **EC2:** single instance runs backend + CV worker; React build served statically or
  via the same host. WebSocket over the instance's public endpoint.
- **Config:** `.env` for thresholds (`RED=85`, `YELLOW=60`), `HOLD_MAX`, loop period,
  TTS provider key, Claude API key.

---

## 9. Privacy & Compliance (Engineering Controls)

- Ticket parser whitelists only `platform_id` + `train_id`; all other fields dropped at
  the edge.
- CV worker holds frames in memory only; emits a number; no disk/DB write of imagery.
- Store schema physically cannot hold PII (no such columns/fields).
- TTL/expiry job enforces auto-deletion (DPDP Act 2023 / APPI alignment).
- Audit log records *decisions*, not people.

*See [PRD.md], [AppFlow.md], [Design.md], [Schema.md], [ImplementationPlan.md], [Rules.md].*
