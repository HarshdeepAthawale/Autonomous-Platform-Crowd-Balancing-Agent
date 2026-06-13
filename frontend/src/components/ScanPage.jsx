import { useState } from 'react'

const PLATFORMS = ['A', 'B']
const TRAINS    = { A: '12045', B: '12046' }

export default function ScanPage({ scanTicket, platforms }) {
  const [counts, setCounts] = useState({})
  const [feedback, setFeedback] = useState(null)

  async function handleScan(pid) {
    await scanTicket(pid, TRAINS[pid])
    setCounts(prev => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
    setFeedback(pid)
    setTimeout(() => setFeedback(null), 600)
  }

  return (
    <div style={{ backgroundColor: '#243356', border: '1px solid #2A3A5C', borderRadius: 14, padding: '24px' }}>
      <div className="flex items-center gap-2 mb-5">
        <span style={{ color: '#2E6F95' }}>🎫</span>
        <span style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Ticket Scan Simulator
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PLATFORMS.map(pid => {
          const density = platforms[pid]?.density_pct ?? 0
          const active  = feedback === pid
          return (
            <button
              key={pid}
              onClick={() => handleScan(pid)}
              style={{
                backgroundColor: active ? '#2E6F9533' : '#1B2A4A',
                border: `1px solid ${active ? '#2E6F95' : '#2A3A5C'}`,
                borderRadius: 12,
                padding: '18px',
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                textAlign: 'left',
              }}
            >
              <p style={{ color: '#8A9BB5', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Scan Ticket →
              </p>
              <p style={{ color: '#F7F4ED', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
                Platform {pid}
              </p>
              <p style={{ color: '#8A9BB5', fontSize: 12, margin: '0 0 4px' }}>
                Train {TRAINS[pid]}
              </p>
              <p style={{ color: '#2E6F95', fontSize: 12, margin: 0 }}>
                {counts[pid] ?? 0} scans this session
              </p>
            </button>
          )
        })}
      </div>

      <p style={{ color: '#2A3A5C', fontSize: 11, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
        Each click = +1 arrival event · platform_id + train_id only (no PII)
      </p>
    </div>
  )
}
