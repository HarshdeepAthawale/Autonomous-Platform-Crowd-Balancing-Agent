import { useState } from 'react'

const PLATFORMS = ['A', 'B']
const TRAINS    = { A: '12045', B: '12046' }
const BTN_STYLE = {
  A: { bg: '#EFF6FF', border: '#BFDBFE', accent: '#2E6F95', activeBg: '#DBEAFE' },
  B: { bg: '#F0FFF4', border: '#BBF7D0', accent: '#5C8A3A', activeBg: '#DCFCE7' },
}

export default function ScanPage({ scanTicket, platforms }) {
  const [counts, setCounts]   = useState({})
  const [feedback, setFeedback] = useState(null)

  async function handleScan(pid) {
    await scanTicket(pid, TRAINS[pid])
    setCounts(prev => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
    setFeedback(pid)
    setTimeout(() => setFeedback(null), 500)
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
        <span style={{ fontSize: 15 }}>🎫</span>
        <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 600 }}>Ticket Scan</span>
        <span style={{ color: '#6B7280', fontSize: 12, marginLeft: 2 }}>/ Demo</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {PLATFORMS.map(pid => {
          const s = BTN_STYLE[pid]
          const active = feedback === pid
          return (
            <button
              key={pid}
              onClick={() => handleScan(pid)}
              style={{
                backgroundColor: active ? s.activeBg : s.bg,
                border: `1px solid ${active ? s.accent : s.border}`,
                borderRadius: 12,
                padding: '16px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                textAlign: 'left',
              }}
            >
              <p style={{ color: '#6B7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                Scan →
              </p>
              <p style={{ color: '#1A1A1A', fontSize: 18, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                Platform {pid}
              </p>
              <p style={{ color: s.accent, fontSize: 12, fontWeight: 500, margin: 0 }}>
                {counts[pid] ?? 0} scans
              </p>
            </button>
          )
        })}
      </div>

      <p style={{ color: '#D1D5DB', fontSize: 11, textAlign: 'center', marginTop: 14, marginBottom: 0 }}>
        platform_id + train_id only · no PII
      </p>
    </div>
  )
}
