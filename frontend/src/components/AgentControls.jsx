import { useState } from 'react'

export default function AgentControls({ triggerTick }) {
  const [loading, setLoading] = useState(false)
  const [last, setLast]       = useState(null)

  async function handleTick() {
    setLoading(true)
    try {
      const res = await triggerTick()
      setLast(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#243356', border: '1px solid #2A3A5C', borderRadius: 14, padding: '20px 24px' }}>
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: '#2E6F95' }}>⚙️</span>
        <span style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Agent Controls
        </span>
      </div>

      <button
        onClick={handleTick}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: loading ? '#2A3A5C' : '#2E6F95',
          color: '#F7F4ED',
          border: 'none',
          borderRadius: 10,
          padding: '12px',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.04em',
          transition: 'background-color 0.15s',
        }}
      >
        {loading ? 'Running tick…' : '▶ Trigger Agent Tick'}
      </button>

      {last && (
        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#1B2A4A', borderRadius: 8 }}>
          <p style={{ color: '#8A9BB5', fontSize: 10, textTransform: 'uppercase', margin: '0 0 4px' }}>
            Last result
          </p>
          <p style={{ color: '#F7F4ED', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {last.reasoning || last.action || JSON.stringify(last).slice(0, 120)}
          </p>
        </div>
      )}

      <p style={{ color: '#2A3A5C', fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        Agent also runs automatically every 20s
      </p>
    </div>
  )
}
