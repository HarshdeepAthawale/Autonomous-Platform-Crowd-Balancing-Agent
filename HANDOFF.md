# Handoff — Autonomous Platform Crowd-Balancing Agent
**For:** Deshmukh · **From:** Harshdeep · **Date:** 2026-06-14
**Repo:** https://github.com/HarshdeepAthawale/Autonomous-Platform-Crowd-Balancing-Agent
**Branch:** `main` · **Last commit:** `97e08b4`

> TL;DR — Phases 0–4 are **done and working locally** (backend + CV + multi-agent + full
> frontend). What's left is **Phase 5: deploy + demo polish**. Everything below is what you
> need to run it, plus the exact remaining tasks in priority order.

---

## 1. What's done ✅

| Phase | Status | Notes |
|---|---|---|
| 0 Planning & docs | ✅ | 8 root docs + `plan/` deep guides |
| 1 Backend (FastAPI) | ✅ | REST + WS + TTL expiry · **21 tests pass** |
| 2 CV pipeline | ✅* | YOLOv8 + synthetic fallback · 19 tests · *real YOLO unverified (no camera here)* |
| 3 Agent core | ✅ | Hierarchical multi-agent (Supervisor→Crowd∥Train∥Safety→Decision→Action), LangGraph parity · 29+3 tests |
| 4 Frontend | ✅ | Dashboard + Signage boards + Gate display + voice (TTS) · React+Vite+Tailwind v4+Recharts+Router |
| 5 Integration & demo | 🔲 | **YOUR WORK — see §4** |

Full task-level status is in [`Tracker.md`](Tracker.md). Architecture in
[`TechSpecifications.md`](TechSpecifications.md) and [`AppFlow.md`](AppFlow.md).

---

## 2. How to run it locally

### Backend (port 8000)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # .venv already exists on Harshdeep's machine
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- Health check: `curl http://localhost:8000/health`
- The agent **auto-runs every 20s** in the background; you can also POST `/api/agent/tick`.

### Frontend (port 5173)
```bash
cd frontend
npm install
npm run dev
```
- Open http://localhost:5173
- Vite **proxies `/api` and `/ws` to `localhost:8000`** (see `vite.config.js`) — so just run both.

### Screens (routes)
- `/` — control-room **Dashboard**
- `/display/gate` — passenger **Gate / Entry** display
- `/display/A`, `/display/B` — full-screen **Platform signage boards**
- Use the floating navbar to switch between them.

### Run the demo (camera-less)
1. On the Dashboard, click **Scan → Platform A** ~7 times → gauge fills Green→Yellow→Red, the area chart draws a rising curve.
2. Click **Trigger Agent Tick** (or wait 20s) → agent holds the train, logs reasoning, signage/gate update.
3. Flip **Voice On** in the navbar to hear the announcement.
4. **Reset** button (in Ticket Scan card) puts platforms back to calm.

### Tests
```bash
cd backend && source .venv/bin/activate && pytest -q     # 21 pass
cd agent  && pytest -q                                    # agent + LangGraph parity (pytest.importorskip)
cd cv     && pytest -q                                    # 19 pass
```

---

## 3. How it fits together (so you don't break it)

```
Scan button ─► POST /api/scan      (arrival log)
            └► POST /api/density    (synthetic crowd — drives gauge/graph/agent)
                     │
CV worker  ─► POST /api/density ────┤
                     ▼
              Backend store ──► build_states ──► GET /api/state
                     │
   agent loop (20s) / POST /api/agent/tick
                     ▼
   Supervisor → Crowd∥Train∥Safety → Decision → (Safety gate) → Action
                     │
        ┌────────────┼─────────────────────────────┐
        ▼            ▼                               ▼
  WS /ws/dashboard   WS /ws/display/{A,B}      schedule.hold()
  (state_update,     (signage, redirect)
   agent_action,
   graph_point)
```

**Gotchas I already hit (don't repeat them):**
- **Timestamps are ISO-8601 strings** (`"2026-06-14T..."`), not epoch. Frontend uses `new Date(ts)`.
- **`agent_action` nests everything under `msg.decision`** (decision_id, reasoning, plan, actions_taken, announcement.en).
- **Platform field is `count`**, not `arrival_count`.
- **The scan buttons drive `/api/density`** (the camera-less synthetic path) — that's intentional; the gauge/graph won't move otherwise.
- **Override** (`/api/override`) actually reverses the hold AND the agent won't re-hold an overridden train (tracked in `agent_runner._overridden`).
- **TTS** = browser `speechSynthesis` (free, no key). Needs a user gesture → that's the Voice toggle.
- **No Claude key needed** — template wording is the default; Claude is optional via `.env`.

---

## 4. YOUR WORK — Phase 5 (remaining), in priority order

Detailed guide: [`plan/Phase5-Integration-Demo.md`](plan/Phase5-Integration-Demo.md). Tracker rows 5.1–5.8.

### 🥇 Priority 1 — Deploy (5.6)  → get a live link
Decision already made: **backend → Railway, frontend → Vercel** (synthetic CV runs on Railway; real YOLO stays local).
- **Backend on Railway:** deploy `backend/`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add a `Procfile` or Railway start command. Confirm WebSockets work on the Railway domain (they do over `wss://`).
- **CORS:** `backend/app/main.py` already adds `CORSMiddleware` — set it to allow the Vercel domain (check it's not `*` for prod, or keep `*` for demo).
- **Frontend on Vercel:** the Vite **proxy only works in dev**. For prod you must point the app at the Railway backend. Two options:
  1. **Vercel rewrites** (`vercel.json`) proxying `/api/*` → Railway. *(WS over rewrites can be flaky — test it.)*
  2. **Env-based URLs (recommended):** `useBackend.js` already reads `import.meta.env.VITE_WS_URL`. Set `VITE_WS_URL=wss://<railway-host>/ws/dashboard` on Vercel, and add a `VITE_API_BASE` for the `fetch('/api/...')` calls (currently hardcoded `/api` — small change in `useBackend.js`, `useDisplay.js`, `SignageBoard.jsx`, `GateDisplay.jsx`). Also set the display WS URL similarly.
- **Smoke test:** open the Vercel URL, confirm live state + scan→agent→signage works end-to-end.

### 🥈 Priority 2 — Deterministic demo + script (5.2, 5.7)
- A scripted scenario that always lands the A→RED→rebalance story in <2 min (the scan-button flow already does this; just write the exact click sequence + talking points).
- Talking points: **privacy** (no PII/frames), **autonomy** (closed loop), **safety gate** (LLM can't override), **ethics** (suggest, never command).

### 🥉 Priority 3 — Tests & proofs (5.1, 5.3, 5.4, 5.5)
- **5.1** End-to-end scenario test (automate the worked example).
- **5.3** Privacy proof — show the store holds only counts/%/timestamps (add a tiny `/api/debug/store` or a screenshot of the data).
- **5.4** Graceful degradation — confirm with no Claude key the rule+template path still acts (it does; just document/test it).
- **5.5** Latency check — density ≤2s, loop period, dashboard push.

### Follow-up (not blocking) — Real YOLOv8 (Phase 2 §2.1)
On a machine **with a webcam or a sample clip**:
```bash
cd cv && pip install -r requirements.txt
USE_SYNTHETIC=false python -m cv.run     # point at webcam/clip
```
Confirm `GET /api/state` density moves and measure frame→backend latency. The synthetic path is what the demo uses, so this is optional for the demo but good for the "it's real" story.

---

## 5. Small things worth knowing
- **In-memory store** — restarting the backend resets all state (fine for demo; swap to Redis/SQLite later via `backend/app/deps.py`).
- **Config** via `backend/app/config.py` / `.env` — thresholds (green<60, yellow 60–85, red>85), `hold_max_min=10`, `loop_period_sec=20`, `platform_capacity={A:200,B:200}`, `claude_api_key=""`.
- **Seed** — schedule seeds train 12045@A (held by default) and 12046@B. That's why a fresh tick on A says "already holding"; drive **B** to RED to see a full hold+redirect.
- Design system: warm wa-modern, Zen Old Mincho + Zen Kaku Gothic, palette in `frontend/src/index.css` + `frontend/src/lib/zone.js`.

Ping Harshdeep if `/ws` doesn't connect after deploy — it's almost always CORS or the `VITE_WS_URL`/`wss` config.
