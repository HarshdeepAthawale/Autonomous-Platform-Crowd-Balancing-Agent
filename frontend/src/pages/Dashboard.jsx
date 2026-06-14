import { useState } from 'react'
import StatusBar      from '../components/StatusBar'
import PlatformCard   from '../components/PlatformCard'
import DensityChart   from '../components/DensityChart'
import AgentActionLog from '../components/AgentActionLog'
import ScanPage       from '../components/ScanPage'
import AgentControls  from '../components/AgentControls'
import { useBackend }   from '../hooks/useBackend'
import { useAnnouncer } from '../hooks/useAnnouncer'
import { classifyZone, ZONE_COLOR } from '../lib/zone'
import { useT } from '../lib/i18n/context'

function Seigaiha() {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.10, pointerEvents: 'none' }}
         preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <pattern id="seigaiha" x="0" y="0" width="56" height="28" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#2E6F95" strokeWidth="1.4">
            <path d="M-28,28 a28,28 0 0,1 56,0" />
            <path d="M-28,28 a20,20 0 0,1 40,0" />
            <path d="M-28,28 a12,12 0 0,1 24,0" />
            <path d="M28,28 a28,28 0 0,1 56,0" />
            <path d="M28,28 a20,20 0 0,1 40,0" />
            <path d="M28,28 a12,12 0 0,1 24,0" />
            <path d="M0,0 a28,28 0 0,1 56,0" transform="translate(-28,0)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#seigaiha)" />
    </svg>
  )
}

function ZoneTile({ count, color, label }) {
  return (
    <div style={{ backgroundColor: 'rgba(253,251,246,0.7)', border: `1px solid ${color}33`, borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 70 }}>
      <p style={{ fontFamily: 'var(--font-display)', color, fontSize: 26, fontWeight: 700, margin: '0 0 1px', letterSpacing: '-0.02em' }}>{count}</p>
      <p style={{ color, fontSize: 10, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
    </div>
  )
}

function HeroStrip({ platforms }) {
  const t = useT()
  const states   = Object.values(platforms)
  const total    = states.length
  const redCount = states.filter(s => classifyZone(s.density_pct) === 'RED').length
  const yelCount = states.filter(s => classifyZone(s.density_pct) === 'YELLOW').length
  const grnCount = states.filter(s => classifyZone(s.density_pct) === 'GREEN').length

  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #F7F1E7 0%, #ECF1F6 55%, #DEEAF4 100%)', border: '1px solid #E7DECE', borderRadius: 18, marginBottom: 18, boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)' }}>
      <Seigaiha />
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 32px 30px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <p style={{ color: '#6E6356', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', margin: '0 0 8px' }}>{t('hero.stationOverview')}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 38, fontWeight: 900, margin: '0 0 6px', letterSpacing: '0.01em', lineHeight: 1.05 }}>{t('hero.platformStatus')}</h1>
          <p style={{ color: '#6E6356', fontSize: 13, margin: 0 }}>
            {total > 0 ? t('hero.monitored', { count: total }) : t('hero.waiting')}
          </p>
        </div>
        {total > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {redCount > 0 && <ZoneTile count={redCount} color={ZONE_COLOR.RED.bg}    label={t('hero.crowded')} />}
            {yelCount > 0 && <ZoneTile count={yelCount} color={ZONE_COLOR.YELLOW.bg} label={t('hero.filling')} />}
            {grnCount > 0 && <ZoneTile count={grnCount} color={ZONE_COLOR.GREEN.bg}  label={t('hero.available')} />}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const t = useT()
  const { platforms, log, graphSeries, connected, lastAnnouncement, scanTicket, pushDensity, triggerTick, overrideAction } = useBackend()
  const [voiceOn, setVoiceOn] = useState(false)

  useAnnouncer(lastAnnouncement, voiceOn)

  const platformIds = Object.keys(platforms).sort()

  return (
    <>
      <StatusBar connected={connected} overrideMode={false} voiceOn={voiceOn} onToggleVoice={() => setVoiceOn(v => !v)} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 56px' }}>
        <HeroStrip platforms={platforms} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18, marginBottom: 18 }}>
          {platformIds.length > 0
            ? platformIds.map(pid => <PlatformCard key={pid} state={platforms[pid]} />)
            : ['A', 'B'].map(pid => <PlatformCard key={pid} state={null} />)
          }
        </div>

        <div style={{ marginBottom: 18 }}>
          <DensityChart graphSeries={graphSeries} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, alignItems: 'start' }}>
          <AgentActionLog log={log} onOverride={overrideAction} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ScanPage scanTicket={scanTicket} pushDensity={pushDensity} />
            <AgentControls triggerTick={triggerTick} />
          </div>
        </div>

        <p style={{ color: '#B9AE9B', fontSize: 11, textAlign: 'center', marginTop: 44, marginBottom: 0 }}>
          {t('privacy.footer')}
        </p>
      </main>
    </>
  )
}
