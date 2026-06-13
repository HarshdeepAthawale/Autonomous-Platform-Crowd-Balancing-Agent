# Product Requirements Document (PRD)
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.0 · **Owner:** Team · **Last updated:** 2026-06-14

---

## 1. Overview

The Autonomous Platform Crowd-Balancing Agent is a fully autonomous, agent-driven
safety system for railway stations. It scans a passenger's ticket at entry, tracks
live platform crowd density through computer vision, and uses an AI agent to make and
execute real-time decisions — holding trains, suggesting redirections, updating
displays, and making calm announcements — **without a human operator in the loop**.

The system is designed around one hard constraint: **no compromise on passenger
privacy**. It reads only platform number and train ID from a ticket, and only
headcount from cameras. No names, faces, payment data, or raw video frames are ever
stored.

### One-line pitch
> An AI station-master that watches every platform at once, spots a dangerous crowd
> before it forms, and acts on the infrastructure — not on people — to keep crowds
> balanced, safe, and calm.

---

## 2. Problem Statement

Railway platforms experience dangerous, uneven crowd buildup:

- **Stampedes & crushing** during peak hours when one platform overloads while
  adjacent platforms sit half-empty.
- **No real-time, station-wide view** — staff react to crowds *after* they form, not
  before.
- **Manual, slow decisions** — holding a train or redirecting passengers depends on
  human judgment under stress.
- **Privacy risk** in most "smart station" systems that record faces and personal
  data, failing modern data-protection laws (India's **DPDP Act 2023**, Japan's
  **APPI**).
- **Downstream harms** of overcrowding: altercations, pickpocketing, lost luggage,
  missed boarding.

### Why now
CV person-detection (YOLOv8) is fast and cheap enough to run on commodity hardware,
and LLM agents can now reason over multi-signal state and produce safe, human-readable
decisions in real time. The two combine into a deployable safety layer.

---

## 3. Goals & Non-Goals

### 3.1 Goals
| # | Goal | Measure of success |
|---|------|--------------------|
| G1 | Prevent platform overcrowding before it becomes dangerous | No platform sustains >85% density for >60s in demo scenarios |
| G2 | Balance crowds across platforms automatically | Redistribution reduces peak-platform density by ≥20% in worked scenario |
| G3 | Act autonomously with zero operator input | Agent completes perceive→decide→act loop with no human click |
| G4 | Preserve passenger privacy by design | Zero PII and zero raw frames stored; data auto-expires |
| G5 | Keep all passenger-facing communication calm and non-coercive | Redirections are *suggestions*; announcements never alarming |
| G6 | Be fully demoable on a laptop in under 2 minutes | End-to-end demo runs locally / on Vercel + Railway |

### 3.2 Non-Goals
- **Not** physically controlling or commanding passengers ("go here now").
- **Not** facial recognition, identity tracking, or passenger profiling.
- **Not** replacing the railway's safety-critical signalling system — the hold-signal
  is an *advisory* request to the scheduling layer, gated by hard safety rules.
- **Not** a ticketing/payment system — it reads existing tickets, it does not sell them.
- **Not** a multi-station network optimizer (v1 is single-station, multi-platform).

---

## 4. Target Users & Personas

| Persona | Role | Needs | Interaction |
|---------|------|-------|-------------|
| **Passenger** | Traveler entering the station | Clear, calm guidance; safety; not to be ordered around | Scans ticket; sees gate/platform display suggestions; hears announcements |
| **Control Room Operator** | Station safety staff | Station-wide situational awareness; trust in automation; override power | Watches dashboard; overrides only on anomalies |
| **Station Authority / Ops Manager** | Decision maker | Proof of safety outcomes; compliance with privacy law | Reviews logs, trends, decision audit trail |
| **The Agent** | Autonomous system actor | Live, reliable signals; clear action interfaces | Perceives data, decides, acts on infrastructure |

---

## 5. User Stories

### Passenger
- As a passenger, I scan my ticket and the system logs only my platform and train, so
  my identity is never exposed.
- As a passenger, when my platform is crowded, I see a *suggestion* (not an order) for
  a less crowded alternative, so I can choose what's best for my train.
- As a passenger, I hear a calm announcement explaining a hold, so I'm reassured rather
  than alarmed.

### Control Room Operator
- As an operator, I see every platform's live density and the agent's action log in
  plain English, so I trust and understand each decision.
- As an operator, I can override an agent action if something unusual happens, so I
  retain ultimate authority.

### System / Agent
- As the agent, I continuously perceive density + arrivals + schedule, so I detect risk
  early.
- As the agent, when a platform crosses the red threshold and a neighbor has spare
  capacity, I hold + redirect + announce, so the crowd rebalances safely.
- As the agent, I log every decision and its outcome, so the system is auditable and
  improvable.

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Ticket scan endpoint reads platform number + train ID only; logs an arrival event with timestamp | P0 |
| FR2 | CV pipeline estimates per-platform person count and density % from a camera/video feed in real time | P0 |
| FR3 | Backend fuses ticket-arrival rate + live density + train schedule into per-platform state | P0 |
| FR4 | Rule engine classifies each platform: Green <60%, Yellow 60–85%, Red >85% | P0 |
| FR5 | Agent runs a continuous perceive→evaluate→decide→act→log loop every 15–30s | P0 |
| FR6 | On Red + nearby Green/Yellow with near-term train, agent plans hold + redirect + announce | P0 |
| FR7 | Agent issues a (mock) hold-signal to the scheduling API | P0 |
| FR8 | Agent pushes a *suggestion* redirect message to gate/platform displays | P0 |
| FR9 | Agent generates and plays a calm TTS announcement (LLM-drafted wording) | P1 |
| FR10 | Display boards/signage reflect red/green status + live counts via WebSocket | P0 |
| FR11 | Control room dashboard shows platform cards, density line graph, and Agent Action Log | P0 |
| FR12 | Operator can override/cancel any agent action from the dashboard | P1 |
| FR13 | All stored data auto-expires after the relevant train departs (≤1 hour) | P0 |
| FR14 | Every decision + outcome is logged to a time-series store | P1 |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR1 | **Privacy** | Store only counts, %, platform/train IDs, timestamps. No PII, no raw frames. Frames processed in-memory and discarded. |
| NFR2 | **Latency** | Density update ≤2s from frame; agent decision loop ≤30s; dashboard update near-instant (WebSocket). |
| NFR3 | **Safety** | Hard rule engine overrides LLM. Hold-signal capped (e.g. max +10 min) and reversible. Fail-safe = no action, never an unsafe action. |
| NFR4 | **Ethics** | Passenger comms are informative/suggestive, never commanding or coercive. |
| NFR5 | **Reliability** | Agent loop degrades gracefully if LLM unavailable (rule engine still acts on hard thresholds). |
| NFR6 | **Compliance** | Satisfies DPDP Act 2023 (India) and APPI (Japan): data minimization, purpose limitation, auto-expiry. |
| NFR7 | **Deployability** | Frontend on Vercel, backend on Railway. Synthetic CV runs on Railway; local fallback for real YOLO. |
| NFR8 | **Auditability** | Every agent action is logged with reasoning in plain English. |

---

## 8. Success Metrics (Demo + Vision)

### Demo KPIs (hackathon)
- End-to-end flow runs in **< 2 minutes** on a laptop.
- Worked scenario: Platform A (92%) rebalanced below Yellow within the held window.
- Zero PII / zero stored frames demonstrably (show the data store).
- At least one full agent decision with plain-English reasoning shown live.

### North-star (deployment vision)
- Reduction in peak-platform density variance across the station.
- Reduction in overcrowding-incident reports.
- 100% of stored records provably anonymous and auto-expired.
- Operator override rate (lower = more trust in autonomy).

---

## 9. Scope for Hackathon Demo

**In scope (build this):**
1. Web page to "scan" a QR / click per-platform button → increments platform count.
2. Live webcam/video YOLOv8 person-count for 1–2 simulated platforms.
3. FastAPI backend fusing both signals → density % per platform via WebSocket.
4. LangGraph agent watching 2 platforms + mock schedule → hold (mock, logged) +
   redirect (on screen) + announcement (TTS).
5. React dashboard: 2 platform cards (red/green), density line graph, Agent Action Log.

**Out of scope (v1):** real signalling integration, multi-station optimization,
mobile app, facial/identity features, production-grade auth/RBAC.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM produces an unsafe/odd action | High | Hard rule engine gates all actions; LLM only chooses among safe options + phrasing |
| CV miscounts (occlusion, lighting) | Medium | Smooth with rolling average; density % thresholds tolerate noise |
| Passengers feel "ordered" | Medium | All redirects are suggestions; calm pre-scripted tone |
| Privacy concern from judges/regulators | High | No PII/frames stored; show data store; cite DPDP/APPI alignment |
| Demo fails live | High | Pre-recorded clips fallback; mock schedule; deterministic scenario |
| LLM/API downtime | Medium | Rule-engine-only fallback path still acts on thresholds |

---

## 11. Ethical Stance (Non-negotiable)

> The Agent never tells people **where** to go in a commanding tone. It **informs**,
> **suggests**, and acts on **infrastructure** (trains, signals, announcements, displays)
> rather than physically controlling people. This keeps the system safe, realistic, and
> ethical.

---

## 12. Open Questions
- Final choice of agent framework: **LangGraph** (recommended for explicit graph control) vs CrewAI.
- TTS provider for demo: ElevenLabs free tier (quality) vs gTTS (zero-setup).
- Persistence: in-memory + time-series vs lightweight SQLite/Redis for the demo.

*See [TechSpecifications.md], [AppFlow.md], [Design.md], [Schema.md], [ImplementationPlan.md], [Tracker.md], [Rules.md].*
