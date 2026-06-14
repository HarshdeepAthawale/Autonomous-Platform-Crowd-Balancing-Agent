import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { StationMark, SpeakerOnIcon, SpeakerOffIcon } from '../lib/icons'

const NAV = [
  { to: '/',            label: 'Dashboard', end: true },
  { to: '/display/gate', label: 'Gate' },
  { to: '/display/A',    label: 'Board A' },
  { to: '/display/B',    label: 'Board B' },
]

export default function StatusBar({ connected, overrideMode, voiceOn, onToggleVoice }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')

  return (
    // Floating "island" navbar — sticky, centered, glassy pill
    <div style={{ position: 'sticky', top: 14, zIndex: 50, display: 'flex', justifyContent: 'center', padding: '14px 32px 0', pointerEvents: 'none' }}>
      <header style={{
        pointerEvents: 'auto',
        width: '100%',
        maxWidth: 1216,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        backgroundColor: 'rgba(253,251,246,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(231,222,206,0.9)',
        borderRadius: 18,
        boxShadow: '0 6px 24px rgba(80,55,20,0.10), 0 1px 0 rgba(255,255,255,0.6) inset',
        padding: '9px 12px 9px 18px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ color: '#B8352C', display: 'flex' }}><StationMark size={22} /></span>
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 16, fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
            Crowd Balancing Agent
          </span>
        </div>

        {/* Center nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(244,238,227,0.7)', borderRadius: 9999, padding: 3 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '0.01em',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 9999,
              color: isActive ? '#211C15' : '#6E6356',
              backgroundColor: isActive ? '#FDFBF6' : 'transparent',
              boxShadow: isActive ? '0 1px 3px rgba(80,55,20,0.10)' : 'none',
              transition: 'all 0.15s',
            })}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              title={voiceOn ? 'Voice announcements on' : 'Voice announcements off'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: voiceOn ? '#EDF3E4' : 'transparent',
                border: `1px solid ${voiceOn ? '#BCD49E' : '#E7DECE'}`,
                color: voiceOn ? '#5C8A3A' : '#6E6356',
                padding: '5px 11px', borderRadius: 9999, cursor: 'pointer',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                transition: 'all 0.15s',
              }}
            >
              {voiceOn ? <SpeakerOnIcon size={14} /> : <SpeakerOffIcon size={14} />}
              <span>{voiceOn ? 'Voice On' : 'Voice'}</span>
            </button>
          )}

          {overrideMode
            ? <Pill bg="#FBF1DA" fg="#B45309" border="#E8C97A">⚠ Override</Pill>
            : <Pill bg="#EDF3E4" fg="#5C8A3A" border="#BCD49E">● Autonomous</Pill>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: connected ? '#5C8A3A' : '#D6C9B4', display: 'inline-block' }} />
            <span style={{ color: '#6E6356', fontSize: 12 }}>{connected ? 'Live' : '…'}</span>
          </div>

          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 14, fontWeight: 500, fontVariantNumeric: 'tabular-nums', paddingRight: 4 }}>
            {hh}:{mm}:{ss}
          </span>
        </div>
      </header>
    </div>
  )
}

function Pill({ bg, fg, border, children }) {
  return (
    <span style={{
      backgroundColor: bg, color: fg, border: `1px solid ${border}`,
      fontSize: 11, fontWeight: 600, padding: '5px 12px',
      borderRadius: 9999, letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}
