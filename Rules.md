# Project Rules & Standards
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Last updated:** 2026-06-14

These rules are binding for all contributors and for the agent itself. The first two
sections (Safety, Privacy) are **non-negotiable** — they define the product.

---

## 1. Agent Safety Rules (non-negotiable)

1. **Hard rules beat the LLM.** A deterministic rule engine runs first and always. The
   LLM chooses *among already-safe options* and drafts wording — it can never override a
   safety rule or invent an unlisted action.
2. **Fail safe, not unsafe.** On stale/missing signals, ambiguity, or error → take **no
   action** and alert the operator. Inaction is the safe default.
3. **Hold is capped and reversible.** Train holds never exceed `HOLD_MAX` (e.g. +10 min)
   and can always be cancelled (by the agent or operator).
4. **Never redirect into danger.** Never suggest a platform that is itself Yellow-high or
   Red. A redirect target must have genuine spare capacity and a near-term train.
5. **Suggest, never command.** Passenger-facing redirects are *suggestions*. The agent
   acts on **infrastructure** (trains, signals, signage, announcements) — never on people.
6. **Operator override is absolute.** Any operator override cancels the action immediately
   and is logged.
7. **Every action is logged with reasoning** in plain English (auditable).

---

## 2. Privacy & Compliance Rules (non-negotiable)

1. **Data minimization:** read only `platform_id` + `train_id` from tickets; only
   headcount from cameras. Drop everything else at the edge.
2. **No PII, ever:** no name, phone, face, payment, ID, or ticket serial is read,
   transmitted, or stored. The schema has no such fields.
3. **No raw frames stored:** CV frames are processed in memory and discarded; only the
   resulting number persists.
4. **Aggregate & anonymous only:** counts, percentages, platform/train IDs, timestamps.
   No record can be traced to an individual.
5. **Auto-expiry:** every persisted record carries `expires_at` and is purged ≤1h after
   the relevant train departs.
6. **Lawful by design:** must pass review under India's **DPDP Act 2023** and Japan's
   **APPI**. When in doubt, store less.

---

## 3. Ethics Rules

1. **Calm over alarm.** All announcements and signage use a calm, reassuring tone — never
   language that could induce panic.
2. **Inform, suggest, act on infrastructure** — in that order. Never coerce or physically
   direct passengers.
3. **Transparency.** The operator (and, where appropriate, passengers) can always see
   *why* an action happened.
4. **Human authority retained.** The system is autonomous by default but never removes the
   operator's power to intervene.

---

## 4. Engineering Standards

### 4.1 General
- Each phase ends in a **runnable** state (see [ImplementationPlan.md]).
- Build the **vertical slice first**, then deepen.
- Keep the demo **deterministic** with fallbacks (synthetic density, pre-recorded clips,
  rule-only mode).

### 4.2 Backend (Python / FastAPI)
- Python 3.11+. Type hints on all public functions. `ruff` + `black` formatting.
- Pydantic models mirror [Schema.md] exactly; **no PII fields** may be added.
- Async endpoints; WebSocket pushes for real-time updates.
- All config via `.env` / config module (thresholds, caps, keys) — no magic numbers in logic.
- Secrets (Claude key, TTS key) never committed; use `.env` (gitignored).

### 4.3 Computer Vision
- YOLOv8 person class only. Never write frames to disk.
- Smooth with rolling averages; expose density % not raw boxes.
- Provide a synthetic fallback path.

### 4.4 Agent
- LangGraph graph nodes map 1:1 to the 5 loop steps (perceive/evaluate/decide/act/log).
- LLM calls: latest Claude models — **`claude-haiku-4-5`** for in-loop latency,
  `claude-opus-4-8` for offline analysis. **Low temperature** for stable, calm phrasing.
- LLM output validated against an allowed-action schema before execution.
- Must run rule-only if the LLM/API is unavailable.

### 4.5 Frontend (React / Tailwind)
- Follow [Design.md] color system and zone semantics.
- Never rely on color alone — pair with text + icons (accessibility, WCAG AA).
- Components: `PlatformCard`, `DensityChart`, `AgentActionLog`, signage/display views.
- WebSocket-driven; no polling for live data.

---

## 5. Git & Collaboration
- Branch per task: `phase{n}/{short-task}` (e.g. `phase3/rule-engine`).
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
- Commit/push only when changes are runnable; never commit secrets or recorded frames/PII.
- Update [Tracker.md] status when a task moves (🔲 → 🟡 → ✅).
- Keep docs in sync: a change to behavior updates the relevant doc in the same PR.

---

## 6. Definition of Done (per task)
- [ ] Meets its acceptance/exit criteria in [ImplementationPlan.md].
- [ ] No safety or privacy rule violated.
- [ ] Tracker updated.
- [ ] Runs locally (and, for Phase 5, on Vercel + Railway).

---

## 7. Demo Rules
- Must run end-to-end in **< 2 minutes**.
- Must visibly demonstrate: autonomy (no human click), the worked rebalancing scenario,
  calm announcement, and **privacy** (show the store has only numbers).
- Always have the fallback path ready (synthetic density + rule-only).

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Design.md], [Schema.md], [ImplementationPlan.md], [Tracker.md].*
