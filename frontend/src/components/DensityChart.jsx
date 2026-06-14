import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'

const PLATFORM_COLORS = ['#2E6F95', '#D7483B', '#E8A33D', '#5C8A3A']

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

function buildMergedSeries(graphSeries) {
  const allTs = new Set()
  Object.values(graphSeries).forEach(pts => pts.forEach(p => allTs.add(p.ts)))
  const sorted = [...allTs].sort((a, b) => a - b)
  const byPlatform = {}
  Object.entries(graphSeries).forEach(([pid, pts]) => {
    byPlatform[pid] = Object.fromEntries(pts.map(p => [p.ts, p.density_pct]))
  })
  return sorted.map(ts => {
    const row = { ts, label: formatTime(ts) }
    Object.keys(graphSeries).forEach(pid => { row[pid] = byPlatform[pid][ts] ?? null })
    return row
  })
}

// shadcn-style tooltip: card with colored dot indicators
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#FDFBF6', border: '1px solid #E7DECE', borderRadius: 10, padding: '10px 12px', boxShadow: '0 4px 16px rgba(80,55,20,0.10)', minWidth: 140 }}>
      <p style={{ color: '#6E6356', fontSize: 11, margin: '0 0 8px', fontWeight: 500 }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, margin: '3px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: p.color, display: 'inline-block' }} />
            <span style={{ color: '#6E6356', fontSize: 12 }}>Platform {p.dataKey}</span>
          </span>
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 13, fontWeight: 600 }}>
            {p.value != null ? `${Math.round(p.value)}%` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DensityChart({ graphSeries }) {
  const platformIds = Object.keys(graphSeries)
  const data = buildMergedSeries(graphSeries)

  // small trend hint for the footer (last vs first of the busiest series)
  const trendNote = (() => {
    if (data.length < 2 || platformIds.length === 0) return null
    const pid = platformIds[0]
    const vals = data.map(d => d[pid]).filter(v => v != null)
    if (vals.length < 2) return null
    const delta = Math.round(vals[vals.length - 1] - vals[0])
    return { pid, delta }
  })()

  return (
    <div style={{
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 16,
      padding: '24px 28px 18px',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <p style={{ color: '#A99E8C', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', margin: '0 0 4px' }}>
            Density Over Time
          </p>
          <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 17, fontWeight: 700, margin: 0 }}>Platform Comparison</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {platformIds.map((pid, i) => (
            <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: PLATFORM_COLORS[i % PLATFORM_COLORS.length], display: 'inline-block' }} />
              <span style={{ color: '#6E6356', fontSize: 12 }}>Platform {pid}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, backgroundColor: '#E7DECE' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E8A33D', fontSize: 13 }}>—</span>
            <span style={{ color: '#6E6356', fontSize: 11 }}>60%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#D7483B', fontSize: 13 }}>—</span>
            <span style={{ color: '#6E6356', fontSize: 11 }}>85%</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#A99E8C', fontSize: 13 }}>Waiting for data…</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
            <defs>
              {platformIds.map((pid, i) => {
                const c = PLATFORM_COLORS[i % PLATFORM_COLORS.length]
                return (
                  <linearGradient key={pid} id={`fill-${pid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={c} stopOpacity={0.05} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFE7D9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#A99E8C', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={32}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#A99E8C', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickMargin={6}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C9BCA6', strokeWidth: 1, strokeDasharray: '3 3' }} />
            <ReferenceLine y={60} stroke="#E8A33D" strokeDasharray="4 3" strokeOpacity={0.6} />
            <ReferenceLine y={85} stroke="#D7483B" strokeDasharray="4 3" strokeOpacity={0.6} />
            {platformIds.map((pid, i) => {
              const c = PLATFORM_COLORS[i % PLATFORM_COLORS.length]
              return (
                <Area
                  key={pid}
                  type="natural"
                  dataKey={pid}
                  stroke={c}
                  strokeWidth={2}
                  fill={`url(#fill-${pid})`}
                  fillOpacity={1}
                  connectNulls
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  animationDuration={300}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Footer trend line (shadcn-style) */}
      {trendNote && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EFE7D9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#211C15', fontSize: 13, fontWeight: 600 }}>
            Platform {trendNote.pid} {trendNote.delta >= 0 ? 'up' : 'down'} {Math.abs(trendNote.delta)}% over window
          </span>
          <span style={{ color: trendNote.delta >= 0 ? '#D7483B' : '#5C8A3A', fontSize: 13 }}>
            {trendNote.delta >= 0 ? '↗' : '↘'}
          </span>
          <span style={{ color: '#A99E8C', fontSize: 12, marginLeft: 'auto' }}>Live · updates each reading</span>
        </div>
      )}
    </div>
  )
}
