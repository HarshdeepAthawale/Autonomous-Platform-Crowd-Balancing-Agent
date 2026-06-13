# Phase 3 — Agentic Decision Core (In-Depth) ⭐ Centerpiece
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A **layered hierarchical multi-agent system** — Station Supervisor → (Crowd ∥ Train ∥ Safety) → Decision → Action — where a hard Safety Agent gate is always authoritative and Claude handles only nuanced wording.
**Status:** ✅ Done · 32/32 tests pass
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
├── types.py            # shared dataclasses: Policy, Hold, Redirect, Plan, *Report, DecisionOutput, SideEffects, TickResult
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

**Input:** `PlatformState` snapshot for one platform
**Output:** `CrowdReport`

```python
@dataclass
class CrowdReport:
    crowded_rising: bool     # density >= RED threshold AND trend == RISING
    density: float           # raw density_pct
    trend: Trend             # RISING / FALLING / STABLE
```

Logic: classify zone; return `crowded_rising = zone == RED and trend == RISING`.
No side-effects. Pure function → trivially unit-tested.

---

### 5.2 Train Agent (`agents/train.py`)

**Input:** `PlatformState` (has `next_train: NextTrain | None`)
**Output:** `TrainReport`

```python
@dataclass
class TrainReport:
    next_train: NextTrain | None
    holdable: bool           # train exists AND not already held (no-thrash guard)
```

**No-thrash rule:** `holdable = next_train is not None and not next_train.held`.
A second tick on an already-held train sees `held=True` and returns `holdable=False`
— preventing stacked holds.

---

### 5.3 Safety Agent (`agents/safety.py`)

The **authority layer**. Two responsibilities:

**a) `analyze()` → SafetyReport**
```python
@dataclass
class SafetyReport:
    breaches: list[str]      # list of platform_ids in RED
    fail_safe: bool          # True if any signal is stale/missing
    all_states: list[PlatformState]
```

**b) `validate_plan(plan, all_states, policy) → bool`** — the hard gate
```python
def validate_plan(plan, all_states, policy) -> bool:
    # Rule 1: hold duration must not exceed the cap
    if plan.hold and plan.hold.minutes > policy.hold_max_min:
        return False
    # Rule 2: redirect target must not be RED or high-YELLOW
    if plan.redirect:
        target_state = get_state(plan.redirect.to_platform, all_states)
        if not is_safe_target(target_state, policy):
            return False
    return True
```

`is_safe_target` checks zone is GREEN or low-YELLOW (density < yellow_max – 5).

This is called from Decision Agent before returning any plan. **No LLM call can bypass it.**

---

### 5.4 Decision Agent (`agents/decision.py`)

**Input:** snapshot + CrowdReport + TrainReport + SafetyReport + Policy
**Output:** `DecisionOutput`

```python
@dataclass
class DecisionOutput:
    plan: Plan | None        # None = no action (all safe / fail-safe / no target)
    reasoning: str           # plain-English for log + dashboard
    source: str              # "rule" | "rule+llm"
```

**Decision logic:**
1. If `safety_r.fail_safe` → return `plan=None, reasoning="fail-safe: stale signal"`.
2. If not `crowd_r.crowded_rising` → return `plan=None, reasoning="all platforms safe"`.
3. If not `train_r.holdable` → return `plan=None, reasoning="no holdable train"`.
4. Find best redirect target via `best_alternative()` (GREEN/low-YELLOW + eta ≤ source + grace).
5. Build `Plan(hold, redirect, announce=None)`.
6. Call `safety_r.validate_plan(plan)` → if False, return `plan=None, reasoning="plan failed safety gate"`.
7. Return validated plan.

`best_alternative()` prefers greenest + soonest-train among eligible platforms.

---

### 5.5 Action Agent (`agents/action.py`)

**Input:** `DecisionOutput` + snapshot + draft (bilingual wording)
**Output:** `(AgentDecision record dict, SideEffects)`

```python
@dataclass
class SideEffects:
    hold_calls: list[dict]       # {train_id, minutes} — for scheduling API
    ws_messages: list[dict]      # redirect / signage / agent_action — for WS broadcast
    tts_text: str | None         # announcement text (JA then EN)
```

Builds the `AgentDecision` record (see [../Schema.md]) and the side-effects payload. Does **not** call external APIs directly in tests — returns the side effects for the caller to execute. This keeps Action Agent pure and unit-testable.

---

### 5.6 Station Supervisor Agent (`agents/supervisor.py`)

**Orchestrates each tick.**

```python
async def gather_reports(snapshot, platform_id, policy):
    crowd_r, train_r, safety_r = await asyncio.gather(
        crowd.analyze(snapshot[platform_id]),
        train.analyze(snapshot[platform_id]),
        safety.analyze(snapshot),
    )
    return crowd_r, train_r, safety_r

def run_tick(all_states, policy, draft_fn=make_draft):
    # 1. fan out — parallel analysis
    crowd_r, train_r, safety_r = asyncio.run(gather_reports(...))
    # 2. decision
    decision_out = decision.decide(snapshot, crowd_r, train_r, safety_r, policy)
    # 3. wording (template or Claude)
    draft = draft_fn(decision_out, snapshot) if decision_out.plan else ""
    # 4. action
    record, side_effects = action.act(decision_out, snapshot, draft)
    return TickResult(record=record, side_effects=side_effects, decision=decision_out)
```

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

## 10. Testing (32 tests)

| File | What it tests |
|---|---|
| `test_crowd.py` | GREEN→not-crowded, RED+rising→crowded, RED+stable→not-crowded |
| `test_train.py` | no train → not holdable; held train → not holdable (no-thrash); available → holdable |
| `test_safety.py` | validate_plan: hold over cap → reject; redirect into RED → reject; hostile draft → reject (LLM guard) |
| `test_decision.py` | fail-safe short-circuit; worked example → HOLD+REDIRECT plan; no holdable train → no-op |
| `test_action.py` | plan→side-effects structure; no-plan→empty side effects |
| `test_supervisor.py` | full tick on worked example → correct record; all-green → no-action |
| `test_graph.py` | LangGraph parity: graph.invoke == run_tick for worked example (pytest.importorskip) |
| `test_llm.py` | template_draft produces bilingual text; validation rejects imperative wording |
| `test_agent_endpoint.py` (backend) | POST /api/agent/tick → 200; drive A to RED rising → verify hold+redirect in response |

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

## 12. Deliverables (all ✅)

- [x] 6-agent hierarchy: supervisor, crowd, train, safety, decision, action
- [x] `agent/graph.py` — LangGraph StateGraph (fan-out / fan-in), parity-tested
- [x] Hard safety gate (`validate_plan`) — authoritative, LLM cannot override
- [x] Rule-only + template wording fallback (no API key required)
- [x] Backend integration: `/api/agent/tick` + autonomous `agent_loop`
- [x] 32 tests covering all agents, worked example, safety gate, and LangGraph parity
- [x] `AgentDecision` records logged and streamed to `/ws/dashboard`

---

## 13. Handoff to Phase 4

The dashboard consumes `agent_action` WS messages (reasoning string + plan chips + `decision_id` for override). Platform displays consume `signage` and `redirect` messages. The exact WS payload schema is defined in [../Schema.md] — Phase 4 renders it without any agent changes.

*See [../PRD.md], [../TechSpecifications.md], [../AppFlow.md], [../Schema.md], [../ImplementationPlan.md], [../Tracker.md], [../Rules.md].*
