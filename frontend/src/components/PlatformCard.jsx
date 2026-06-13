import { ZONE_COLOR, TREND_ICON, classifyZone } from '../lib/zone'

export default function PlatformCard({ state }) {
  if (!state) return <SkeletonCard />

  const {
    platform_id,
    density_pct = 0,
    arrival_count = 0,
    zone,
    trend,
    next_train,
  } = state

  const zoneKey  = zone ?? classifyZone(density_pct)
  const zc       = ZONE_COLOR[zoneKey] ?? ZONE_COLOR.GREEN
  const trendIcon = TREND_ICON[trend] ?? '→'
  const isHeld   = next_train?.held === true

  const barPct   = Math.min(density_pct, 100)
  const barColor = zc.bg

  return (
    <div
      style={{
        backgroundColor: '#243356',
        border: `1px solid #2A3A5C`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Zone color accent bar at top */}
      <div style={{ height: 4, backgroundColor: zc.bg }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{ color: '#8A9BB5', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              Platform
            </p>
            <h2 style={{ color: '#F7F4ED', fontSize: 28, fontWeight: 700, lineHeight: 1, margin: 0 }}>
              {platform_id}
            </h2>
          </div>

          <div
            style={{
              backgroundColor: zc.bg + '22',
              color: zc.bg,
              border: `1px solid ${zc.bg}55`,
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {zc.shape} {zc.label}
          </div>
        </div>

        {/* Density bar */}
        <div className="mb-3">
          <div className="flex items-end justify-between mb-1.5">
            <span style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Density
            </span>
            <div className="flex items-baseline gap-1.5">
              <span style={{ color: zc.bg, fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
                {Math.round(density_pct)}
              </span>
              <span style={{ color: '#8A9BB5', fontSize: 14 }}>%</span>
              <span style={{ color: zc.bg, fontSize: 18, marginLeft: 4 }} title={trend}>
                {trendIcon}
              </span>
            </div>
          </div>

          <div style={{ height: 8, backgroundColor: '#1B2A4A', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${barPct}%`,
                backgroundColor: barColor,
                borderRadius: 9999,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>

          {/* Threshold ticks */}
          <div style={{ position: 'relative', height: 4, marginTop: 2 }}>
            <div style={{ position: 'absolute', left: '60%', top: 0, width: 1, height: 4, backgroundColor: '#E8A33D66' }} />
            <div style={{ position: 'absolute', left: '85%', top: 0, width: 1, height: 4, backgroundColor: '#D7483B66' }} />
          </div>
        </div>

        {/* People count */}
        <div className="flex items-center gap-1.5 mb-4">
          <span style={{ color: '#8A9BB5', fontSize: 12 }}>👥</span>
          <span style={{ color: '#F7F4ED', fontSize: 14, fontWeight: 500 }}>
            {arrival_count} <span style={{ color: '#8A9BB5' }}>people</span>
          </span>
        </div>

        {/* Train info */}
        <div
          style={{
            backgroundColor: '#1B2A4A',
            borderRadius: 10,
            padding: '10px 14px',
            borderLeft: `3px solid ${isHeld ? '#B8352C' : '#2E6F95'}`,
          }}
        >
          {next_train ? (
            <div className="flex items-center justify-between">
              <div>
                <p style={{ color: '#8A9BB5', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Next Train
                </p>
                <p style={{ color: '#F7F4ED', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>
                  {next_train.train_id}
                </p>
              </div>
              <div className="text-right">
                <p style={{ color: '#8A9BB5', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  ETA
                </p>
                <p style={{ color: '#F7F4ED', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>
                  {next_train.eta_min} min
                </p>
              </div>
              {isHeld && (
                <span
                  className="breathe"
                  style={{
                    backgroundColor: '#B8352C',
                    color: '#F7F4ED',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 9999,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  HELD
                </span>
              )}
            </div>
          ) : (
            <p style={{ color: '#8A9BB5', fontSize: 13, margin: 0 }}>No upcoming train</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div
      style={{ backgroundColor: '#243356', border: '1px solid #2A3A5C', borderRadius: 14, overflow: 'hidden' }}
    >
      <div style={{ height: 4, backgroundColor: '#2A3A5C' }} />
      <div className="p-5 space-y-4">
        {[80, 48, 64, 36].map((w, i) => (
          <div key={i} style={{ height: 14, width: `${w}%`, backgroundColor: '#2A3A5C', borderRadius: 6, opacity: 0.6 }} />
        ))}
      </div>
    </div>
  )
}
