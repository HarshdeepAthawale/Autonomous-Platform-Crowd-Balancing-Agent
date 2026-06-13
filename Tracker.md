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
| 1 | Foundation & Backend Skeleton | ✅ Done | 8/8 · 15 tests pass |
| 2 | Computer Vision Density Pipeline | ✅ Done | 6/6 · 13 tests pass |
| 3 | Agentic Decision Core | 🔲 Not started | 0/6 |
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
| 2.1 | YOLOv8 + OpenCV capture (one source) | ✅ | | detector.py + sources.py |
| 2.2 | Count → density % (capacity calibration) | ✅ | | density.py |
| 2.3 | Rolling-average smoothing + trend | ✅ | | DensityTracker |
| 2.4 | Push DensityReading (no frame saved) | ✅ | | publisher.py · privacy test |
| 2.5 | Two-source demo mode (A & B) | ✅ | | worker.py thread-per-platform |
| 2.6 | Synthetic-density fallback simulator | ✅ | | synthetic.py (default path) |

---

## Phase 3 — Agentic Decision Core 🔲
| # | Task | Status | Owner | Notes |
|---|------|--------|-------|-------|
| 3.1 | Rule engine: zones + hard safety rules | 🔲 | | LLM cannot override |
| 3.2 | LangGraph 5-step loop (15–30s tick) | 🔲 | | |
| 3.3 | Claude integration (haiku-4-5, low temp) | 🔲 | | tradeoffs + wording |
| 3.4 | Action emitters (hold/redirect/TTS/signage) | 🔲 | | |
| 3.5 | Log & Learn (AgentDecision + outcome) | 🔲 | | |
| 3.6 | Rule-only fallback (LLM down) | 🔲 | | |

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
| 5.6 | Deploy to AWS EC2 + smoke test | 🔲 | | |
| 5.7 | Demo script + talking points | 🔲 | | |
| 5.8 | README + finalize docs | 🔲 | | |

---

## Blockers & Decisions Log
| Date | Item | Decision / Status |
|------|------|-------------------|
| 2026-06-14 | Agent framework | LangGraph (recommended) vs CrewAI — **pending confirm** |
| 2026-06-14 | TTS provider | ElevenLabs free tier vs gTTS — **pending confirm** |
| 2026-06-14 | Persistence | In-memory + time-series vs SQLite/Redis — **pending confirm** |

---

## Definition of Done (demo)
- [ ] End-to-end demo runs in <2 min on laptop / EC2.
- [ ] Worked scenario rebalances Platform A below Yellow within hold window.
- [ ] Agent action log shows plain-English reasoning live.
- [ ] Data store shows only counts/%/timestamps — no PII, no frames.
- [ ] Rule-engine fallback works with LLM disabled.

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Design.md], [Schema.md], [ImplementationPlan.md], [Rules.md].*
