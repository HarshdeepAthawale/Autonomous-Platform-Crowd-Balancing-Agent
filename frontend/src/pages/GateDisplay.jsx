import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { classifyZone, ZONE_COLOR } from '../lib/zone'
import { StationMark, TicketIcon } from '../lib/icons'
import { useT } from '../lib/i18n/context'

function useClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return t
}

export default function GateDisplay() {
  const t = useT()
  const [platforms, setPlatforms] = useState({})
  const [, setRedirect]   = useState(null)
  const clock = useClock()

  const url = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws/dashboard`
  useWebSocket(url, (msg) => {
    if (msg.type === 'state_update' && Array.isArray(msg.platforms)) {
      setPlatforms(prev => {
        const next = { ...prev }
        msg.platforms.forEach(p => { next[p.platform_id] = p })
        return next
      })
    } else if (msg.type === 'agent_action' && msg.decision?.plan?.redirect) {
      const r = msg.decision.plan.redirect
      const tgt = msg.decision.plan.redirect.to
      setRedirect({ from: r.from, to: r.to, eta: null, key: Date.now(), target: tgt })
    }
  })

  const states  = Object.values(platforms)
  const busy    = states.find(s => (s.zone ?? classifyZone(s.density_pct)) === 'RED')
  // Pick a calm alternative platform (GREEN/lowest density) for the suggestion
  const alt = states
    .filter(s => s.platform_id !== busy?.platform_id && (s.zone ?? classifyZone(s.density_pct)) !== 'RED')
    .sort((a, b) => a.density_pct - b.density_pct)[0]

  const showSuggestion = busy && alt
  const altEta = alt?.next_train?.eta_min

  const hh = clock.getHours().toString().padStart(2, '0')
  const mm = clock.getMinutes().toString().padStart(2, '0')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 40px', borderBottom: '1px solid #E7DECE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ color: '#B8352C', display: 'flex' }}><StationMark size={24} /></span>
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 18, fontWeight: 700 }}>{t('gate.title')}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>{hh}:{mm}</span>
      </div>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        {/* Welcome / scan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6E6356', marginBottom: 18 }}>
          <TicketIcon size={28} />
          <span style={{ fontSize: 18, letterSpacing: '0.04em' }}>{t('gate.scanPrompt')}</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 56, fontWeight: 900, margin: '0 0 10px', letterSpacing: '0.01em' }}>
          {t('gate.welcome')}
        </h1>

        {showSuggestion ? (
          <div className="slide-in" style={{
            marginTop: 30, maxWidth: 760,
            background: '#FDFBF6', border: '1px solid #E7DECE', borderRadius: 20,
            boxShadow: '0 6px 28px rgba(80,55,20,0.08)', padding: '34px 40px',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: ZONE_COLOR.RED.lightBg, color: ZONE_COLOR.RED.bg, border: `1px solid ${ZONE_COLOR.RED.bg}30`, padding: '5px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 18 }}>
              ■ {t('gate.busy', { id: busy.platform_id })}
            </div>
            <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 30, fontWeight: 700, lineHeight: 1.4, margin: '0 0 16px' }}>
              <span style={{ color: ZONE_COLOR.GREEN.bg }}>{t('gate.suggestion', { id: alt.platform_id })}</span>
              {altEta != null ? t('gate.suggestionEta', { min: Math.round(altEta) }) : t('gate.suggestionAvailable')}
            </p>
            <span style={{ display: 'inline-block', color: '#6E6356', fontSize: 14, border: '1px dashed #C9BCa6', padding: '6px 16px', borderRadius: 9999 }}>
                {t('gate.disclaimer')}
            </span>
          </div>
        ) : (
          <div className="slide-in" style={{ marginTop: 26, display: 'inline-flex', alignItems: 'center', gap: 10, background: ZONE_COLOR.GREEN.lightBg, color: ZONE_COLOR.GREEN.bg, border: `1px solid ${ZONE_COLOR.GREEN.bg}30`, padding: '12px 24px', borderRadius: 9999 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>● {t('gate.allBalanced')}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderTop: '1px solid #E7DECE', fontSize: 12, color: '#A99E8C' }}>
        <span>{t('gate.privacy')}</span>
        <Link to="/" style={{ color: '#6E6356', textDecoration: 'none' }}>← {t('nav.dashboard')}</Link>
      </div>
    </div>
  )
}
