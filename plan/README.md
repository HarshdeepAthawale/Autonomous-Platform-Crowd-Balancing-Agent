# 📐 Build Plan — In-Depth Phases
### Autonomous Platform Crowd-Balancing Agent

Deep, build-ready guides for each of the 5 phases — file structures, code skeletons, API
contracts, tests, risks, and exit criteria. These expand the high-level
[../ImplementationPlan.md] and are the working reference during the build.

| Phase | Guide | Owner | Unblocks |
|-------|-------|-------|----------|
| 1 | [Phase1-Foundation-Backend.md](Phase1-Foundation-Backend.md) | Backend | CV, Agent, UI mocks |
| 2 | [Phase2-Computer-Vision.md](Phase2-Computer-Vision.md) | CV | Real density signals |
| 3 ⭐ | [Phase3-Agentic-Core.md](Phase3-Agentic-Core.md) | Agent/AI | Action-log UI |
| 4 | [Phase4-Frontend.md](Phase4-Frontend.md) | Frontend | Demo |
| 5 | [Phase5-Integration-Demo.md](Phase5-Integration-Demo.md) | Whole team | Submission |

**Build order:** Backend → CV → Agent (centerpiece) → Frontend → Integration/Demo.
Frontend and Agent can start against Phase-1 mocks in parallel; the synthetic-density
fallback (Phase 2) keeps the whole pipeline runnable without a camera.

**Cross-references:** [../PRD.md] · [../TechSpecifications.md] · [../AppFlow.md] ·
[../Design.md] · [../Schema.md] · [../Tracker.md] · [../Rules.md]
