import { useState, useEffect } from 'react'

export default function StatusBar({ connected, overrideMode }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E5E1D8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 56,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>|</span>
        <span style={{ color: '#1A1A1A', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Crowd-Balancing Agent
        </span>
        <span style={{
          backgroundColor: '#F0EEE9',
          color: '#6B7280',
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 9999,
          letterSpacing: '0.04em',
          marginLeft: 4,
        }}>
          Station AI
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {overrideMode ? (
          <span style={{
            backgroundColor: '#FFFBEB',
            color: '#B45309',
            border: '1px solid #FDE68A',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 9999,
            letterSpacing: '0.04em',
          }}>
            ! Override Mode
          </span>
        ) : (
          <span style={{
            backgroundColor: '#F0FFF4',
            color: '#5C8A3A',
            border: '1px solid #BBF7D0',
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 9999,
            letterSpacing: '0.04em',
          }}>
            ● Autonomous
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: connected ? '#5C8A3A' : '#D1D5DB',
            display: 'inline-block',
          }} />
          <span style={{ color: '#6B7280', fontSize: 12 }}>
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>

        <span style={{ color: '#1A1A1A', fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          {hh}:{mm}:{ss}
        </span>
      </div>
    </header>
  )
}
