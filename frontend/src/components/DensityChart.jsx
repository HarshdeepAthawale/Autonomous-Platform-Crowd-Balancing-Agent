import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1D8', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 13, margin: '2px 0', fontWeight: 600 }}>
          Platform {p.dataKey}: {p.value != null ? `${Math.round(p.value)}%` : '—'}
        </p>
      ))}
    </div>
  )
}

export default function DensityChart({ graphSeries }) {
  const platformIds = Object.keys(graphSeries)
  const data = buildMergedSeries(graphSeries)

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderRadius: 16,
      padding: '24px 28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
            Density Over Time
          </p>
          <p style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 600, margin: 0 }}>Platform Comparison</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {platformIds.map((pid, i) => (
            <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 2, backgroundColor: PLATFORM_COLORS[i % PLATFORM_COLORS.length], display: 'inline-block', borderRadius: 2 }} />
              <span style={{ color: '#6B7280', fontSize: 12 }}>Platform {pid}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, backgroundColor: '#E5E1D8' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#E8A33D', fontSize: 13 }}>—</span>
            <span style={{ color: '#6B7280', fontSize: 11 }}>60%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#D7483B', fontSize: 13 }}>—</span>
            <span style={{ color: '#6B7280', fontSize: 11 }}>85%</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Waiting for data…</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#F0EEE9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={{ stroke: '#E5E1D8' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E8A33D" strokeDasharray="4 3" strokeOpacity={0.6} />
            <ReferenceLine y={85} stroke="#D7483B" strokeDasharray="4 3" strokeOpacity={0.6} />
            {platformIds.map((pid, i) => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                stroke={PLATFORM_COLORS[i % PLATFORM_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
