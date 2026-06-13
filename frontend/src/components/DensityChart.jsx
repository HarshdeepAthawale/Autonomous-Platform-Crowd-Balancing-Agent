import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer,
} from 'recharts'

const PLATFORM_COLORS = ['#2E6F95', '#D7483B', '#E8A33D', '#5C8A3A']

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
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
    Object.keys(graphSeries).forEach(pid => {
      row[pid] = byPlatform[pid][ts] ?? null
    })
    return row
  })
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ backgroundColor: '#0f1e36', border: '1px solid #2A3A5C', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#8A9BB5', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
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
    <div style={{ backgroundColor: '#243356', border: '1px solid #2A3A5C', borderRadius: 14, padding: '20px 24px' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Density Over Time
          </p>
          <p style={{ color: '#F7F4ED', fontSize: 14, fontWeight: 600, margin: '2px 0 0' }}>
            Platform Comparison
          </p>
        </div>
        <div className="flex gap-4">
          <span style={{ color: '#8A9BB5', fontSize: 11 }}>
            <span style={{ color: '#E8A33D' }}>—</span> 60% Yellow threshold
          </span>
          <span style={{ color: '#8A9BB5', fontSize: 11 }}>
            <span style={{ color: '#D7483B' }}>—</span> 85% Red threshold
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#8A9BB5', fontSize: 13 }}>Waiting for data…</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#8A9BB5', fontSize: 10 }}
              axisLine={{ stroke: '#2A3A5C' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#8A9BB5', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E8A33D" strokeDasharray="4 3" strokeOpacity={0.5} />
            <ReferenceLine y={85} stroke="#D7483B" strokeDasharray="4 3" strokeOpacity={0.5} />
            {platformIds.map((pid, i) => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                name={`Platform ${pid}`}
                stroke={PLATFORM_COLORS[i % PLATFORM_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                animationDuration={300}
              />
            ))}
            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: 12, color: '#8A9BB5' }}
              formatter={(v) => <span style={{ color: '#8A9BB5' }}>Platform {v}</span>}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
