import { useState } from 'react'
import { GearIcon, PlayIcon } from '../lib/icons'

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
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: '#6E6356', display: 'flex' }}><GearIcon size={16} /></span>
        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 15, fontWeight: 700 }}>Agent Controls</span>
      </div>

      <button
        onClick={handleTick}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: loading ? '#EFE7D9' : '#211C15',
          color: loading ? '#A99E8C' : '#FDFBF6',
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
          gap: 7,
        }}
      >
        {!loading && <PlayIcon size={12} />}
        <span>{loading ? 'Running tick…' : 'Trigger Agent Tick'}</span>
      </button>

      {last && (
        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#F4EEE3', border: '1px solid #E7DECE', borderRadius: 8 }}>
          <p style={{ color: '#6E6356', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>Last result</p>
          <p style={{ color: '#211C15', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {last.reasoning || last.action || JSON.stringify(last).slice(0, 120)}
          </p>
        </div>
      )}

      <p style={{ color: '#C2B7A4', fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        Auto-runs every 20 s in background
      </p>
    </div>
  )
}
