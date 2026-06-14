import { useState, useRef, useEffect } from 'react'
import { useI18n, LANGS } from '../lib/i18n/context'

function GlobeIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7l3 3 5-5" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
      <path d="M1 3l3 3 3-3" />
    </svg>
  )
}

export default function LanguageSwitcher() {
  const { lang, setLang, translating } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = LANGS.find(l => l.code === lang) || LANGS[0]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={current.label}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'transparent',
          border: '1px solid #E7DECE',
          color: '#6E6356',
          padding: '5px 11px', borderRadius: 9999, cursor: 'pointer',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          transition: 'all 0.15s',
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = '#C9BCA6'; e.currentTarget.style.background = 'rgba(244,238,227,0.5)' }}
        onMouseOut={e => { e.currentTarget.style.borderColor = '#E7DECE'; e.currentTarget.style.background = 'transparent' }}
      >
        <GlobeIcon size={14} />
        <span>{translating ? '…' : current.short}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#FDFBF6', border: '1px solid #E7DECE',
          borderRadius: 12, boxShadow: '0 8px 28px rgba(80,55,20,0.12)',
          minWidth: 140, overflow: 'hidden', zIndex: 100,
        }}>
          {LANGS.map(l => {
            const active = l.code === lang
            return (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', border: 'none', background: active ? 'rgba(244,238,227,0.5)' : 'transparent',
                  color: active ? '#211C15' : '#6E6356',
                  padding: '10px 14px', cursor: 'pointer',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  textAlign: 'left', transition: 'background 0.1s',
                  fontFamily: active ? 'var(--font-display)' : 'var(--font-sans)',
                }}
                onMouseOver={e => { if (!active) e.currentTarget.style.background = '#F4EEE3' }}
                onMouseOut={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <GlobeIcon size={14} />
                <span>{l.label}</span>
                {active && <span style={{ marginLeft: 'auto', color: '#5C8A3A', display: 'flex' }}><CheckIcon /></span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
