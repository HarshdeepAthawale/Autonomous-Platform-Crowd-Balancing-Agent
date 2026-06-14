# Design Document (UI/UX)
### Autonomous Platform Crowd-Balancing Agent
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.3 · **Last updated:** 2026-06-14 · **Aesthetic:** Wa-Modern (Japanese-inspired, multilingual UI)

---

## 1. Design Philosophy — Wa-Modern

The interface draws from Japanese railway design language (JR / Tokyo Metro / Shinkansen
signage) and *wabi-sabi* restraint: **calm, precise, and uncluttered**. The UI is
**multilingual (English / 日本語 / हिन्दी)** with a runtime language switcher, and the
Japanese influence also carries through color, spacing, and tone.

1. **Purposeful emptiness (Ma).** Generous whitespace; nothing competes for attention.
   The platform that needs you is the only thing that stands out.
2. **Glanceable safety.** Zone status readable in <1 second through color + shape + label.
3. **Calm over alarm.** Even "Red" is a deep, dignified vermilion — urgent, never panicky.
   Soft transitions, no flashing.
4. **Suggest, don't command.** Copy is advisory: "Platform B has more space" not "Go to B".
5. **Trust through transparency.** The operator always sees *why* the agent acted.

---

## 2. Color System — Japanese-Inspired Palette

Safety zones map to refined traditional Japanese colors — calmer and more elegant than
raw web primaries.

| Zone | Density | Name | Hex | Meaning |
|------|---------|------|-----|---------|
| Green | < 60% | Moegi (fresh green) | `#5C8A3A` | Comfortable |
| Yellow | 60–85% | Yamabuki (golden) | `#E8A33D` | Filling up |
| Red | > 85% | Shu (vermilion) | `#D7483B` | Crowded — agent acts |
| Primary | — | Ai (indigo) | `#1B2A4A` | Chrome / dark base |
| Accent | — | Hanada (ocean blue) | `#2E6F95` | Interactive / agent voice |
| Ink | — | Sumi (ink black) | `#1A1A1A` | Primary text (light mode) |
| Paper | — | Kinari (off-white) | `#F7F4ED` | Light surface |
| Critical | — | Hi (crimson seal) | `#B8352C` | Hold badge / alert |

**Two themes:**
- **Control Room — Ai dark mode** (default): `#1B2A4A` indigo base, `#F7F4ED` text, zone colors pop.
- **Public Signage — Kinari light mode**: warm off-white paper background, high-contrast ink.

**Rules:** never color-alone — always pair with a **label + icon + shape**. Target WCAG AA.
Zone tones are slightly desaturated vs. web defaults to keep the calm register.

---

## 3. Typography & Layout

- **Primary font:** Inter — tabular figures for counts; large, confident numerals.
- **Display headers:** Inter or a clean geometric sans; no decorative fonts.
- **Grid:** 12-col dashboard; cards 3–4 cols; graph full-width. 8px spacing scale.
- **Breathing room:** ≥24px around key elements; avoid dense borders — use whitespace +
  subtle dividers (`#2A3A5C` on dark).
- **Corners & depth:** soft 12–16px radii, gentle shadows (no harsh neon glow).
- **Framework:** React + Tailwind CSS (custom theme tokens, see §9).

---

## 4. Surfaces

### 4.1 Control Room Dashboard — Ai dark mode (primary)
```
┌────────────────────────────────────────────────────────────────────────────┐
│  Crowd-Balancing Agent                        ● AUTONOMOUS         12:04  │
├───────────────────────────────────┬────────────────────────────────────────┤
│  PLATFORM A             ■ RED     │  PLATFORM B              ● GREEN       │
│  Train 12045 · ETA 6 min [HELD]   │  Train 12046 · ETA 9 min              │
│  ▓▓▓▓▓▓▓▓▓░  92%   ↑ Rising       │  ▓▓▓░░░░░░░  35%   → Stable           │
│  184 people                       │  70 people                             │
├───────────────────────────────────┴────────────────────────────────────────┤
│  DENSITY OVER TIME   (A vs B · threshold bands at 60% / 85%)               │
│   100│            ╭─A───╮                                                   │
│      │     ╭──────╯      ╰────  (A bends down after hold)                  │
│      │ ────╯   B ─────────────                                              │
│     0└──────────────────────────────────────────────────────────────────   │
├──────────────────────────────────────────────────────────────────────────  │
│  AGENT ACTION LOG                                                           │
│  12:04:30  Platform A is RED & rising (92%). Platform B is GREEN (35%,     │
│            train in 9 min). Action: hold + redirect suggestion + announce. │
│                                                                  [Override] │
│  12:04:31  Train 12045 held +10 min (reversible).               [Override] │
│  12:04:31  Redirect suggestion sent to gate display → Platform B.[Override] │
│  12:04:32  Announcement played (calm advisory tone).             [Override] │
└──────────────────────────────────────────────────────────────────────────  ┘
```

**Components**
- `PlatformCard` — zone color (Red/Yellow/Green), density bar, %, count, train + ETA,
  trend arrow (↑↓→), `[HELD]` badge in Hi crimson with slow breathing pulse.
- `DensityChart` — Recharts line per platform; faint threshold bands at 60% (Yamabuki) / 85% (Shu).
- `AgentActionLog` — reverse-chron feed; plain-English reasoning, action chip, `[Override]` button.
- `StatusBar` — AUTONOMOUS / OVERRIDE MODE indicator, live clock, connection dot.

### 4.2 Gate / Entry Display — Kinari light mode (passenger-facing)
```
┌───────────────────────────────────────────────┐
│   Welcome — please scan your ticket.           │
│   ─────────────────────────────────────────    │
│   ⚠  Platform A is busy right now.             │
│                                                │
│   If your train allows, Platform B (2 min      │
│   walk) has a train arriving sooner with        │
│   more space available.                        │
│                                                │
│            [ This is a suggestion ]            │
└───────────────────────────────────────────────┘
```
Tone: polite, advisory. Never imperative ("Go to Platform B"). Always framed as a suggestion.

### 4.3 Platform Signage Board (JR/Metro-style)
```
┌────────────────────────┐     ┌────────────────────────┐
│  PLATFORM A            │     │  PLATFORM B            │
│  ■ CROWDED             │     │  ● AVAILABLE           │
│  184 people            │     │  Train in 4 min        │
│  Train held +10 min    │     │  Extra capacity        │
│  Held for your safety  │     │                        │
└────────────────────────┘     └────────────────────────┘
     Shu vermilion bg               Moegi green bg
```

### 4.4 Simulation / Scan Page (demo control)
- Buttons: **Scan Ticket → Platform A** / **→ Platform B** (each = +1 arrival).
- Optional QR scan via phone camera for live demo.
- Live count readouts mirror the backend, styled as a station departure board.

---

## 5. Interaction & Motion (restrained)

- **Zone transitions** ease over ~450ms (Green → Yellow → Red); **no flashing** — stays calm.
- **New log entries** slide in from top with a brief Hanada (blue) highlight, then settle.
- **`[HELD]` badge** breathes with a slow ~2s pulse (not blinking).
- **Override** needs a single confirm tap — prevents accidental cancel.
- Motion easing: `cubic-bezier(0.4, 0, 0.2, 1)` — gentle, never bouncy.

---

## 6. Voice / Announcement Design (TTS)

- **Tone:** calm, measured, reassuring — like real Japanese station announcements in style, but in English.
- **Structure:** acknowledge → explain → reassure → inform alternative.
- **Template:**
  > *"Attention passengers for Train {train_id} — this train will be held briefly for your
  > safety and comfort. The train at Platform {alt_platform} is arriving shortly with more
  > space available."*
- LLM-drafted variants stay in this calm, polite register (low temperature + style guardrails).

---

## 7. Empty / Edge States

| State | Treatment |
|-------|-----------|
| All platforms green | Calm dashboard, "All platforms balanced" banner in Hanada blue |
| Signal lost | Card greyed (Sumi) + "Signal unavailable — agent paused (fail-safe)" |
| Operator override active | Status bar → Yamabuki amber "OVERRIDE MODE" |
| No safe redirect target | Log: "Hold only — no safe alternative platform" |

---

## 8. Iconography
- Minimal line icons (1.5px stroke), rounded caps — matches wa-modern softness.
- Zone shapes for color-blind safety: Green = ●, Yellow = ◆, Red = ■ (shape ≠ color dependency).
- Railway glyphs: station, train, hold, announcement, redirect arrow.

---

## 9. Design Tokens (Tailwind theme excerpt)
```js
// tailwind.config — theme.extend.colors
const colors = {
  ai:       '#1B2A4A',  // Ai indigo — dark base/chrome
  hanada:   '#2E6F95',  // Hanada — accent/interactive
  moegi:    '#5C8A3A',  // Moegi — green zone
  yamabuki: '#E8A33D',  // Yamabuki — yellow zone
  shu:      '#D7483B',  // Shu — red zone
  hi:       '#B8352C',  // Hi — critical/hold badge
  sumi:     '#1A1A1A',  // Sumi — ink text
  kinari:   '#F7F4ED',  // Kinari — paper/light surface
};
// radii: card 16px · chip 9999px   |   shadow: soft, low-opacity
// font: 'Inter', sans-serif  (tabular-nums for counts)
```

---

## 10. Demo Visual Story (judges)

Green → Yellow → Red on Platform A; the agent log lights up with plain-English reasoning;
A's board turns vermilion with "Train Held", B's turns fresh-green with "Extra Capacity";
a calm English voice plays; A's density curve bends down. Then point to the store — only
numbers and percentages, no faces, no names.

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Schema.md], [ImplementationPlan.md], [Rules.md].*
