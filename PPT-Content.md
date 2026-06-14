# Hackathon PPT — Content Pack
**Project:** Autonomous Platform Crowd-Balancing Agent (群衆バランス・エージェント)
**Event:** FAR AWAY 2026 (Zuup Japan) · Theme: Railways
**Use this doc:** each `##` section = one slide. "On slide" = what to put on the slide
(keep it short — bullets/visuals). "Say" = speaker note (don't put on slide). Suggested
deck length: **10–12 slides**, ~5–6 min talk.

> Design tip for the deck: clean, Japanese-railway / JR-Metro feel. Off-white background,
> one accent color, big readable type. Use the **Green / Yellow / Red** zone colors as a
> visual motif. Minimal text per slide — let the live demo carry the story.

---

## Slide 1 — Title
**On slide:**
- Autonomous Platform Crowd-Balancing Agent
- 群衆バランス・エージェント
- One-liner: *"An AI station-master that prevents dangerous crowding — acting on trains & signage, never on people, with zero personal data."*
- **Team:** Deepesh Kakkar · Parth Deshmukh · Harshdeep Athawale · Akarsh Dhingra · Himanish Puri
- FAR AWAY 2026 (Zuup Japan) · Theme: Railways

**Say:** Quick hook — "Stampedes at stations are preventable. We built an AI that catches a dangerous crowd before it forms."

---

## Slide 2 — The Problem
**On slide:**
- Railway platforms get dangerously, **unevenly** crowded — one platform packed, the next half-empty
- Consequences:
  - 🚨 Stampede risk (peak hours, festivals)
  - 👜 Pickpocketing & lost luggage thrive in dense crowds
  - 😠 Frustration, altercations, missed trains
  - 🚆 Trains depart on fixed schedules regardless of crowd
- Today's systems are **manual** (staff watching CCTV) or **informational** (a number on a screen) — **nobody closes the loop**

**Say:** The gap isn't *seeing* the crowd — it's *acting* on it, in real time, automatically.

---

## Slide 3 — The Solution
**On slide:**
- A **fully autonomous agent** that: perceives platform density → reasons → **acts on its own**
- Actions: **holds a train** a few minutes · **suggests** a less-crowded platform · **updates signage** · **announces** calmly (bilingual)
- **Zero human intervention. Zero personal data.**
- In one line: *Scan ticket → agent sees live density → if one platform is overcrowded and a neighbor isn't, it holds that train, suggests the other platform, and announces it.*

**Say:** It doesn't direct *people* — it nudges *infrastructure*. That's what makes it safe and deployable.

---

## Slide 4 — How It Works (the loop)
**On slide:** (use a simple left-to-right diagram)
```
Perceive → Decide → Act → Log
  cameras/scan   multi-agent     hold train       plain-English
  → density %    reasoning       + signage        decision log
                 + safety gate   + announcement   (auto-expires)
```
- Continuous loop, **auto-runs every 20 seconds**
- **Zones:** 🟢 Green <60%  ·  🟡 Yellow 60–85%  ·  🔴 Red >85%
- Hold is **hard-capped at 10 min** and fully reversible

**Say:** Walk through one cycle: it perceives a Red platform, decides to hold + redirect, acts, then logs why — and stands down once the platform clears.

---

## Slide 5 — Architecture (hierarchical multi-agent)
**On slide:** (diagram)
```
            Station Supervisor
        ┌─────────┼─────────┐
     Crowd      Train     Safety      (run in parallel)
        └─────────┼─────────┘
              Decision Agent   → builds a safety-validated plan
              Action Agent     → holds train / signage / announce / log
```
- **Safety Agent's gate is authoritative** — the LLM can *never* produce an unsafe action
- Built on **LangGraph**; runs in-process inside the backend for demo reliability

**Say:** Three specialist agents analyze in parallel, a Decision agent synthesizes, an Action agent executes. The rule engine validates everything — the LLM only writes wording.

---

## Slide 6 — Tech Stack
**On slide:** (table or icon grid)
| Layer | Tech |
|---|---|
| Crowd detection | **YOLOv8** (Ultralytics) + OpenCV · synthetic fallback |
| Agent core | **LangGraph** hierarchical multi-agent |
| Reasoning | **Claude** / Groq (Llama 3) — optional; rule+template fallback |
| Backend | **FastAPI** + WebSockets (real-time push) |
| Frontend | **React + Vite + Tailwind + Recharts** |
| Voice | Browser TTS (bilingual JA/EN announcements) |
| Hosting | **Vercel** (frontend) + **Railway** (backend) |

**Say:** Everything runs on a laptop. No paid API required — with no key it falls back to a deterministic bilingual template.

---

## Slide 7 — What Makes It Different (key principles)
**On slide:**
- 🔒 **Privacy-first** — stores only counts, %, platform/train IDs, timestamps. **No names, faces, or camera frames.** Auto-expires after the train departs. *(DPDP Act 2023 / APPI ready)*
- 🤖 **Fully autonomous** — closed perceive→act loop, no "approve" button
- 🛡️ **Safe by design** — hard rule engine is authoritative; fail-safe = do nothing
- 🤝 **Suggest, never command** — acts on infrastructure, never orders people
- 🌏 **Wa-modern bilingual UI** — Japanese-railway design, JA-first signage

**Say:** These four lines are the heart of the pitch — privacy, autonomy, safety, ethics.

---

## Slide 8 — Live Demo
**On slide:**
- "Watch a crowd build on Platform A → the agent acts on its own"
- 3 steps: **Scan A → goes RED** · **Agent holds train + suggests B** · **Signage + voice announce**
- (Embed a screenshot of the Dashboard with a RED gauge + the agent decision log)

**Say:** Run the live demo here (see DemoScript.md). Fallback: the agent auto-ticks every 20s, so it fires even without clicking. Emphasize: *nobody approved this — it decided.*

---

## Slide 9 — Impact
**On slide:**
| Risk | How we address it |
|---|---|
| Stampedes / overcrowding | Early alerts + automatic redistribution before danger |
| Pickpocketing & lost luggage | Even distribution removes dense, chaotic conditions |
| Violence / altercations | Calmer platforms, clear bilingual info |
| Missed trains | Held-train buffer instead of departing into a packed platform |
- **Scalable:** same logic for any multi-platform station (Mumbai, Delhi, Shinjuku, Tokyo) — only camera placement changes

**Say:** It's not just safer — it improves throughput by reducing bunching.

---

## Slide 10 — Ethics & Real-World Readiness
**On slide:**
- The agent **informs and suggests** — it never commands people where to go
- Acts on **infrastructure**, not bodies → safe, realistic, ethical
- **No personal data / no imagery stored** → launch-ready under India's DPDP Act 2023 & Japan's APPI
- Not a hackathon toy — a deployable design

**Say:** This is the "why it's real" slide — judges love regulatory-ready + ethical-by-design.

---

## Slide 11 — Status & What's Built
**On slide:**
- ✅ Backend (FastAPI + WS + auto-expiry) — **21 tests**
- ✅ CV pipeline (YOLOv8 + synthetic) — **19 tests**
- ✅ Hierarchical multi-agent core (LangGraph parity) — **29+ tests**
- ✅ Full frontend (dashboard, signage boards, gate display, voice)
- ✅ Privacy proof endpoint + end-to-end / degradation / latency tests
- 🔲 Cloud deploy (Vercel + Railway) — in progress

**Say:** It's working end-to-end locally today; everything you'll see is real, not mocked.

---

## Slide 12 — Closing / Ask
**On slide:**
- *"No stampedes. No chaos. Just smart, autonomous, real-time crowd balancing — with zero personal data."*
- Repo / demo link (add it)
- **Thank you** — Deepesh Kakkar · Parth Deshmukh · Harshdeep Athawale · Akarsh Dhingra · Himanish Puri

**Say:** End on the one-liner and the live demo memory. Invite questions.

---

## Appendix — Likely Q&A (keep as backup slides, don't present)
- **Real crowd count?** Two paths — real YOLOv8 from cameras (local) + deterministic synthetic feed for a camera-less demo. Never stores a frame.
- **AI hallucinates a bad action?** Can't — rule engine validates every action; hold capped at 10 min; LLM only writes wording.
- **Needs internet / paid API?** No — runs offline on a bilingual template if there's no key.
- **How does it scale?** Same architecture per station; only camera placement changes.
- **Latency?** Density ingest and agent decision both under ~2 seconds.

---

## Notes for the deck-maker (Jr.)
- Pull diagrams from the README (it has Mermaid flowcharts for the loop & architecture — you can screenshot or redraw them cleanly).
- Use the zone colors (Green/Yellow/Red) consistently as the visual theme.
- Keep ≤ 5 bullets per slide; move detail into speaker notes.
- The single most important slides for scoring: **2 (Problem)**, **3 (Solution)**, **7 (Differentiators)**, **8 (Demo)**.
- Source docs in the repo if you need more detail: `readme.md`, `PRD.md`, `TechSpecifications.md`, `DemoScript.md`, `Design.md`.
