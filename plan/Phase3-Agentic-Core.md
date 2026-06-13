# Phase 3 — Agentic Decision Core (In-Depth) ⭐ Centerpiece
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A **layered hierarchical multi-agent system** — Station Supervisor → (Crowd ∥ Train ∥ Safety) → Decision → Action — where a hard Safety Agent gate is always authoritative and Claude handles only nuanced wording.
**Status:** ✅ Done · 29 agent tests pass (including 2 LangGraph parity tests)
**Duration estimate:** ~2 days · **Owner:** Agent/AI
**Depends on:** Phase 1 (state + hold API), Phase 2 (real/synthetic density) · **Unblocks:** Phase 4 (action log UI)

---

## 1. Objectives

1. Build a **layered hierarchical multi-agent system** (not a flat loop): Supervisor fans out to Crowd, Train, Safety running in parallel; Decision synthesizes; Action executes.
2. The **Safety Agent** owns the hard gate — `validate_plan` is authoritative; the LLM cannot override it.
3. Integrate **Claude** (`claude-haiku-4-5`, low temperature) for calm bilingual announcement wording only. Off by default; rule + template fallback always active.
4. Emit four action types: hold-signal (capped), redirect suggestion (WS), TTS announcement, signage update (WS).
5. Log every `AgentDecision` with plain-English reasoning.
6. Wire LangGraph to express the hierarchy as a StateGraph (fan-out / fan-in), parity-tested against the in-process runner.

---

## 2. Exit Criteria

- [x] Worked scenario (A=92% RED rising, B=35% GREEN, B-train 9 min) → plan = HOLD + REDIRECT + ANNOUNCE.
- [x] Safety Agent `validate_plan` rejects any plan that holds > `hold_max_min` or redirects into a crowded platform — LLM cannot override.
- [x] No API key → rule-only plan + template bilingual wording, no error.
- [x] No-thrash: repeated ticks on an already-held train produce no duplicate holds.
- [x] Each decision is written to `AgentDecision` with plain-English reasoning.
- [x] LangGraph graph parity-tested: same inputs → same outputs as the in-process runner.

---

## 3. Directory Layout

```
agent/
├── models.py           # shared dataclasses: Policy, Hold, Redirect, Plan, *Report, DecisionOutput, SideEffects, TickResult
├── llm.py              # template_draft(), claude_draft(), make_draft() + validation + fallback
├── graph.py            # LangGraph StateGraph: supervisor→crowd+train+safety→decision→action
├── agents/
│   ├── __init__.py
│   ├── crowd.py        # CrowdAgent.analyze() → CrowdReport (crowded_rising, density, trend)
│   ├── train.py        # TrainAgent.analyze() → TrainReport (next_train, holdable / no-thrash)
│   ├── safety.py       # SafetyAgent.analyze() → SafetyReport + validate_plan() hard gate
│   ├── decision.py     # DecisionAgent.decide() → DecisionOutput + best_alternative()
│   ├── action.py       # ActionAgent.act() → (AgentDecision record, SideEffects)
│   └── supervisor.py   # gather_reports() (parallel via asyncio.gather) + run_tick()
└── tests/
    ├── conftest.py          # platform() helper + worked_example fixture
    ├── test_crowd.py
    ├── test_train.py
    ├── test_safety.py
    ├── test_decision.py
    ├── test_action.py
    ├── test_supervisor.py
    ├── test_graph.py        # LangGraph parity tests (pytest.importorskip)
    └── test_llm.py
```

---

## 4. Architecture — Layered Hierarchy

```
GET /api/state snapshot
        │
        ▼
🎯 Station Supervisor Agent   (orchestrates each tick)
        │
   asyncio.gather (parallel fan-out)
   ┌────┴────────────┬──────────────────┐
   ▼                 ▼                  ▼
👥 Crowd Agent    🚆 Train Agent    🛡️ Safety Agent
  density+trend    ETAs+holdable    zones+breaches
  flag RED rising  no-thrash        hard gate ready
   └────┬────────────┴──────────────────┘
        │       fan-in: all 3 reports
        ▼
🧠 Decision Agent
  synthesize reports → best_alternative() → Plan
  Safety gate validates Plan before it leaves
        │
        ▼ (only if plan passes the gate)
⚡ Action Agent
  hold call (capped) · redirect WS · signage WS · announcement wording
  emit AgentDecision record → /ws/dashboard
        │
        ▼
LOG → AgentDecision (trigger, reasoning, plan, actions, source)
```

> The **Safety Agent's `validate_plan`** is the final gate — it runs **inside Decision Agent** before any plan is returned. A hostile or oversized LLM output that reaches this gate is discarded and the rule plan is used instead. The LLM cannot widen what the rules allow.

---

## 5. Agent Specifications

### 5.1 Crowd Agent (`agents/crowd.py`)

**Input:** `PlatformState` snapshot (list of all platforms)
**Output:** `CrowdReport`

```python
@dataclass
class CrowdReport:
    crowded_rising: list[str]    # platform_ids that are RED AND rising
    density: dict[str, float]    # platform_id -> density_pct
    trend: dict[str, str]        # platform_id -> trend string
```

Logic: scan all platforms; collect those with `zone == "RED" and trend == "rising"` into `crowded_rising`.
No side-effects. Pure function → trivially unit-tested.

---

### 5.2 Train Agent (`agents/train.py`)

**Input:** snapshot (list of all platforms with `next_train` fields)
**Output:** `TrainReport`

```python
@dataclass
class TrainReport:
    next_train: dict[str, dict | None]     # platform_id -> train slice
    holdable: dict[str, bool]              # platform_id -> bool
```

**No-thrash rule:** `holdable = next_train exists AND not already held`. A second tick on an already-held train sees `held=True` and returns `holdable=False` — preventing stacked holds.

---

### 5.3 Safety Agent (`agents/safety.py`)

The **authority layer**. Two responsibilities:

**a) `analyze()` → SafetyReport**
```python
@dataclass
class SafetyReport:
    zones: dict[str, str]       # platform_id -> zone string
    breaches: list[str]         # platform_ids in RED
    failsafe: bool              # True if snapshot is empty / stale
    reason: str                 # human-readable status
```

**b) `validate_plan(plan, snapshot, policy) → (bool, str)`** — the hard gate
```python
def validate_plan(plan, snapshot, policy) -> tuple[bool, str]:
    # Rule 1: hold duration must not exceed the cap
    if plan.hold and plan.hold.minutes > policy.hold_max_min:
        return False, "hold exceeds cap"
    # Rule 2: redirect must be suggestion mode
    if plan.redirect and plan.redirect.mode != "suggestion":
        return False, "redirect must be a suggestion"
    # Rule 3: redirect target must be safe (GREEN/low-YELLOW, spare capacity)
    if plan.redirect:
        target = find(plan.redirect.to_platform, snapshot)
        if not is_safe_target(target, policy):
            return False, "redirect target not safe"
    return True, "ok"
```

`is_safe_target` checks zone is GREEN or YELLOW with density < `safe_target_max_pct` (75%).

This is called from Decision Agent before returning any plan. **No LLM call can bypass it.**

---

### 5.4 Decision Agent (`agents/decision.py`)

**Input:** snapshot + CrowdReport + TrainReport + SafetyReport + Policy
**Output:** `DecisionOutput`

```python
@dataclass
class DecisionOutput:
    act: bool                   # whether to take action
    reason: str                 # plain-English for log + dashboard
    red_p: dict | None = None   # the RED platform state
    target: dict | None = None  # the best alternative platform state
    plan: Plan | None = None    # None = no action
```

**Decision logic:**
1. If `safety_r.failsafe` → return `act=False, reason="fail-safe: stale signal"`.
2. If `crowd_r.crowded_rising` is empty → return `act=False, reason="all platforms safe"`.
3. Pick first RED+rising platform as `red_p`.
4. If not `train_r.holdable[red_id]` → return `act=False, reason="already holding / no train"`.
5. Find best redirect target via `best_alternative()` (GREEN/low-YELLOW + eta ≤ source + grace).
6. Build `Plan(hold, redirect or None, announce=True)`.
7. Call `safety.validate_plan(plan, snapshot, policy)` → if rejected, return `act=False`.
8. Return validated plan with `act=True`.

`best_alternative()` prefers greenest + soonest-train among eligible platforms.

---

### 5.5 Action Agent (`agents/action.py`)

**Input:** `DecisionOutput` + snapshot + draft (bilingual wording function)
**Output:** `(AgentDecision record dict, SideEffects)`

```python
@dataclass
class SideEffects:
    hold: Hold | None = None
    dashboard_msgs: list[dict] = field(default_factory=list)
    display_msgs: list[tuple[str, dict]] = field(default_factory=list)  # (pid, msg)
```

Builds the `AgentDecision` record (see [../Schema.md]) and the side-effects payload. Does **not** call external APIs directly in tests — returns the side effects for the caller to execute. This keeps Action Agent pure and unit-testable.

---

### 5.6 Station Supervisor Agent (`agents/supervisor.py`)

**Orchestrates each tick.** Calls the three perception agents sequentially (they are pure functions, fast enough synchronously), then drives Decision → Action.

```python
def gather_reports(snapshot, policy):
    """Run the three independent perception agents."""
    return (
        crowd.analyze(snapshot),
        train.analyze(snapshot),
        safety.analyze(snapshot, policy),
    )

def run_tick(snapshot, policy, draft=None) -> TickResult:
    crowd_r, train_r, safety_r = gather_reports(snapshot, policy)
    d = decision.decide(snapshot, crowd_r, train_r, safety_r, policy)
    if not d.act:
        return TickResult(False, d.reason)
    record, side_effects = action.act(d, snapshot, draft)
    return TickResult(True, d.reason, decision=record, side_effects=side_effects)
```

> Note: the plan originally specified `asyncio.gather` for parallel fan-out. The
> actual implementation calls the agents sequentially — functionally identical since
> all three are pure, sub-millisecond functions. The LangGraph form (`graph.py`)
> provides the documented parallel fan-out/fan-in structure.

---

## 6. LangGraph Graph (`graph.py`)

```python
from langgraph.graph import StateGraph, END

class AgentGraphState(TypedDict):
    all_states: list[dict]
    policy: Policy
    crowd_report: CrowdReport | None
    train_report: TrainReport | None
    safety_report: SafetyReport | None
    decision: DecisionOutput | None
    side_effects: SideEffects | None
    record: dict | None

workflow = StateGraph(AgentGraphState)

# nodes
workflow.add_node("supervisor",  supervisor_node)   # pull snapshot, fan-out trigger
workflow.add_node("crowd",       crowd_node)        # parallel
workflow.add_node("train",       train_node)        # parallel
workflow.add_node("safety",      safety_node)       # parallel
workflow.add_node("decision",    decision_node)     # fan-in + synthesize
workflow.add_node("action",      action_node)       # execute + emit

# fan-out from supervisor
workflow.add_edge("supervisor", "crowd")
workflow.add_edge("supervisor", "train")
workflow.add_edge("supervisor", "safety")
# fan-in into decision
workflow.add_edge("crowd",   "decision")
workflow.add_edge("train",   "decision")
workflow.add_edge("safety",  "decision")
# action + end
workflow.add_edge("decision", "action")
workflow.add_edge("action", END)

workflow.set_entry_point("supervisor")
graph = workflow.compile()
```

**Parity test:** `test_graph.py` feeds the same worked-example fixture into both `supervisor.run_tick()` (in-process) and `graph.invoke()` (LangGraph) and asserts identical plan type, hold minutes, and redirect target.

---

## 7. LLM Layer (`llm.py`) — wording only, not authority

### 7.1 Role
- Draft the **calm, bilingual (日本語-first) announcement** for the Action Agent.
- Produce a plain-English **reasoning** summary for the operator log.
- Claude **cannot** choose the plan; that is the Decision Agent's job.

### 7.2 Model & params
- **`claude-haiku-4-5`** — low latency, in-loop.
- `temperature ≈ 0.2` for stable, calm phrasing.
- 2 s timeout; on any error → `template_draft()` fallback.

### 7.3 Wording contract
```json
{
  "announcement_ja": "列車12045をご利用のお客様へ。安全のため、列車を数分遅らせます。",
  "announcement_en": "Attention passengers for Train 12045 — held briefly for safety and comfort.",
  "reasoning": "Platform A is RED rising; B is GREEN with a train 3 min later."
}
```

Validated: non-empty, within length limit, no imperative verbs ("go now", "move to").
On any failure → `template_draft(plan_ctx)` (deterministic bilingual templates, no API needed).

### 7.4 Default (no API key)
`make_draft()` calls `template_draft()` unless `CLAUDE_API_KEY` is set.
The entire demo runs without any API key. Claude is a wording enhancer, not a dependency.

---

## 8. Action Interfaces

| Action | Mechanism | Notes |
|---|---|---|
| Hold | `POST /api/scheduling/hold {train_id, minutes}` | capped at `hold_max_min`; reversible |
| Redirect suggestion | WS `/ws/display/{from_platform}` → `{type:"redirect", to, text, mode:"suggestion"}` | always suggestion tone |
| Announcement | TTS (ElevenLabs/gTTS) — Japanese then English | calm register (丁寧語) |
| Signage update | WS `/ws/display/{id}` → `{type:"signage", zone, count, banner}` | red/green |
| Dashboard log | WS `/ws/dashboard` → `{type:"agent_action", decision}` | plain-English reasoning |

All side effects are idempotent per tick and tagged with `decision_id`.

---

## 9. Backend Integration

`backend/app/agent_runner.py` imports `supervisor.run_tick` and wires two endpoints:

- `POST /api/agent/tick` — manual tick for demo control (triggers exactly one supervisor run)
- `GET /api/agent/decisions` — last N `AgentDecision` records for the dashboard log
- `agent_loop()` — autonomous background task started in FastAPI `lifespan`; ticks every `loop_period_sec` (default 20s)

```python
# agent_runner.py (simplified)
def run_tick():
    states = list(store.platforms.values())
    result = supervisor.run_tick(states, POLICY, draft_fn=make_draft)
    _decisions.append(result.record)
    broadcast_state(result.side_effects)   # WS fan-out
    return result.record
```

---

## 10. Testing (29 agent tests + 3 backend agent tests)

| File | What it tests |
|---|---|
| `test_agents.py` | Crowd: RED+rising flagged; Train: holdability + no-thrash; Safety: breaches + failsafe |
| `test_decision.py` | best_alternative selection, worked example → HOLD+REDIRECT, hold-only, no-action, no-thrash |
| `test_safety.py` | validate_plan: over-long hold, command redirect, unsafe target, hostile LLM draft |
| `test_supervisor.py` | Full tick: golden scenario, side-effects structure, no-action safe, failsafe empty, hold-only |
| `test_graph_parity.py` | LangGraph parity: graph.invoke == run_tick (skipped if langgraph not installed) |
| `test_llm_fallback.py` | template_draft bilingual text, calm wording, imperative rejection, hold-only template |
| `test_agent_endpoint.py` (backend) | POST /api/agent/tick → hold+redirect; decisions history; no-action when safe |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM proposes unsafe wording / action | LLM only produces wording, not the plan; `validate_plan` runs before any execution |
| LLM latency blows loop budget | 2 s timeout → `template_draft` fallback; Haiku is sub-second |
| API down at demo | Rule + template path is the DEFAULT; demo works offline |
| Oscillation (stacked holds) | `holdable = not already held` in Train Agent; one-intervention-per-platform |
| Non-calm wording | Low temp + tone guardrails + length/imperative checks in `_validate()` |
| LangGraph import unavailable | `pytest.importorskip("langgraph")` skips graph tests gracefully; in-process runner is the primary path |

---

## 12. Deliverables (all done)

- [x] 6-agent hierarchy: supervisor, crowd, train, safety, decision, action
- [x] `agent/graph.py` — LangGraph StateGraph (fan-out / fan-in), parity-tested
- [x] Hard safety gate (`validate_plan`) — authoritative, LLM cannot override
- [x] Rule-only + template wording fallback (no API key required)
- [x] Backend integration: `/api/agent/tick` + autonomous `agent_loop`
- [x] 29 agent tests + 3 backend agent tests covering all agents, worked example, safety gate, and LangGraph parity
- [x] `AgentDecision` records logged and streamed to `/ws/dashboard`
- [x] LangGraph parity verification (both tests pass with langgraph installed)

---

## 13. Handoff to Phase 4

The dashboard consumes `agent_action` WS messages (reasoning string + plan chips + `decision_id` for override). Platform displays consume `signage` and `redirect` messages. The exact WS payload schema is defined in [../Schema.md] — Phase 4 renders it without any agent changes.

*See [../PRD.md], [../TechSpecifications.md], [../AppFlow.md], [../Schema.md], [../ImplementationPlan.md], [../Tracker.md], [../Rules.md].*
