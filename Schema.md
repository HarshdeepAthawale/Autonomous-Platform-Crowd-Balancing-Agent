# Data Schema
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.0 · **Last updated:** 2026-06-14

---

## 1. Privacy-First Schema Rules (read first)

> The schema **physically cannot** store PII. There are no name, phone, face, payment, or
> ticket-serial fields anywhere. Only aggregate, anonymous data exists: counts,
> percentages, platform/train IDs, timestamps. All records carry a TTL and auto-expire
> ≤1h after the relevant train departs (DPDP Act 2023 / APPI alignment).

- **No raw frames** are persisted — the CV worker emits a number only.
- **No per-passenger row** — arrivals are aggregated into a per-platform counter.
- Every persisted record has `expires_at`.

---

## 2. Entities

### 2.1 ArrivalEvent (transient, aggregated)
What the gate logs on each scan. Used to compute arrival rate; aggregated into a counter,
not stored per-person long-term.
```json
{
  "platform_id": "A",
  "train_id": "12045",
  "ts": "2026-06-14T12:04:30Z",
  "expires_at": "2026-06-14T13:10:00Z"
}
```
| Field | Type | Notes |
|-------|------|-------|
| platform_id | string/enum | "A", "B", ... |
| train_id | string | from ticket; not personal |
| ts | ISO-8601 datetime | event time |
| expires_at | ISO-8601 datetime | TTL = train departure + 1h |

### 2.2 DensityReading (time-series)
Emitted by the CV worker per platform.
```json
{
  "platform_id": "A",
  "count": 184,
  "density_pct": 92.0,
  "trend": "rising",
  "ts": "2026-06-14T12:04:30Z",
  "expires_at": "2026-06-14T13:10:00Z"
}
```
| Field | Type | Notes |
|-------|------|-------|
| count | int | person count (no identity) |
| density_pct | float | count / platform_capacity × 100 |
| trend | enum | rising / falling / stable |

### 2.3 PlatformState (live, derived)
Fused snapshot the agent perceives.
```json
{
  "platform_id": "A",
  "density_pct": 92.0,
  "count": 184,
  "trend": "rising",
  "zone": "RED",
  "arrival_rate_per_min": 22,
  "next_train": { "train_id": "12045", "eta_min": 6, "held": true, "hold_min": 10 },
  "capacity": 200,
  "ts": "2026-06-14T12:04:30Z"
}
```
| Field | Type | Notes |
|-------|------|-------|
| zone | enum | GREEN (<60) / YELLOW (60–85) / RED (>85) |
| arrival_rate_per_min | float | from ArrivalEvents |
| next_train | object | embedded TrainSchedule slice |
| capacity | int | calibration constant per platform |

### 2.4 TrainSchedule (mock for demo)
```json
{
  "train_id": "12045",
  "platform_id": "A",
  "scheduled_eta": "2026-06-14T12:10:00Z",
  "current_eta": "2026-06-14T12:20:00Z",
  "held": true,
  "hold_min": 10,
  "departed": false
}
```

### 2.5 AgentDecision (audit log)
One record per agent action; the dashboard's Action Log feed.
```json
{
  "decision_id": "dec_20260614_120430_01",
  "ts": "2026-06-14T12:04:30Z",
  "trigger": { "platform_id": "A", "zone": "RED", "density_pct": 92.0, "rising": true },
  "reasoning": "Platform A over threshold and rising; Platform B GREEN with train in 9m. Redistribute and buy time.",
  "plan": {
    "hold": { "train_id": "12045", "minutes": 10 },
    "redirect": { "from": "A", "to": "B", "type": "suggestion" },
    "announce": true
  },
  "actions_taken": ["HOLD", "REDIRECT_SUGGESTION", "ANNOUNCE", "SIGNAGE"],
  "source": "rule+llm",
  "outcome": { "density_after_pct": 71.0, "normalized": true, "measured_at": "2026-06-14T12:09:00Z" },
  "operator_override": false,
  "expires_at": "2026-06-14T13:10:00Z"
}
```
| Field | Type | Notes |
|-------|------|-------|
| reasoning | string | plain-English, shown to operator |
| source | enum | rule / llm / rule+llm |
| outcome | object | did density normalize? (Log & Learn step) |
| operator_override | bool | true if operator intervened |

### 2.6 OverrideEvent
```json
{
  "override_id": "ovr_01",
  "decision_id": "dec_20260614_120430_01",
  "operator": "control-room",
  "action": "cancel_hold",
  "ts": "2026-06-14T12:05:00Z"
}
```

---

## 3. Relational View (if SQLite/Postgres used)

```sql
CREATE TABLE density_reading (
  id           INTEGER PRIMARY KEY,
  platform_id  TEXT NOT NULL,
  count        INTEGER NOT NULL,
  density_pct  REAL NOT NULL,
  trend        TEXT,                       -- rising|falling|stable
  ts           TIMESTAMP NOT NULL,
  expires_at   TIMESTAMP NOT NULL
);

CREATE TABLE arrival_counter (             -- aggregated, not per-person
  platform_id  TEXT NOT NULL,
  train_id     TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  PRIMARY KEY (platform_id, train_id, window_start)
);

CREATE TABLE train_schedule (
  train_id     TEXT PRIMARY KEY,
  platform_id  TEXT NOT NULL,
  scheduled_eta TIMESTAMP NOT NULL,
  current_eta  TIMESTAMP NOT NULL,
  held         BOOLEAN DEFAULT 0,
  hold_min     INTEGER DEFAULT 0,
  departed     BOOLEAN DEFAULT 0
);

CREATE TABLE agent_decision (
  decision_id  TEXT PRIMARY KEY,
  ts           TIMESTAMP NOT NULL,
  trigger_json TEXT NOT NULL,
  reasoning    TEXT NOT NULL,
  plan_json    TEXT NOT NULL,
  actions_json TEXT NOT NULL,
  source       TEXT NOT NULL,             -- rule|llm|rule+llm
  outcome_json TEXT,
  operator_override BOOLEAN DEFAULT 0,
  expires_at   TIMESTAMP NOT NULL
);
-- NOTE: no table contains name, phone, face, payment, or ticket-serial columns.
```

---

## 4. WebSocket Message Schemas

### `/ws/dashboard` (server → client)
```json
{ "type": "state_update", "platforms": [PlatformState, ...], "ts": "..." }
{ "type": "agent_action", "decision": AgentDecision }
{ "type": "graph_point", "platform_id": "A", "density_pct": 92.0, "ts": "..." }
```

### `/ws/display/{platform_id}` (server → display)
```json
{ "type": "signage", "platform_id": "A", "zone": "RED", "count": 184, "banner": "Train held +10m for your safety" }
{ "type": "redirect", "from": "A", "to": "B", "text": "Platform A is busy. Platform B has a train arriving sooner with more space.", "mode": "suggestion" }
```

---

## 5. Configuration / Constants
```json
{
  "thresholds": { "green_max": 60, "yellow_max": 85 },
  "hold_max_min": 10,
  "grace_min": 5,
  "loop_period_sec": 20,
  "retention_after_departure_min": 60,
  "platform_capacity": { "A": 200, "B": 200 }
}
```

---

## 6. Retention & Expiry
- Every persisted record sets `expires_at = train_departure + retention_after_departure_min`.
- A background sweep purges expired rows each loop tick.
- On train `departed = true`, schedule deletion of its associated counters/readings.

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Design.md], [ImplementationPlan.md], [Rules.md].*
