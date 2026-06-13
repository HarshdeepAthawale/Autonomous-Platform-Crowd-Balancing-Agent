# Phase 3 — Agentic Decision Core (In-Depth) ⭐ Centerpiece
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A LangGraph agent running the *perceive → evaluate → decide → act → log* loop,
where a **hard rule engine is always authoritative** and **Claude** handles nuanced
tradeoffs + calm announcement wording.
**Duration estimate:** ~2 days · **Owner:** Agent/AI
**Depends on:** Phase 1 (state + hold API), Phase 2 (real/synthetic density) · **Unblocks:** Phase 4 (action log UI)

---

## 1. Objectives
1. Implement the 5-step loop as an explicit LangGraph state graph, ticking every 15–30s.
2. Build a deterministic **rule engine** for zone classification + hard safety rules.
3. Integrate **Claude** (`claude-haiku-4-5`, low temperature) for: choosing among
   already-safe plans on multi-platform tradeoffs, and drafting calm bilingual wording.
4. Emit four actions: hold-signal, redirect suggestion, TTS announcement, signage update.
5. Log every decision + measured outcome (did density normalize?).
6. Guarantee a **rule-only fallback** if the LLM/API is unavailable.

## 2. Exit Criteria
- [ ] Worked scenario (A=92% rising, B=35%, B-train in 9m) → plan = HOLD + REDIRECT + ANNOUNCE.
- [ ] LLM output is validated against an allowed-action schema before any execution.
- [ ] Killing the LLM (no API key) still produces a safe rule-only plan + template wording.
- [ ] No plan ever holds > `hold_max_min` or redirects into a non-green/yellow platform.
- [ ] Each decision is written with plain-English reasoning + later outcome.

---

## 3. Directory Layout
```
agent/
├── graph.py            # LangGraph StateGraph wiring the 5 nodes
├── state.py            # AgentState (typed dict) flowing through the graph
├── perceive.py         # node 1: pull GET /api/state snapshot
├── evaluate.py         # node 2: rule engine — zones + candidate detection
├── decide.py           # node 3: rule plan + LLM refinement (guarded)
├── act.py              # node 4: emit hold/redirect/tts/signage
├── log.py              # node 5: write AgentDecision + schedule outcome check
├── rules.py            # HARD safety rules (non-negotiable)
├── llm.py              # Claude client + prompt + schema validation + fallback
├── actions.py          # action emitters (httpx + WS publish + TTS)
├── runner.py           # async loop: tick every loop_period_sec
└── prompts/
    └── announce.md     # system + style guardrails for announcement drafting
```

---

## 4. The Loop as a Graph

```
 perceive ──▶ evaluate ──▶ (RED & candidate?) ──yes──▶ decide ──▶ act ──▶ log ──┐
     ▲             │                  │                                          │
     │             └────────no────────┴──────────────────────────────▶ log ────┘
     └──────────────────────── next tick (15–30s) ────────────────────────────┘
```

### 4.1 AgentState (`state.py`)
```python
from typing import TypedDict
class AgentState(TypedDict):
    snapshot: list[dict]        # PlatformState[] from backend
    evaluation: dict            # zones + rising flags + candidate map
    plan: dict | None           # {hold, redirect, announce} or None
    reasoning: str              # plain-English, for the log + dashboard
    source: str                 # "rule" | "rule+llm"
    actions_taken: list[str]
```

---

## 5. Rule Engine (`rules.py`) — authoritative, never overridden

### 5.1 Zone + candidate logic
```python
def evaluate(snapshot):
    zones = {p["platform_id"]: classify(p["density_pct"]) for p in snapshot}
    rising = {p["platform_id"]: p["trend"] == "rising" for p in snapshot}
    candidates = {}
    for p in snapshot:
        if zones[p["platform_id"]] == "RED" and rising[p["platform_id"]]:
            candidates[p["platform_id"]] = best_alternative(p, snapshot, zones)
    return {"zones": zones, "rising": rising, "candidates": candidates}

def best_alternative(red_p, snapshot, zones):
    options = [
        q for q in snapshot
        if q["platform_id"] != red_p["platform_id"]
        and zones[q["platform_id"]] in ("GREEN", "YELLOW")
        and q["next_train"]                                   # has a train
        and q["next_train"]["eta_min"] <= red_p["next_train"]["eta_min"] + GRACE_MIN
    ]
    # prefer greenest with soonest train
    return min(options, key=lambda q: (q["density_pct"], q["next_train"]["eta_min"]),
               default=None)
```

### 5.2 HARD safety rules (the LLM cannot break these)
1. **Hold cap & reversible:** `minutes = min(hold_max_min, needed)`; holds are cancellable.
2. **Never redirect into danger:** target must be GREEN or low-YELLOW with real capacity.
3. **Suggestion only:** redirect `mode = "suggestion"`, never imperative.
4. **Fail-safe:** if any signal is stale/missing → return `plan=None`, raise operator alert.
5. **One active intervention per platform** at a time (no thrashing).
6. **Operator override** cancels immediately.

> Implementation: `decide` first builds a **rule plan** from these constraints. The LLM
> may only *select among* / *reword* — its output is re-validated against the same rules
> before `act`. Any violation → discard LLM output, use the rule plan.

---

## 6. LLM Layer (`llm.py`) — nuance, not authority

### 6.1 Role
- Pick the best plan when multiple safe candidates exist (multi-platform tradeoff).
- Draft the **calm, bilingual (JP-first) announcement** within style guardrails.
- Produce a one-line **plain-English reasoning** string for the operator log.

### 6.2 Model & params
- Model: **`claude-haiku-4-5`** (low latency in-loop). Use `claude-opus-4-8` only for
  offline/after-action analysis.
- `temperature` low (≈0.2) for stable, calm phrasing.
- Hard timeout (e.g. 2s); on timeout/error → **fallback** to rule plan + template wording.

### 6.3 Tool/output contract (validated)
Ask Claude to return JSON matching:
```json
{
  "chosen_target": "B",
  "hold_minutes": 10,
  "reasoning": "Platform A over threshold and rising; B is green with a train in 9m...",
  "announcement_ja": "列車12045をご利用のお客様へ。安全のため…",
  "announcement_en": "Attention passengers for Train 12045 — held briefly for safety…"
}
```
Validation before use:
- `hold_minutes <= hold_max_min`
- `chosen_target` ∈ rule-approved candidates
- announcements non-empty, within length + tone checks (no imperatives like "go now")
- on any failure → discard, use rule defaults.

### 6.4 Prompt skeleton (`prompts/announce.md`)
- **System:** "You are a calm Japanese station-master assistant. Choose only from the
  provided SAFE options. Never command passengers; only inform and suggest (丁寧語).
  Output strict JSON."
- **User:** serialized evaluation + candidate list + thresholds + templates.

### 6.5 Fallback (no API key / error)
```python
def draft(plan_ctx) -> dict:
    try:    return validate(claude_call(plan_ctx))
    except Exception:
        return template_announcement(plan_ctx)   # rule-only, deterministic
```

---

## 7. Actions (`act.py` / `actions.py`)
| Action | Mechanism | Notes |
|---|---|---|
| Hold | `POST /api/scheduling/hold {train_id, minutes}` | capped, reversible |
| Redirect | WS `/ws/display/{from}` → `{type:"redirect", to, text, mode:"suggestion"}` | suggestion tone |
| Announce | TTS engine (ElevenLabs/gTTS) plays JA then EN | calm register |
| Signage | WS `/ws/display/{id}` → `{type:"signage", zone, count, banner}` | red/green |
| Dashboard | WS `/ws/dashboard` → `{type:"agent_action", decision}` | plain-English log |

All actions are idempotent per tick and tagged with the `decision_id`.

---

## 8. Log & Learn (`log.py`)
- Write `AgentDecision` (see [../Schema.md]) with trigger, reasoning, plan, actions, source.
- Schedule an **outcome check** (e.g. +4–5 min): re-read density; set
  `outcome.normalized = density_after < yellow_max`.
- This closes the loop and is what the dashboard's "did it work?" view reads.

---

## 9. Runner (`runner.py`)
```python
async def run():
    while True:
        await graph.ainvoke({})          # one full perceive→...→log pass
        await asyncio.sleep(settings.loop_period_sec)
```
Run as a FastAPI startup background task or a separate process.

---

## 10. Testing
- **Rule unit tests:** candidate selection, hold cap, "never redirect into RED", fail-safe on stale.
- **Scenario test (golden):** feed A=92%/rising + B=35%/train-9m → assert plan = hold(≤10) + redirect(A→B, suggestion) + announce.
- **LLM-guard test:** feed a malicious/oversized LLM response → assert it's rejected and rule plan used.
- **Fallback test:** unset API key → assert rule-only plan + template wording still produced.
- **No-thrash test:** repeated ticks don't stack multiple holds on one platform.

## 11. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| LLM proposes unsafe action | Re-validate against rule engine; discard on violation |
| LLM latency blows the loop budget | 2s timeout → fallback; use Haiku |
| API down at demo | Rule-only path + templates (works offline) |
| Oscillation (hold/redirect flapping) | one-intervention-per-platform + grace window |
| Non-calm wording | low temp + tone guardrails + length/imperative checks |

## 12. Deliverables
- Running agent loop acting autonomously on the worked scenario.
- Validated, fallback-safe LLM integration.
- Decision log feeding `/ws/dashboard`.
- [../Tracker.md] Phase 3 rows → ✅.

## 13. Handoff to Phase 4
The dashboard consumes `agent_action` messages (reasoning + chips + override) and the
displays consume `signage`/`redirect` messages. The agent already speaks the exact
WebSocket schema Phase 4 renders.
