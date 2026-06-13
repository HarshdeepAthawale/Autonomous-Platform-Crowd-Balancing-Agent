import { ZONE_COLOR, TREND_ICON, classifyZone } from '../lib/zone'

export default function PlatformCard({ state }) {
  if (!state) return <SkeletonCard />

  const { platform_id, density_pct = 0, arrival_count = 0, zone, trend, next_train } = state

  const zoneKey   = zone ?? classifyZone(density_pct)
  const zc        = ZONE_COLOR[zoneKey] ?? ZONE_COLOR.GREEN
  const trendIcon = TREND_ICON[trend] ?? '→'
  const isHeld    = next_train?.held === true
  const barPct    = Math.min(density_pct, 100)

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderLeft: `4px solid ${zc.bg}`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '28px 28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ color: '#6B7280', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Platform
            </p>
            <p style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
              {platform_id}
            </p>
          </div>

          <span style={{
            backgroundColor: zc.lightBg,
            color: zc.bg,
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 9999,
            letterSpacing: '0.05em',
            border: `1px solid ${zc.bg}30`,
          }}>
            {zc.shape} {zc.label}
          </span>
        </div>

        {/* Big density number */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
            <span style={{ color: zc.bg, fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {Math.round(density_pct)}
            </span>
            <div style={{ paddingBottom: 8 }}>
              <span style={{ color: '#6B7280', fontSize: 20, fontWeight: 500 }}>%</span>
              <span style={{ color: zc.bg, fontSize: 20, marginLeft: 8 }}>{trendIcon}</span>
            </div>
            <div style={{ marginLeft: 'auto', paddingBottom: 8, textAlign: 'right' }}>
              <p style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>People</p>
              <p style={{ color: '#1A1A1A', fontSize: 18, fontWeight: 700, margin: 0 }}>{arrival_count}</p>
            </div>
          </div>

          {/* Thin progress bar */}
          <div style={{ height: 4, backgroundColor: '#F0EEE9', borderRadius: 9999, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: `${barPct}%`,
              backgroundColor: zc.bg,
              borderRadius: 9999,
              transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>

          {/* Threshold ticks */}
          <div style={{ position: 'relative', height: 6, marginTop: 1 }}>
            <div style={{ position: 'absolute', left: '60%', top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 1, height: 4, backgroundColor: '#E8A33D99' }} />
              <span style={{ color: '#E8A33D', fontSize: 9, fontWeight: 600 }}>60</span>
            </div>
            <div style={{ position: 'absolute', left: '85%', top: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ width: 1, height: 4, backgroundColor: '#D7483B99' }} />
              <span style={{ color: '#D7483B', fontSize: 9, fontWeight: 600 }}>85</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: '#F0EEE9', margin: '16px 0' }} />

        {/* Train info */}
        {next_train ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🚆</span>
              <div>
                <p style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>Next Train</p>
                <p style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, margin: 0 }}>{next_train.train_id}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1px' }}>ETA</p>
                <p style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 600, margin: 0 }}>{next_train.eta_min} min</p>
              </div>
              {isHeld && (
                <span className="breathe" style={{
                  backgroundColor: '#B8352C',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  letterSpacing: '0.08em',
                }}>
                  HELD
                </span>
              )}
            </div>
          </div>
        ) : (
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>No upcoming train</p>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderLeft: '4px solid #E5E1D8',
      borderRadius: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      padding: 28,
    }}>
      {[60, 40, 80, 30].map((w, i) => (
        <div key={i} style={{ height: i === 2 ? 4 : 14, width: `${w}%`, backgroundColor: '#F0EEE9', borderRadius: 6, marginBottom: i === 2 ? 0 : 16 }} />
      ))}
    </div>
  )
}
