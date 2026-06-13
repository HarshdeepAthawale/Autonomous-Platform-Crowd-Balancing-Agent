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
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 15 }}></span>
        <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 600 }}>Agent Controls</span>
      </div>

      <button
        onClick={handleTick}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: loading ? '#F0EEE9' : '#1A1A1A',
          color: loading ? '#9CA3AF' : '#FFFFFF',
          border: 'none',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <span>{loading ? '…' : '▶'}</span>
        <span>{loading ? 'Running tick…' : 'Trigger Agent Tick'}</span>
      </button>

      {last && (
        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#F9F8F5', border: '1px solid #E5E1D8', borderRadius: 8 }}>
          <p style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Last result</p>
          <p style={{ color: '#1A1A1A', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {last.reasoning || last.action || JSON.stringify(last).slice(0, 120)}
          </p>
        </div>
      )}

      <p style={{ color: '#D1D5DB', fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        Auto-runs every 20 s in background
      </p>
    </div>
  )
}
