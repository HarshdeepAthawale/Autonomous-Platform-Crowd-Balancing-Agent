# Phase 5 — Integration, Privacy Proof, Polish & Demo (In-Depth)
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A reliable, judge-ready end-to-end demo that runs in **under 2 minutes**, with
**airtight, demonstrable privacy** and a graceful-degradation story.
**Duration estimate:** ~1–1.5 days · **Owner:** Whole team
**Depends on:** Phases 1–4 · **Unblocks:** submission

---

## 1. Objectives
1. Integrate all layers (CV/synthetic → backend → agent → dashboard/displays/TTS).
2. Make the worked scenario **deterministic** and repeatable on a cold start.
3. **Prove privacy** live: show the store holds only numbers; no PII, no frames.
4. Verify **graceful degradation**: kill the LLM → rule engine still acts.
5. Tune latency to targets (density ≤2s, loop 15–30s, near-instant dashboard).
6. Deploy to **AWS EC2** and smoke-test the public WebSocket.
7. Write the demo script + talking points; finalize README + all docs.

## 2. Exit Criteria
- [ ] Cold-start demo runs start→finish in **< 2 min** with no manual fixes.
- [ ] Scenario: Platform A rebalances below Yellow within the held window.
- [ ] Data store inspection shows only counts/%/platform/train/timestamps.
- [ ] `grep` proves no frame-writing; store has no PII columns/fields.
- [ ] LLM disabled → rule-only path still holds + redirects + (template) announces.
- [ ] EC2 instance serves dashboard + WS to a second device.

---

## 3. Run Topology (demo)
```
[Simulate page] --scan--> [Backend FastAPI] <--density-- [CV worker | Synthetic]
                                  │  ▲
                                  │  └── GET /api/state (perceive)
                                  ▼
                            [Agent loop] --hold/redirect/announce/signage-->
                                  │
                        WS /ws/dashboard, /ws/display/{id}
                                  ▼
              [Dashboard] [Signage A] [Signage B] [Gate] [TTS audio]
```

## 4. Deterministic Demo Scenario
Script the exact "worked example" so it fires on cue:
- Seed mock schedule: Train **12045 → Platform A, ETA 6m**; Train **12046 → Platform B, ETA 9m**.
- Start: A and B both GREEN.
- Driver: rapid "scan → Platform A" presses (or scripted synthetic curve) push A: GREEN→YELLOW→RED (~92%).
- Agent tick fires: HOLD 12045 +10m, suggest B, announce, A→朱 / B→萌黄.
- A's density curve bends down within the hold window; outcome check marks `normalized=true`.

Provide a **one-command launcher** (e.g. `make demo` / `docker compose up`) that boots
backend + agent + synthetic feed + frontend.

## 5. Privacy Proof (the money moment)
Prepare to show judges, live:
1. Open the data store (SQLite browser / `GET /api/state` / a debug `/api/_store` dump).
2. Point out: only `platform_id, train_id, count, density_pct, ts, expires_at`. **No names,
   faces, phones, payments.**
3. Run `grep -rE "imwrite|VideoWriter|name|phone|payment" cv/ backend/app/models.py` → nothing relevant.
4. Show TTL expiry: advance the clock / wait → records auto-purge after departure.
5. Cite **DPDP Act 2023 (India)** + **APPI (Japan)** alignment (data minimization, purpose
   limitation, retention limit).

## 6. Graceful Degradation Test
- Unset `CLAUDE_API_KEY` (or block egress) → restart agent.
- Confirm: rule engine still classifies, holds (capped), redirects (suggestion), and uses
  **template** announcements. Loop never crashes. Show this as a resilience highlight.

## 7. Latency Tuning
| Target | Lever |
|---|---|
| Density ≤2s | yolov8n + frame stride + 480p (or synthetic) |
| Loop 15–30s | `loop_period_sec`; lower for snappier demo (e.g. 8–10s) |
| LLM ≤2s | Haiku + low temp + timeout→fallback |
| Dashboard instant | WebSocket push, no polling |
> Tip: for the demo, set `loop_period_sec` lower (e.g. 8s) so judges see action fast.

## 8. Deployment (AWS EC2)
- Provision Python + Node on the existing instance.
- Run backend + agent (uvicorn / process manager), build + serve frontend statically.
- Open ports for HTTP + WS; use the instance public DNS in the frontend WS URL.
- Smoke test: open dashboard on a phone over the network; trigger the scenario.
- Keep a **local laptop fallback** (everything runs offline with synthetic feed) in case
  of venue Wi-Fi issues.

## 9. Demo Script (~90s, talking points)
1. **(10s)** "Stations overcrowd unevenly; nobody closes the loop. Meet the autonomous station-master." (dashboard, two green platforms)
2. **(25s)** Press scan repeatedly → Platform A climbs GREEN→YELLOW→朱. "Cameras + tickets, fused live."
3. **(25s)** Agent log lights up with bilingual reasoning → train held, B-redirect suggestion, calm JA/EN announcement, A red / B green. "No human clicked anything."
4. **(15s)** A's curve bends down. "Rebalanced — no stampede, no panic, no commands."
5. **(15s)** Open the store: "Only numbers. No faces, no names. Auto-expires. DPDP + APPI ready." Then: kill the LLM → "still works on hard safety rules."

## 10. Submission Checklist
- [ ] Repo README polished (done) + docs index current.
- [ ] One-command launcher works on a clean clone.
- [ ] Demo video / GIF recorded as backup.
- [ ] EC2 live URL noted (with laptop fallback).
- [ ] [../Tracker.md] all phases → ✅; decisions log finalized.
- [ ] Privacy proof rehearsed; degradation demo rehearsed.

## 11. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Live demo fails | synthetic feed + scripted scenario + recorded backup video |
| Venue network down | full offline laptop run |
| LLM/API outage | rule-only path (already a feature, demo it) |
| Camera/lighting issues | synthetic density is the primary demo path |
| Time overrun | loop period lowered; scenario pre-seeded |

## 12. Deliverables
- Integrated, deployed, judge-ready system.
- Rehearsed privacy + resilience demonstrations.
- Final docs + README + tracker.
- Backup demo recording.
