# Demo Script — Autonomous Platform Crowd-Balancing Agent
**FAR AWAY 2026 (Zuup Japan) · Theme: Railways** · target run time: **< 2 minutes**

> One-liner to open with: *"This is an AI station-master that spots a dangerous crowd
> **before** it forms and acts on the **trains and signage** — never on people — with
> **zero personal data** collected."*

---

## 0. Before you present (30 sec setup, off-camera)

1. Start backend + frontend (see [HANDOFF.md](HANDOFF.md) §2):
   ```bash
   cd backend && source .venv/bin/activate && uvicorn app.main:app --port 8000
   cd frontend && npm run dev
   ```
2. Open **two browser windows**:
   - Window 1 → `http://localhost:5173/` (control-room **Dashboard**)
   - Window 2 → `http://localhost:5173/display/A` (passenger **signage board**)
3. On the Dashboard, click **Reset** (Ticket Scan card) so both platforms start calm/GREEN.
4. Flip **Voice On** in the navbar once (a click is required before the browser will speak).

---

## 1. The 90-second run (exact click sequence)

| # | Action | What the audience sees | What you say |
|---|--------|------------------------|--------------|
| 1 | Point at the calm Dashboard | Both platforms GREEN, gauge low, flat graph | "Two platforms, live density. Right now everything's calm and green." |
| 2 | Click **Scan → Platform A** ~**7×** (steady taps) | Gauge climbs Green→Yellow→**RED**; area chart draws a rising curve | "A crowd is building on Platform A — watch it cross into the red zone. Platform B stays empty." |
| 3 | Click **Trigger Agent Tick** (or wait for the 20 s auto-loop) | Agent log appears: **holds train 12045**, suggests **redirect A→B**, plain-English reasoning | "The agent decided **on its own**: hold A's train a few minutes to let it clear, and *suggest* new arrivals consider Platform B. No human approved this." |
| 4 | Switch to the **signage window** (`/display/A`) | Board updates with the calm bilingual (JA/EN) announcement + redirect suggestion | "Passengers see a calm, bilingual message — a suggestion, never an order." |
| 5 | (Voice is on) | Browser **speaks** the announcement | "And it announces it out loud." |
| 6 | Back on Dashboard, click **Scan → Platform A** a few times *less*, or **Reset** | Gauge falls back toward GREEN; the logged decision flips to **normalized** | "Once the platform clears, the agent logs the outcome and stands down. Closed loop." |

> **Fallback if anything is slow:** the agent **auto-ticks every 20 s**, so even without
> clicking *Trigger Agent Tick* the action fires on its own — just keep talking for a beat.

---

## 2. Talking points (the four things judges should remember)

- **Privacy-first.** We store *only* platform number, train ID, counts/percentages, and
  timestamps — **no names, no faces, no camera frames**. Everything auto-expires after the
  train departs. *(Proof: hit `GET /api/debug/store` — the raw store is just numbers and
  timestamps, and it returns `privacy_ok: true`.)* This is DPDP Act 2023 / APPI ready.
- **Fully autonomous.** A continuous *perceive → decide → act → log* loop. No operator
  clicks "approve" — the agent closes the loop itself.
- **Safe by design.** A hard rule engine is always authoritative; the LLM only chooses
  among already-safe options and drafts wording. It can **never** introduce an unsafe
  action. Fail-safe = take no action. *(And it runs fully offline on a deterministic
  template if there's no LLM key — graceful degradation.)*
- **Suggest, never command.** It acts on **infrastructure** (trains, signage,
  announcements), not on people. The redirect is always a *suggestion* — never "go to
  Platform B." Ethical and realistic for a real station.

---

## 3. Likely Q&A

- **"Is the crowd count real?"** Two paths: real **YOLOv8** person-counting from
  cameras (local), and a deterministic **synthetic** feed for a camera-less demo. Today's
  demo uses the synthetic path so it's reproducible on any laptop; the CV pipeline is the
  same either way and never stores a frame. *(See [cv/README.md](cv/README.md) and
  [CV-Verification.md](CV-Verification.md).)*
- **"What if the AI hallucinates a bad instruction?"** It can't act unsafely — the rule
  engine validates every action and the hold is hard-capped at 10 minutes. The LLM only
  writes the wording.
- **"Does it need an internet connection / paid API?"** No. With no API key it runs on
  the deterministic bilingual template — proven by the test suite (5.4).
- **"How does it scale?"** Same architecture for any multi-platform station (Mumbai,
  Shinjuku, Tokyo) — only camera placement changes, not the agent logic.

---

## 4. Hard reset between runs

Click **Reset** on the Dashboard (Ticket Scan card). If state ever looks stuck,
**restart the backend** — the store is in-memory, so a restart returns everything to the
clean seeded baseline (train 12045@A, 12046@B, both platforms GREEN).
