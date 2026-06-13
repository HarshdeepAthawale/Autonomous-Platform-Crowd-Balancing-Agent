import { useState } from 'react'
import { TicketIcon } from '../lib/icons'

const PLATFORMS = ['A', 'B']
const TRAINS    = { A: '12045', B: '12046' }
const BTN_STYLE = {
  A: { bg: '#EAF1F6', border: '#BcD4E2', accent: '#2E6F95', activeBg: '#D8E8F1' },
  B: { bg: '#EDF3E4', border: '#C3D9A8', accent: '#5C8A3A', activeBg: '#DDEBCB' },
}

export default function ScanPage({ scanTicket }) {
  const [counts, setCounts]     = useState({})
  const [feedback, setFeedback] = useState(null)

  async function handleScan(pid) {
    await scanTicket(pid, TRAINS[pid])
    setCounts(prev => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
    setFeedback(pid)
    setTimeout(() => setFeedback(null), 500)
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
        <span style={{ color: '#6E6356', display: 'flex' }}><TicketIcon size={16} /></span>
        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 15, fontWeight: 700 }}>Ticket Scan</span>
        <span style={{ color: '#A99E8C', fontSize: 12, marginLeft: 2 }}>/ Demo</span>
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
              <p style={{ color: '#6E6356', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Scan →
              </p>
              <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 19, fontWeight: 700, margin: '0 0 6px' }}>
                Platform {pid}
              </p>
              <p style={{ color: s.accent, fontSize: 12, fontWeight: 600, margin: 0 }}>
                {counts[pid] ?? 0} scans
              </p>
            </button>
          )
        })}
      </div>

      <p style={{ color: '#C2B7A4', fontSize: 11, textAlign: 'center', marginTop: 14, marginBottom: 0 }}>
        platform_id + train_id only · no PII
      </p>
    </div>
  )
}
