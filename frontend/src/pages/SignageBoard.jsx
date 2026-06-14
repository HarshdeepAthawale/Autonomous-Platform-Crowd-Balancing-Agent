import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { useDisplay } from '../hooks/useDisplay'
import { classifyZone } from '../lib/zone'
import { TrainIcon } from '../lib/icons'
import { useT } from '../lib/i18n/context'

function useClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return t
}

// Pull this platform's live state from the dashboard channel.
// Resets and requests a fresh snapshot whenever platformId changes.
function usePlatformState(platformId) {
  const [state, setState] = useState(null)
  const prevPid = useRef(null)
  const url = import.meta.env.VITE_WS_URL ||
    `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/dashboard`

  const handler = useCallback((msg) => {
    if (msg.type === 'state_update' && Array.isArray(msg.platforms)) {
      const p = msg.platforms.find(p => p.platform_id === platformId)
      if (p) setState(p)
    }
  }, [platformId])

  const { send } = useWebSocket(url, handler)

  // When switching platform tabs, clear stale state and ping backend for fresh snapshot.
  useEffect(() => {
    if (prevPid.current !== null && prevPid.current !== platformId) {
      setState(null)
    }
    prevPid.current = platformId
    send('ping')   // backend replies with state_payload so board populates immediately
  }, [platformId, send])

  return state
}

const ZONE_THEME = {
  GREEN:  { bg: '#5C8A3A', soft: '#6FA049', word: 'AVAILABLE' },
  YELLOW: { bg: '#E8A33D', soft: '#EEB45E', word: 'FILLING UP' },
  RED:    { bg: '#D7483B', soft: '#E0604F', word: 'CROWDED' },
}

export default function SignageBoard() {
  const t = useT()
  const { platformId } = useParams()
  const pid = (platformId || '').toUpperCase()
  const state = usePlatformState(pid)
  const { signage, redirect } = useDisplay(pid)
  const clock = useClock()

  const density = state?.density_pct ?? 0
  const zoneKey = state?.zone ?? classifyZone(density)
  const theme   = ZONE_THEME[zoneKey] ?? ZONE_THEME.GREEN
  const count   = state?.count ?? signage?.count ?? 0
  const held    = state?.next_train?.held === true
  const holdMin = state?.next_train?.hold_min ?? 0
  const eta     = state?.next_train?.eta_min

  // English advisory: prefer redirect text; else English half of signage banner
  const bannerEn = signage?.banner ? signage.banner.split(' / ').pop() : null
  const advisory = redirect?.text || (held ? bannerEn : null)

  const hh = clock.getHours().toString().padStart(2, '0')
  const mm = clock.getMinutes().toString().padStart(2, '0')

  return (
    <div style={{
      minHeight: '100vh',
      color: '#211C15',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid #E7DECE' }}>
        <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6E6356' }}>{t('signage.title')}</span>
        <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{hh}:{mm}</span>
      </div>

      {/* Center — frosted card over the Japanese background */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="slide-in" style={{
          textAlign: 'center',
          background: 'rgba(253,251,246,0.80)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid ${theme.bg}33`,
          borderTop: `5px solid ${theme.bg}`,
          borderRadius: 28,
          boxShadow: '0 10px 44px rgba(80,55,20,0.16)',
          padding: '48px 72px',
          maxWidth: 860,
          transition: 'border-color 0.6s ease',
        }}>
          <p style={{ fontSize: 16, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6E6356', margin: '0 0 8px' }}>{t('signage.platform')}</p>
          <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 140, fontWeight: 900, lineHeight: 0.9, margin: '0 0 16px' }}>{pid}</p>

          <p style={{ fontFamily: 'var(--font-display)', color: theme.bg, fontSize: 64, fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 28px' }}>
            {t('zone.' + zoneKey.toLowerCase())}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
            <div>
              <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6E6356', margin: '0 0 4px' }}>{t('signage.crowd')}</p>
              <p style={{ fontFamily: 'var(--font-display)', color: theme.bg, fontSize: 44, fontWeight: 700, margin: 0 }}>{Math.round(density)}<span style={{ fontSize: 24, opacity: 0.8 }}>%</span></p>
            </div>
            <div style={{ width: 1, height: 56, background: 'rgba(0,0,0,0.12)' }} />
            <div>
              <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6E6356', margin: '0 0 4px' }}>{t('signage.people')}</p>
              <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 44, fontWeight: 700, margin: 0 }}>{count}</p>
            </div>
            {eta != null && (
              <>
                <div style={{ width: 1, height: 56, background: 'rgba(0,0,0,0.12)' }} />
                <div>
                  <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6E6356', margin: '0 0 4px' }}>{t('signage.train')}</p>
                  <p style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 44, fontWeight: 700, margin: 0 }}>{Math.round(eta)}<span style={{ fontSize: 24, opacity: 0.7 }}>{t('signage.min')}</span></p>
                </div>
              </>
            )}
          </div>

          {/* HELD banner */}
          {held && (
            <div className="breathe" style={{ marginTop: 32, display: 'inline-flex', alignItems: 'center', gap: 10, background: `${theme.bg}1A`, color: theme.bg, border: `1px solid ${theme.bg}33`, padding: '12px 26px', borderRadius: 9999 }}>
              <TrainIcon size={22} />
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.04em' }}>
                {t('signage.held', { min: holdMin || 0 })}
              </span>
            </div>
          )}

          {/* Advisory / redirect suggestion */}
          {advisory && !held && (
            <p style={{ marginTop: 30, maxWidth: 720, fontSize: 22, lineHeight: 1.5, color: '#4A4035' }}>
              {advisory}
            </p>
          )}
          {advisory && held && advisory !== bannerEn && (
            <p style={{ marginTop: 22, maxWidth: 720, fontSize: 20, lineHeight: 1.5, color: '#4A4035' }}>
              {advisory}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderTop: '1px solid #E7DECE', fontSize: 12, color: '#A99E8C' }}>
        <span>{t('signage.footer')}</span>
        <Link to="/" style={{ color: '#6E6356', textDecoration: 'none' }}>← {t('nav.dashboard')}</Link>
      </div>
    </div>
  )
}
