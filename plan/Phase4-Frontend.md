# Phase 4 — Frontend: Dashboard, Displays & TTS (In-Depth)
### Autonomous Platform Crowd-Balancing Agent
**Goal:** A wa-modern React/Tailwind control-room dashboard + passenger displays + voice
output, all driven live over WebSockets.
**Duration estimate:** ~2 days · **Owner:** Frontend
**Depends on:** Phase 1 (WS + REST), Phase 3 (agent actions) · **Unblocks:** Phase 5 (demo)

---

## 1. Objectives
1. Build the control-room dashboard: platform cards, density chart, agent action log.
2. Build passenger-facing surfaces: gate/entry display + platform signage boards (bilingual).
3. Build the simulation "scan" page (buttons / QR) to drive the demo.
4. Wire everything to `/ws/dashboard` and `/ws/display/{id}` — no polling.
5. Play calm bilingual TTS announcements on agent action.
6. Implement operator **Override** (`POST /api/override`).
7. Apply the **[../Design.md] wa-modern** system (traditional Japanese palette, 間 whitespace, JP-first text).

## 2. Exit Criteria
- [ ] Platform cards change 萌黄→山吹→朱 with live count/%/trend, smoothly (no flashing).
- [ ] Density line chart updates live with 60/85 threshold bands.
- [ ] Agent Action Log streams bilingual reasoning with Override buttons.
- [ ] Gate display + signage boards reflect agent redirect/signage messages.
- [ ] An agent announcement triggers audible TTS (JA then EN).
- [ ] Override cancels an action and shows in the log.

---

## 3. Directory Layout
```
frontend/
├── index.html
├── tailwind.config.js        # wa-modern tokens (ai, hanada, moegi, yamabuki, shu...)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── ws.ts             # reconnecting WebSocket hook
│   │   ├── api.ts            # REST: override, scan (sim)
│   │   └── tts.ts            # audio playback queue
│   ├── theme/zones.ts        # zone -> color/label/icon/shape map
│   ├── components/
│   │   ├── PlatformCard.tsx
│   │   ├── DensityChart.tsx
│   │   ├── AgentActionLog.tsx
│   │   ├── StatusBar.tsx
│   │   ├── SignageBoard.tsx
│   │   └── GateDisplay.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Signage.tsx       # /signage/:platformId
│       └── Simulate.tsx      # scan buttons / QR
└── package.json
```

## 4. Stack
- **Vite + React + TypeScript**, **Tailwind CSS**, **Recharts**, **lucide-react** (icons),
  **Noto Sans JP** + **Inter** fonts.

---

## 5. Design Tokens (`tailwind.config.js`)
Mirror [../Design.md] §9 exactly:
```js
theme: { extend: { colors: {
  ai:'#1B2A4A', hanada:'#2E6F95', moegi:'#5C8A3A',
  yamabuki:'#E8A33D', shu:'#D7483B', hi:'#B8352C',
  sumi:'#1A1A1A', kinari:'#F7F4ED',
}, borderRadius:{ card:'16px' },
   fontFamily:{ jp:['"Noto Sans JP"','Inter','sans-serif'] } } }
```

### Zone map (`theme/zones.ts`)
```ts
export const ZONE = {
  GREEN:  { bg:'bg-moegi',   label:'空き / Available', shape:'●', jp:'萌黄' },
  YELLOW: { bg:'bg-yamabuki',label:'混み始め / Filling', shape:'◆', jp:'山吹' },
  RED:    { bg:'bg-shu',     label:'混雑 / Crowded',   shape:'■', jp:'朱'  },
};
```
> Accessibility: always pair color with **label + icon + shape** (color-blind safe), WCAG AA.

---

## 6. Components

### 6.1 `useWs` hook (`lib/ws.ts`)
Reconnecting WebSocket; dispatches messages by `type` (`state_update`, `agent_action`,
`graph_point` for the dashboard; `signage`, `redirect` for displays).

### 6.2 `PlatformCard`
Props: `PlatformState`. Shows ホーム label, zone color, density bar, %, 人数, train + ETA,
trend arrow, 〔保留 HELD〕 badge (緋, slow pulse). Color transitions ~450ms ease.

### 6.3 `DensityChart`
Recharts `LineChart`, one line per platform, `ReferenceLine`/bands at 60 (山吹) & 85 (朱).
Appends from `graph_point` messages; keep a rolling window (e.g. last 60 points).

### 6.4 `AgentActionLog`
Reverse-chron feed from `agent_action`. Each row: timestamp, bilingual `reasoning`, action
chip (HOLD/REDIRECT/ANNOUNCE/SIGNAGE), 〔取消 Override〕 → `POST /api/override`. New rows
slide in with a brief 縹 highlight.

### 6.5 `SignageBoard` / `GateDisplay`
Light "washi paper" (生成) theme; large bilingual text; turns 朱/萌黄 on `signage`; shows
suggestion banner on `redirect` (advisory tone, never imperative).

### 6.6 `StatusBar`
自律運転 / 手動介入 mode indicator, clock, WS connection dot.

---

## 7. TTS (`lib/tts.ts`)
- On an `agent_action` carrying announcement text, enqueue audio: play **JA then EN**.
- Demo options: ElevenLabs (fetch audio URL/blob) or gTTS-generated files served by backend.
- Queue prevents overlap; respects a single "now playing" at a time.

## 8. Routes
| Route | Surface |
|---|---|
| `/` | Control-room Dashboard |
| `/signage/:platformId` | Platform signage board (full-screen) |
| `/gate` | Gate/entry passenger display |
| `/simulate` | Scan buttons / QR (demo driver) |

## 9. Working Against Mocks (parallel start)
Begin right after Phase 1 using a small mock WS server (or a `MOCK=true` flag that emits
scripted `state_update`/`agent_action`/`graph_point`). Swap to the real agent when Phase 3 lands.

## 10. Testing / QA
- Visual: zone transitions are smooth, never flashing (calm requirement).
- Contrast check (WCAG AA) for all zone text/background pairs.
- Bilingual: JP renders with Noto Sans JP; no tofu (□) glyphs.
- Override round-trip: click → backend logs → row marks overridden.
- TTS: announcement audible; JA precedes EN; no overlap.

## 11. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| WS drops mid-demo | reconnecting hook + last-state cache |
| Color-only meaning | label + icon + shape per zone |
| TTS overlap/noise | playback queue, single active clip |
| Flashing feels alarming | 450ms eased transitions, slow HELD pulse |
| JP font not loaded | bundle Noto Sans JP / preconnect Google Fonts |

## 12. Deliverables
- Live dashboard + signage + gate + simulate pages.
- Wa-modern theme tokens applied.
- TTS playback wired.
- [../Tracker.md] Phase 4 rows → ✅.

## 13. Handoff to Phase 5
All surfaces consume real agent output. Phase 5 wires the full chain, tunes latency,
proves privacy, and scripts the <2-minute demo.
