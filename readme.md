# 🚉 Autonomous Platform Crowd-Balancing Agent

### FAR AWAY 2026 — Theme: Railways
*"No stampedes. No chaos. Just smart, autonomous, real-time crowd balancing."*

---

## 🧩 The Problem

Indian (and global) railway stations regularly face dangerous platform overcrowding —
passengers pile onto one platform while an adjacent platform sits half-empty, simply
because no one has real-time visibility into crowd distribution. This leads to:

- **Stampede risk** during peak hours and festival rushes
- **Pickpocketing & lost luggage**, which thrive in dense, chaotic crowds
- **Frustration and altercations** from delays and confusion
- **Inefficient train holding/departure**, since trains leave on fixed schedules
  regardless of how crowded the platform actually is

Current systems are either fully manual (staff watching CCTV) or purely informational
(just showing a crowd count with no action taken). **Nobody closes the loop.**

---

## 💡 The Solution

An **autonomous agent** that perceives platform crowd density in real time, reasons
about the best course of action, and **acts on its own** — holding trains, redirecting
passengers, updating signage, and making calm multilingual announcements — with **zero
human intervention** and **zero personal data collection**.

**How it works, in one line:**
> Scan your ticket → Agent sees live crowd density on every platform → If one platform
> is overcrowded and a nearby one isn't, the Agent holds that platform's train a few
> extra minutes, redirects new arrivals, and announces the change — calmly, in
> English, Hindi, and Japanese.

### Key Principles
- 🔒 **Privacy-first** — only platform number, train ID, and timestamp are logged. No
  names, photos, or personal data. Data auto-expires after the train departs.
- 🤖 **Fully agentic** — perceive → decide → act loop runs continuously, no operator
  needs to click "approve."
- 🗣️ **Human-friendly** — the agent *informs and suggests*, never commands people
  physically. All actions are on infrastructure (trains, signals, displays).
- 🌍 **Multilingual** — announcements in English, Hindi, and Japanese for real-world
  deployability in India and Japan.

---

## 🏗️ System Architecture

![System Architecture](architecture.png)

**Flow summary:**

1. **Entry** — Passenger scans ticket QR/barcode at the gate. A reader picks up the
   platform number + train ID and sends it to the backend (FastAPI). No personal data
   is stored — only an anonymous arrival count per platform.
2. **Sensing** — Cameras on each platform run **YOLOv8 + OpenCV** to count people in
   real time. This is converted into a density % per platform and tracked over time
   using **Pandas/NumPy**.
3. **Agentic Decision Core** — A **LangGraph/CrewAI** agent continuously watches
   ticket arrivals + live density + train schedules. It uses rule-based safety
   thresholds (Green <60%, Yellow 60–85%, Red >85%) plus an **LLM (Claude/GPT)** for
   nuanced reasoning and natural-language announcement drafting.
4. **Action** — When Platform A is Red and Platform B is Green/Yellow with a
   near-term train:
   - 🚆 **Hold Signal** → Platform A's train held a few extra minutes via scheduling API
   - 🧭 **Redirect Suggestion** → gate displays show "Platform B has more space"
   - 📢 **TTS Announcement** → calm, multilingual voice announcement
   - 🚦 **Signage Update** → red/green live indicators on display boards
5. **Dashboard** — A **React** control-room dashboard shows live density line graphs,
   platform heatmaps, and a running log of every decision the agent made — for human
   oversight, not control.

---

## 🛠️ Tech Stack

| Layer | Tools / Libraries | Purpose |
|---|---|---|
| Ticket Scan / Entry | QR/barcode scanner, FastAPI endpoint | Capture platform + train ID, log arrival event |
| Crowd Detection | YOLOv8 (Ultralytics), OpenCV | Real-time person counting per platform |
| Data & Trends | Pandas, NumPy | Rolling density %, trend detection |
| Visualization | Recharts, matplotlib | Live density graphs, zone heatmaps |
| Agent Core | LangGraph / CrewAI | Perceive → decide → act orchestration |
| Reasoning | Claude / GPT-4 API | Decision-making + multilingual announcement drafting |
| Voice | ElevenLabs / gTTS | English, Hindi, Japanese announcements |
| Backend | FastAPI + WebSockets | Real-time event handling |
| Frontend | React + Tailwind CSS | Control room dashboard |
| Hosting | AWS EC2 | Demo deployment |

---

## 🌟 Impact

| Risk Addressed | How |
|---|---|
| Stampedes / overcrowding | Early density alerts + automatic crowd redistribution before danger thresholds |
| Pickpocketing & lost luggage | Even crowd distribution removes the dense, chaotic conditions these thrive in |
| Violence / altercations | Calmer platforms, clear multilingual communication, visible wait/capacity info |
| Missed trains | Held-train logic gives a buffer instead of trains leaving into a packed platform |
| Operational efficiency | Smarter train holding reduces bunching and improves overall throughput |

**Scalability:** The same architecture works for any multi-platform station — in
India (Mumbai, Delhi, Howrah) or Japan (Shinjuku, Tokyo Station) — without any change
to the core agent logic, only camera/sensor placement.

**Real-world readiness:** Because no personal data is collected or stored, this
system can be deployed without violating India's DPDP Act 2023 or Japan's APPI —
making it genuinely launch-ready, not just a hackathon concept.

---

## 🎬 Demo

A 2-platform live demo (Platform A: crowded, Platform B: scattered) shows the full
loop — detection → agent decision → train hold → redirect → multilingual
announcement → dashboard update — end to end in under a minute.

---

*Built for FAR AWAY 2026 — India's Biggest International Hackathon 🇮🇳🇯🇵*
