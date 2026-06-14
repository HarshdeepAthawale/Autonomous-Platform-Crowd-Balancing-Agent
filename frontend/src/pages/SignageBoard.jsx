import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useWebSocket } from '../hooks/useWebSocket'
import { useDisplay } from '../hooks/useDisplay'
import { ZONE_COLOR, classifyZone } from '../lib/zone'
import { TrainIcon } from '../lib/icons'

function useClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return t
}

// Pull this platform's live state from the dashboard channel so the board
// stays correct even when the agent isn't acting.
function usePlatformState(platformId) {
  const [state, setState] = useState(null)
  const url = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws/dashboard`
  useWebSocket(url, (msg) => {
    if (msg.type === 'state_update' && Array.isArray(msg.platforms)) {
      const p = msg.platforms.find(p => p.platform_id === platformId)
      if (p) setState(p)
    }
  })
  return state
}

const ZONE_THEME = {
  GREEN:  { bg: '#5C8A3A', soft: '#6FA049', word: 'AVAILABLE' },
  YELLOW: { bg: '#E8A33D', soft: '#EEB45E', word: 'FILLING UP' },
  RED:    { bg: '#D7483B', soft: '#E0604F', word: 'CROWDED' },
}

export default function SignageBoard() {
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
      background: `linear-gradient(160deg, ${theme.bg} 0%, ${theme.soft} 100%)`,
      color: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.6s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.25)' }}>
        <span style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.9 }}>Platform Information</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{hh}:{mm}</span>
      </div>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: 16, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.85, margin: '0 0 8px' }}>Platform</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 140, fontWeight: 900, lineHeight: 0.9, margin: '0 0 16px' }}>{pid}</p>

        <p style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, letterSpacing: '0.04em', margin: '0 0 28px' }}>
          {theme.word}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div>
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8, margin: '0 0 4px' }}>Crowd</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, margin: 0 }}>{Math.round(density)}<span style={{ fontSize: 24, opacity: 0.8 }}>%</span></p>
          </div>
          <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.3)' }} />
          <div>
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8, margin: '0 0 4px' }}>People</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, margin: 0 }}>{count}</p>
          </div>
          {eta != null && (
            <>
              <div style={{ width: 1, height: 56, background: 'rgba(255,255,255,0.3)' }} />
              <div>
                <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.8, margin: '0 0 4px' }}>Train</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, margin: 0 }}>{Math.round(eta)}<span style={{ fontSize: 24, opacity: 0.8 }}> min</span></p>
              </div>
            </>
          )}
        </div>

        {/* HELD banner */}
        {held && (
          <div className="breathe" style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.18)', padding: '12px 26px', borderRadius: 9999 }}>
            <TrainIcon size={22} />
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.04em' }}>
              TRAIN HELD{holdMin ? ` +${holdMin} MIN` : ''} — FOR YOUR SAFETY
            </span>
          </div>
        )}

        {/* Advisory / redirect suggestion */}
        {advisory && !held && (
          <p style={{ marginTop: 30, maxWidth: 720, fontSize: 22, lineHeight: 1.5, opacity: 0.95 }}>
            {advisory}
          </p>
        )}
        {advisory && held && advisory !== bannerEn && (
          <p style={{ marginTop: 22, maxWidth: 720, fontSize: 20, lineHeight: 1.5, opacity: 0.95 }}>
            {advisory}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderTop: '1px solid rgba(255,255,255,0.25)', fontSize: 12, opacity: 0.85 }}>
        <span>Autonomous Platform Crowd Balancing Agent</span>
        <Link to="/" style={{ color: '#FFFFFF', opacity: 0.7, textDecoration: 'none' }}>← Dashboard</Link>
      </div>
    </div>
  )
}
