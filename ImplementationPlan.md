# Implementation Plan (5 Phases)
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.0 · **Last updated:** 2026-06-14

---

## Guiding Strategy
Build the **demoable vertical slice** end-to-end early, then deepen. Every phase ends in
a runnable state. Hard safety rules and privacy controls are built in from Phase 1, not
bolted on. Two simulated platforms (A, B) are enough to tell the full story.

**Recommended order of value:** Backend skeleton → CV density → Agent loop → Dashboard →
Polish. The agent (Phase 3) is the centerpiece; everything before it feeds it, everything
after it shows it.

---

## Phase 1 — Foundation & Backend Skeleton
**Goal:** A FastAPI backend that ingests arrivals + density and serves fused live state,
with privacy-safe storage and WebSockets.

**Tasks**
1. Repo scaffold: `backend/`, `cv/`, `frontend/`, `agent/`, `.env`, README.
2. FastAPI app: `POST /api/scan`, `POST /api/density`, `GET /api/state`.
3. Edge ticket parser: whitelist `platform_id` + `train_id` only (drop all else).
4. Live Data Store (in-memory + optional SQLite) per [Schema.md] — no PII fields.
5. Mock `TrainSchedule` + `POST /api/scheduling/hold`.
6. WebSocket endpoints `/ws/dashboard`, `/ws/display/{id}`.
7. TTL/expiry sweep job (≤1h after departure).
8. Config constants (thresholds, hold cap, loop period).

**Deliverable:** Backend runs; can POST scans/density and GET fused state; data auto-expires.
**Exit criteria:** `GET /api/state` returns correct `PlatformState` with zone classification.

---

## Phase 2 — Computer Vision Density Pipeline
**Goal:** Real-time per-platform person counting feeding density % into the backend.

**Tasks**
1. Integrate YOLOv8 (Ultralytics) + OpenCV capture for one source.
2. Person-count → density % via per-platform capacity calibration.
3. Rolling-average smoothing; compute trend (rising/falling/stable).
4. Push `DensityReading` to backend (in-memory, **no frame saved**).
5. Two-source demo mode: two webcams or two pre-recorded clips = Platform A & B.
6. Fallback simulator: synthetic density driven by the "scan" buttons (for safe demo).

**Deliverable:** Two platforms report live density % that the backend fuses.
**Exit criteria:** Counts update ≤2s; frames provably never written to disk.

---

## Phase 3 — Agentic Decision Core (centerpiece) — Hierarchical Multi-Agent
**Goal:** A layered multi-agent hierarchy — **Station Supervisor → (Crowd ∥ Train ∥
Safety) → Decision → Action** — replacing a single flat agent. Hard safety gate is
authoritative; the LLM only drafts wording.

**Tasks**
1. **Safety Agent:** zone view + the hard safety gate (`validate_plan`: hold cap, no
   redirect into a crowded platform) + fail-safe on stale/missing signals.
2. **Parallel perception layer:** Crowd Agent (density+trend, RED-rising), Train Agent
   (ETAs + holdability/no-thrash), Safety Agent — run independently.
3. **Supervisor + Decision + Action agents:** Supervisor fans out & collects; Decision
   synthesizes reports → validated `Plan`; Action emits side effects.
4. **LangGraph graph:** fan-out (Supervisor → 3 parallel) / fan-in (→ Decision → Action),
   parity-tested against the in-process runner.
5. **Action emitters:** hold-signal (capped), redirect *suggestion* (WS), calm bilingual
   announcement wording, signage update (WS); `AgentDecision` to dashboard.
6. **Log & Learn + fallback:** write `AgentDecision` + outcome (density-after);
   rule + template wording by default, Claude (`claude-haiku-4-5`) optional + auto-fallback.
7. **Backend integration:** in-process runner, `POST /api/agent/tick` + autonomous loop.

**Deliverable:** The hierarchy autonomously detects RED + acts (hold/redirect/announce)
with logged plain-English reasoning.
**Exit criteria:** Worked example (A=92%, B=35%) triggers the correct plan; safety gate
rejects unsafe plans; rule-only fallback works with no API key.

---

## Phase 4 — Frontend: Dashboard, Displays & TTS
**Goal:** React/Tailwind control-room dashboard + passenger displays + voice output.

**Tasks**
1. `PlatformCard` (color, density bar, count, train/ETA, trend, HELD badge).
2. `DensityChart` (Recharts, A vs B, threshold bands).
3. `AgentActionLog` feed with plain-English reasoning + **Override** buttons.
4. Wire dashboard to `/ws/dashboard`.
5. Gate/entry display + platform signage boards via `/ws/display/{id}` (red/green).
6. Simulation "scan" page (buttons / phone QR).
7. TTS playback (ElevenLabs free tier or gTTS) of agent announcements.
8. `POST /api/override` wired to log buttons.

**Deliverable:** Full UI shows live status, graphs, agent log; announcements play.
**Exit criteria:** Color transitions + log + voice all reflect agent actions in real time.

---

## Phase 5 — Integration, Privacy Proof, Polish & Demo
**Goal:** Reliable end-to-end demo in <2 minutes, privacy demonstrably airtight.

**Tasks**
1. End-to-end integration test of the worked scenario.
2. Deterministic demo scenario + pre-recorded clip fallback.
3. Privacy proof: show data store contents (only counts/%/timestamps); verify no frames/PII.
4. Graceful-degradation test (kill LLM → rule engine still acts).
5. Latency tuning (density ≤2s, loop 15–30s, near-instant dashboard).
6. Deploy backend to Railway, frontend to Vercel; smoke-test public WebSocket + CORS.
7. Demo script + talking points (privacy + autonomy + ethics).
8. README + finalize all docs ([PRD], [TechSpecifications], [AppFlow], [Design], [Schema], [Tracker], [Rules]).

**Deliverable:** Polished, judge-ready demo + deployed instance + complete docs.
**Exit criteria:** Cold-start demo runs start→finish in <2 min, no manual fixes.

---

## Dependencies & Critical Path
```
Phase 1 (backend) ──▶ Phase 2 (CV) ──▶ Phase 3 (agent) ──▶ Phase 4 (UI) ──▶ Phase 5 (polish)
        │                                   ▲
        └────────── mock schedule ──────────┘   (Phase 3 can start against Phase-1 mocks
                                                  before Phase 2 CV is fully ready)
```
**Parallelization:** Frontend scaffolding (Phase 4) can begin against mock WebSocket data
right after Phase 1. CV simulator unblocks Phase 3 if real CV lags.

---

## Risk-Driven Sequencing
- Build **privacy controls in Phase 1** (cheapest to enforce at the schema/edge).
- Build the **rule engine before the LLM** so a safe demo exists even without API access.
- Keep a **synthetic-density fallback** so the live demo never depends on camera/lighting.

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Design.md], [Schema.md], [Tracker.md], [Rules.md].*
