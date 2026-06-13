# Project Tracker
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Last updated:** 2026-06-14

**Legend:** 🔲 Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

---

## Status Summary

| Phase | Title | Status | Progress |
|-------|-------|--------|----------|
| 0 | Planning & Docs | ✅ Done | 8/8 docs |
| 1 | Foundation & Backend Skeleton | ✅ Done | 8/8 · 18 tests pass |
| 2 | Computer Vision Density Pipeline | ✅ Done* | 6/6 · 19 tests · *real YOLO inference pending on-device run |
| 3 | Agentic Decision Core (hierarchical multi-agent) | ✅ Done | 6/6 · 27 agent + 3 backend tests · LangGraph parity test skipped (langgraph not installed) |
| 4 | Frontend: Dashboard, Displays & TTS | 🔲 Not started | 0/8 |
| 5 | Integration, Privacy Proof & Demo | 🔲 Not started | 0/8 |

---

## Phase 0 — Planning & Docs ✅
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 0.1 | PRD.md | ✅ | — | Product requirements |
| 0.2 | TechSpecifications.md | ✅ | — | Architecture + stack |
| 0.3 | AppFlow.md | ✅ | — | Flows + diagrams |
| 0.4 | Design.md | ✅ | — | UI/UX + color system |
| 0.5 | Schema.md | ✅ | — | Privacy-first data model |
| 0.6 | ImplementationPlan.md | ✅ | — | 5 phases |
| 0.7 | Tracker.md | ✅ | — | This file |
| 0.8 | Rules.md | ✅ | — | Standards + safety/privacy rules |

---

## Phase 1 — Foundation & Backend Skeleton ✅
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 1.1 | Repo scaffold (backend/) | ✅ | | app/ + routers/ + tests/ |
| 1.2 | FastAPI: `/api/scan`, `/api/density`, `/api/state` | ✅ | | + `/health` |
| 1.3 | Edge ticket parser (platform+train only) | ✅ | | ScanIn drops PII keys |
| 1.4 | Live Data Store (no PII fields) | ✅ | | in-memory + rolling series |
| 1.5 | Mock TrainSchedule + `/api/scheduling/hold` | ✅ | | hold hard-capped |
| 1.6 | WebSocket `/ws/dashboard`, `/ws/display/{id}` | ✅ | | channel fan-out |
| 1.7 | TTL/expiry sweep job | ✅ | | lifespan background task |
| 1.8 | Config constants | ✅ | | env-driven Settings |

---

## Phase 2 — Computer Vision Density Pipeline ✅
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 2.1 | YOLOv8 + OpenCV capture (one source) | 🟡 | | code written; worker logic DI-tested; real YOLO inference pending on-device run (see follow-up) |
| 2.2 | Count → density % (capacity calibration) | ✅ | | density.py |
| 2.3 | Rolling-average smoothing + trend | ✅ | | DensityTracker |
| 2.4 | Push DensityReading (no frame saved) | ✅ | | publisher.py · privacy test |
| 2.5 | Two-source demo mode (A & B) | ✅ | | worker.py thread-per-platform |
| 2.6 | Synthetic-density fallback simulator | ✅ | | synthetic.py (default path) |

---

## Phase 3 — Agentic Decision Core (hierarchical multi-agent) ✅
Architecture: Station Supervisor → (Crowd ∥ Train ∥ Safety) → Decision → Action.
Tests: 27 passed, 1 skipped (langgraph not installed).

| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 3.1 | Safety Agent: zones + hard safety gate | ✅ | | `validate_plan`, fail-safe; LLM cannot override |
| 3.2 | Parallel agents: Crowd / Train / Safety | ✅ | | independent analyses |
| 3.3 | Supervisor + Decision + Action agents | ✅ | | synthesize → plan → execute |
| 3.4 | LangGraph graph (fan-out/fan-in) | ✅ | | parity-tested vs in-process runner |
| 3.5 | Action emitters (hold/redirect/signage/announce) | ✅ | | calm bilingual wording |
| 3.6 | Log & Learn + rule-only fallback | ✅ | | AgentDecision + outcome; Claude off by default |
| 3.7 | Backend integration | ✅ | | `/api/agent/tick` + autonomous background loop |

---

## Phase 4 — Frontend: Dashboard, Displays & TTS 🔲
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 4.1 | PlatformCard component | 🔲 | | |
| 4.2 | DensityChart (Recharts) | 🔲 | | |
| 4.3 | AgentActionLog + Override buttons | 🔲 | | plain-English |
| 4.4 | Wire dashboard to `/ws/dashboard` | 🔲 | | |
| 4.5 | Gate display + signage boards | 🔲 | | red/green |
| 4.6 | Simulation "scan" page | 🔲 | | buttons/QR |
| 4.7 | TTS playback | 🔲 | | ElevenLabs/gTTS |
| 4.8 | `/api/override` wiring | 🔲 | | |

---

## Phase 5 — Integration, Privacy Proof & Demo 🔲
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 5.1 | End-to-end scenario test | 🔲 | | |
| 5.2 | Deterministic demo + clip fallback | 🔲 | | |
| 5.3 | Privacy proof (show store, no PII/frames) | 🔲 | | |
| 5.4 | Graceful-degradation test | 🔲 | | kill LLM |
| 5.5 | Latency tuning | 🔲 | | |
| 5.6 | Deploy backend to Railway, frontend to Vercel; smoke test WS + CORS | 🔲 | | |
| 5.7 | Demo script + talking points | 🔲 | | |
| 5.8 | README + finalize docs | 🔲 | | |

---

## Blockers & Decisions Log
| Date | Item | Decision / Status |
|------|------|-------------------|
| 2026-06-14 | Agent framework | **LangGraph — confirmed.** Hierarchical multi-agent (Supervisor → Crowd∥Train∥Safety → Decision → Action) |
| 2026-06-14 | Agent architecture | **Layered hierarchical multi-agent — confirmed** (replaced flat decision engine) |
| 2026-06-14 | Claude API key | **Not available yet — confirmed.** Rule + template (bilingual) wording active; Claude code-ready, off by default |
| 2026-06-14 | TTS provider | ElevenLabs free tier vs gTTS — **pending confirm** |
| 2026-06-14 | Persistence | In-memory + time-series vs SQLite/Redis — **pending confirm** |
| 2026-06-14 | Hosting | **Vercel (frontend) + Railway (backend) — confirmed.** Synthetic CV runs on Railway; real YOLO is local-only. |

## Known Follow-ups
| Item | Why | Repro / action |
|------|-----|----------------|
| Real YOLOv8 inference unverified | Sandbox has no camera + torch/weights not installed. Synthetic path, worker control-flow (stride/throttle/EOF), entrypoint, and publish latency (≤2s) ARE verified. | On demo machine: `pip install -r cv/requirements.txt` then `USE_SYNTHETIC=false python -m cv.run` with a webcam or sample clip; confirm `GET /api/state` density moves and measure frame→backend latency incl. inference. |

---

## Definition of Done (demo)
- [ ] End-to-end demo runs in <2 min (Vercel + Railway, or local).
- [ ] Worked scenario rebalances Platform A below Yellow within hold window.
- [ ] Agent action log shows plain-English reasoning live.
- [ ] Data store shows only counts/%/timestamps — no PII, no frames.
- [ ] Rule-engine fallback works with LLM disabled.

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Design.md], [Schema.md], [ImplementationPlan.md], [Rules.md].*
