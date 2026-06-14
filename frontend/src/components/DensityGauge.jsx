import { TREND_ICON } from '../lib/zone'

// 240° arc, 120° gap at the bottom. Fills left → top → right.
const SIZE = 176              // square render box
const CX = 100, CY = 100, R = 78, STROKE = 15
const START = -120, SWEEP = 240
const ARC_LEN = 2 * Math.PI * R * (SWEEP / 360)

function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * (Math.PI / 180)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polar(cx, cy, r, startAngle)
  const e = polar(cx, cy, r, endAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
}

function Tick({ frac, color }) {
  const angle = START + frac * SWEEP
  const inner = polar(CX, CY, R - STROKE / 2 - 1, angle)
  const outer = polar(CX, CY, R + STROKE / 2 + 1, angle)
  return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
}

export default function DensityGauge({ densityPct = 0, zoneColor = '#5C8A3A', label = '', trend }) {
  const pct       = Math.max(0, Math.min(densityPct, 100))
  const track     = arcPath(CX, CY, R, START, START + SWEEP)
  const offset    = ARC_LEN * (1 - pct / 100)
  const trendIcon = TREND_ICON[trend]

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg viewBox="0 0 200 200" width={SIZE} height={SIZE}>
        <path d={track} fill="none" stroke="#EFE7D9" strokeWidth={STROKE} strokeLinecap="round" />
        <path
          d={track}
          fill="none"
          stroke={zoneColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.45s ease' }}
        />
        <Tick frac={0.60} color="#FBF1DA" />
        <Tick frac={0.85} color="#F9EAE6" />
      </svg>

      {/* Center stack — nudged up so it sits in the arc bowl */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: 'translateY(-8px)',
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 46, fontWeight: 700, lineHeight: 1, color: zoneColor,
            letterSpacing: '-0.02em',
          }}>
            {Math.round(pct)}
          </span>
          <span style={{ fontSize: 16, color: '#6E6356', fontWeight: 500 }}>%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: zoneColor, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {label}
          </span>
          {trendIcon && <span style={{ color: zoneColor, fontSize: 12 }}>{trendIcon}</span>}
        </div>
      </div>
    </div>
  )
}
