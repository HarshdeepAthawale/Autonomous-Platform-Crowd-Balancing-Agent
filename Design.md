# Design Document (UI/UX)
### Autonomous Platform Crowd-Balancing Agent · 群衆バランス・エージェント
**Hackathon:** FAR AWAY 2026 (Zuup Japan) — Theme: Railways
**Status:** Draft v1.1 · **Last updated:** 2026-06-14 · **Aesthetic:** Modern Japanese (和モダン / *wa-modern*)

---

## 1. Design Philosophy — 和モダン (Wa-Modern)

The interface borrows from Japanese railway design language (JR / Tokyo Metro / Shinkansen
signage) and the principles of *wabi-sabi* restraint: **calm, precise, and uncluttered**.

1. **間 (Ma) — purposeful emptiness.** Generous whitespace; nothing competes for attention.
   The platform that needs you is the only thing that stands out.
2. **Glanceable safety.** Zone status readable in <1 second through color + shape + label.
3. **静けさ (Calm) over alarm.** Even "Red" is a deep, dignified vermilion — urgent, never
   panicky. Soft transitions, no flashing.
4. **Bilingual by default.** Every passenger-facing surface shows **日本語 first, English
   second** — real-world deployable in Japan.
5. **Suggest, don't command.** Copy is advisory and polite (丁寧語 / *teineigo* register).
6. **Trust through transparency.** The operator always sees *why* (なぜ) the agent acted.

---

## 2. Color System — 伝統色 (Traditional Japanese Palette)

Safety zones map to refined traditional Japanese colors — recognizable as green/amber/red,
but calmer and more elegant than raw web primaries.

| Zone | Density | 和名 (Name) | Color | Hex | Meaning |
|------|---------|------------|-------|-----|---------|
| Green | < 60% | 萌黄 *Moegi* (fresh green) | [GREEN] | `#8CB369` → `#5C8A3A` | 空いています — Comfortable |
| Yellow | 60–85% | 山吹 *Yamabuki* (golden) | [YELLOW] | `#E8A33D` | 混み始め — Filling up |
| Red | > 85% | 朱 *Shu* (vermilion) | [RED] | `#D7483B` | 混雑 — Crowded, agent acts |
| Primary | — | 藍 *Ai* (indigo) | [INDIGO] | `#1B2A4A` | Chrome / background base |
| Accent | — | 縹 *Hanada* (blue) | [HANADA] | `#2E6F95` | Interactive / agent voice |
| Ink | — | 墨 *Sumi* (ink black) | [INK] | `#1A1A1A` | Primary text on light |
| Paper | — | 生成 *Kinari* (off-white) | [PAPER] | `#F7F4ED` | Light surface / "washi paper" |
| Seal | — | 緋 *Hi* (crimson seal) | [SEAL] | `#B8352C` | Critical badge / hold marker |

**Two themes:**
- **Control Room — 藍 dark mode** (default): `#1B2A4A` indigo base, `#F7F4ED` text, zone colors pop.
- **Public Signage — 生成 light mode**: warm off-white "washi" paper background, high-contrast ink.

**Rules:** never color-alone — always pair with a **label + icon + shape**. Target WCAG AA.
Zone tones are slightly desaturated vs. web defaults to keep the *calm* register.

---

## 3. Typography & Layout

- **Japanese:** Noto Sans JP (本文) / Noto Serif JP for large headers (見出し).
- **Latin/Numerals:** Inter with **tabular figures** for counts; large, confident numerals.
- **Bilingual hierarchy:** 日本語 primary weight, English secondary (smaller, lighter).
- **Grid:** 12-col dashboard; cards 3–4 cols; graph full-width. 8px spacing scale.
- **Ma:** ≥24px breathing room around key elements; avoid dense borders — use whitespace + subtle dividers (`#2A3A5C` on dark).
- **Corners & depth:** soft 12–16px radii, gentle shadows (no harsh neon glow). Subtle *washi*-paper texture allowed on light surfaces.
- **Framework:** React + Tailwind CSS (custom theme tokens, see §9).

---

## 4. Surfaces

### 4.1 Control Room Dashboard — 藍 dark mode (primary)
```
┌────────────────────────────────────────────────────────────────────────────┐
│  群衆バランス・エージェント   Crowd-Balancing Agent     ● 自律運転 AUTONOMOUS  12:04 │
├───────────────────────────────────┬────────────────────────────────────────┤
│  ホーム A  PLATFORM A   ┃ 朱 RED ┃ │   ホーム B  PLATFORM B   ┃ 萌黄 GREEN ┃    │
│  列車 12045 · 到着 6分 〔保留 HELD〕  │   列車 12046 · 到着 9分                  │
│  ▓▓▓▓▓▓▓▓▓░  92%   ↑ 増加中         │   ▓▓▓░░░░░░░  35%   → 安定               │
│  人数 184 人                        │   人数 70 人                            │
├───────────────────────────────────┴────────────────────────────────────────┤
│  密度の推移  DENSITY OVER TIME   (A vs B · threshold bands at 60 / 85)        │
│   100│            ╭─A───╮                                                      │
│      │     ╭──────╯      ╰────  (A bends down after hold)                      │
│      │ ────╯   B ─────────────                                                 │
│     0└────────────────────────────────────────────────────────────────       │
├──────────────────────────────────────────────────────────────────────────────┤
│  エージェント行動ログ  AGENT ACTION LOG                                       │
│  12:04:30  ホームA が朱(92%)に到達・増加中。ホームB は萌黄・列車9分 →           │
│            保留＋誘導＋放送 を実行。 / Platform A RED & rising…   〔取消 Override〕│
│  12:04:31  列車12045 を +10分 保留(取消可)。 HOLD +10m            〔取消 Override〕│
│  12:04:31  到着客へホームB を提案。 Suggest Platform B            〔取消 Override〕│
│  12:04:32  放送を再生(穏やかな案内)。 Announcement played          〔取消 Override〕│
└──────────────────────────────────────────────────────────────────────────────┘
```

**Components**
- `PlatformCard` — zone color (朱/山吹/萌黄), density bar, %, count (人), train + ETA, trend
  arrow (↑↓→), 〔保留 HELD〕 badge in 緋 crimson.
- `DensityChart` — Recharts line per platform; faint threshold bands at 60% (山吹) / 85% (朱).
- `AgentActionLog` — reverse-chron feed; bilingual reasoning, action chip, 〔取消 Override〕.
- `StatusBar` — 自律運転 / 手動介入 (autonomous / override) mode, clock, connection dot.

### 4.2 Gate / Entry Display — 生成 light mode (passenger-facing, bilingual)
```
┌───────────────────────────────────────────────┐
│   ようこそ。きっぷをスキャンしてください。         │
│   Welcome — please scan your ticket.           │
│   ─────────────────────────────────────────    │
│   ⚠ ただ今ホームA は混雑しています。             │
│      Platform A is busy right now.             │
│                                                │
│   ご乗車の列車が許せば、ホームB(徒歩2分)が       │
│   より早く到着し、ゆとりがあります。              │
│   If your train allows, Platform B (2 min walk)│
│   has a train arriving sooner with more space. │
│                                                │
│            〔 これはご提案です / a suggestion 〕  │
└───────────────────────────────────────────────┘
```
Tone: polite, advisory (丁寧語). Never 命令形 ("PLATFORM B へ行け"). Always framed as ご提案.

### 4.3 Platform Signage Board (JR/Metro-style, bilingual)
```
┌────────────────────────┐     ┌────────────────────────┐
│  ホーム A  PLATFORM A    │     │  ホーム B  PLATFORM B    │
│  ● 混雑  CROWDED         │     │  ● 空き  AVAILABLE       │
│  184 人  /  people       │     │  あと 4分  Train in 4 min │
│  列車保留 +10分           │     │  ゆとりあり               │
│  安全のため HELD for      │     │  extra capacity          │
│  your safety             │     │                          │
└────────────────────────┘     └────────────────────────┘
     朱 (vermilion bg)              萌黄 (fresh-green bg)
```

### 4.4 Simulation / "Scan" Page (demo control)
- Buttons: **きっぷをスキャン → ホーム A** / **→ ホーム B** (each = +1 arrival).
- Optional QR scan via phone camera for live demo.
- Live count readouts (人数) mirror the backend, styled as a station departure board.

---

## 5. Interaction & Motion (静 — restrained)

- **Zone transitions** ease over ~450ms (萌黄→山吹→朱); **no flashing** — stays calm.
- **New log entries** slide in from top with a brief 縹 (hanada) highlight, then settle.
- **〔保留 HELD〕 badge** breathes with a slow ~2s pulse (not blinking).
- **Override** needs a single confirm tap (誤操作防止 — prevents accidental cancel).
- Motion easing: `cubic-bezier(0.4, 0, 0.2, 1)` — gentle, never bouncy.

---

## 6. Voice / Announcement Design (TTS · 構内放送)

- **Tone:** calm, measured, reassuring — like real Japanese station announcements; moderate pace, polite (丁寧語).
- **Bilingual:** Japanese first, then English.
- **Structure:** 呼びかけ acknowledge → 理由 explain → 安心 reassure → 案内 inform alternative.
- **Template:**
  > 「列車 {train_id} をご利用のお客様へ。安全のため、この列車をしばらく停車いたします。
  > ホーム {alt_platform} の列車はまもなく到着し、ゆとりがございます。」
  > *"Attention passengers for Train {train_id} — this train will be held briefly for your
  > safety. The train at Platform {alt_platform} is arriving shortly with more space."*
- LLM-drafted variants stay in this calm, polite register (low temperature + style guardrails).

---

## 7. Empty / Edge States

| State | Treatment |
|-------|-----------|
| All platforms green | Calm dashboard, 「全ホーム 均衡」 "All platforms balanced" banner in 縹 |
| Signal lost | Card greyed (墨) + 「信号なし — 安全停止」 "Signal unavailable — agent paused (fail-safe)" |
| Operator override active | Status bar → 山吹 amber 「手動介入 OVERRIDE MODE」 |
| No safe redirect target | Log: 「保留のみ — 代替ホームなし」 "Hold only — no safe alternative" |

---

## 8. Iconography
- Minimal line icons (1.5px stroke), rounded caps — matches *wa-modern* softness.
- Zone shapes for color-blind safety: Green = ●, Yellow = ◆, Red = ■ (shape ≠ color dependency).
- Railway glyphs: station, train, hold, announcement, redirect.

---

## 9. Design Tokens (Tailwind theme excerpt)
```js
// tailwind.config — theme.extend.colors
const colors = {
  ai:      '#1B2A4A',  // 藍 indigo — base/chrome (dark)
  hanada:  '#2E6F95',  // 縹 — accent/interactive
  moegi:   '#5C8A3A',  // 萌黄 — green zone
  yamabuki:'#E8A33D',  // 山吹 — yellow zone
  shu:     '#D7483B',  // 朱 — red zone
  hi:      '#B8352C',  // 緋 — critical/hold badge
  sumi:    '#1A1A1A',  // 墨 — ink text
  kinari:  '#F7F4ED',  // 生成 — paper/light surface
};
// radii: card 16px · chip 9999px   |   shadow: soft, low-opacity
// font: 'Noto Sans JP', 'Inter', sans-serif  (tabular-nums for counts)
```

---

## 10. Demo Visual Story (judges)
萌黄 → 山吹 → 朱 on Platform A; the agent log lights up with bilingual reasoning; A's board turns
vermilion with 「列車保留」, B's turns fresh-green with 「ゆとりあり」; a calm Japanese-first voice
plays; A's density curve bends down. Then point to the store — only 数値 (numbers), 顔なし (no faces).

*See [PRD.md], [TechSpecifications.md], [AppFlow.md], [Schema.md], [ImplementationPlan.md], [Rules.md].*
