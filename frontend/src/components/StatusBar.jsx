import { useState, useEffect } from 'react'
import { StationMark } from '../lib/icons'

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
      backgroundColor: 'rgba(253,251,246,0.85)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid #E7DECE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: 60,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ color: '#B8352C', display: 'flex' }}><StationMark size={22} /></span>
        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 18, fontWeight: 700, letterSpacing: '0.01em' }}>
          Crowd-Balancing Agent
        </span>
        <span style={{
          backgroundColor: '#F4EEE3',
          color: '#6E6356',
          fontSize: 10,
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 9999,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginLeft: 2,
        }}>
          Station AI
        </span>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {overrideMode ? (
          <Pill bg="#FBF1DA" fg="#B45309" border="#E8C97A">⚠ Override Mode</Pill>
        ) : (
          <Pill bg="#EDF3E4" fg="#5C8A3A" border="#BCD49E">● Autonomous</Pill>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: connected ? '#5C8A3A' : '#D6C9B4',
            display: 'inline-block',
          }} />
          <span style={{ color: '#6E6356', fontSize: 12 }}>{connected ? 'Live' : 'Connecting…'}</span>
        </div>

        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 15, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          {hh}:{mm}:{ss}
        </span>
      </div>
    </header>
  )
}

function Pill({ bg, fg, border, children }) {
  return (
    <span style={{
      backgroundColor: bg, color: fg, border: `1px solid ${border}`,
      fontSize: 11, fontWeight: 600, padding: '4px 12px',
      borderRadius: 9999, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}
