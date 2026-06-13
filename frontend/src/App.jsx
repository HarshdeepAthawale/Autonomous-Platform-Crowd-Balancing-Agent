import StatusBar      from './components/StatusBar'
import PlatformCard   from './components/PlatformCard'
import DensityChart   from './components/DensityChart'
import AgentActionLog from './components/AgentActionLog'
import ScanPage       from './components/ScanPage'
import AgentControls  from './components/AgentControls'
import { useBackend } from './hooks/useBackend'
import { classifyZone, ZONE_COLOR } from './lib/zone'
import './index.css'

function HeroStrip({ platforms }) {
  const states   = Object.values(platforms)
  const total    = states.length
  const redCount  = states.filter(s => classifyZone(s.density_pct) === 'RED').length
  const yelCount  = states.filter(s => classifyZone(s.density_pct) === 'YELLOW').length
  const grnCount  = states.filter(s => classifyZone(s.density_pct) === 'GREEN').length

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F7F5F0 0%, #EBF3FA 55%, #D9EBF7 100%)',
      borderBottom: '1px solid #E5E1D8',
      padding: '28px 32px 24px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#6B7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            Station Overview
          </p>
          <h1 style={{ color: '#1A1A1A', fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Platform Status
          </h1>
          <p style={{ color: '#6B7280', fontSize: 13, margin: 0 }}>
            {total > 0 ? `${total} platform${total !== 1 ? 's' : ''} monitored · autonomous balancing active` : 'Waiting for platform data…'}
          </p>
        </div>

        {total > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {redCount > 0 && (
              <div style={{ backgroundColor: ZONE_COLOR.RED.lightBg, border: `1px solid ${ZONE_COLOR.RED.bg}30`, borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                <p style={{ color: ZONE_COLOR.RED.bg, fontSize: 22, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{redCount}</p>
                <p style={{ color: ZONE_COLOR.RED.bg, fontSize: 10, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Crowded</p>
              </div>
            )}
            {yelCount > 0 && (
              <div style={{ backgroundColor: ZONE_COLOR.YELLOW.lightBg, border: `1px solid ${ZONE_COLOR.YELLOW.bg}30`, borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                <p style={{ color: ZONE_COLOR.YELLOW.bg, fontSize: 22, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{yelCount}</p>
                <p style={{ color: ZONE_COLOR.YELLOW.bg, fontSize: 10, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filling</p>
              </div>
            )}
            {grnCount > 0 && (
              <div style={{ backgroundColor: ZONE_COLOR.GREEN.lightBg, border: `1px solid ${ZONE_COLOR.GREEN.bg}30`, borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
                <p style={{ color: ZONE_COLOR.GREEN.bg, fontSize: 22, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{grnCount}</p>
                <p style={{ color: ZONE_COLOR.GREEN.bg, fontSize: 10, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { platforms, log, graphSeries, connected, scanTicket, triggerTick, overrideAction } = useBackend()

  const platformIds = Object.keys(platforms).sort()
  const hasOverride = log.some(e => (e.type || '').includes('override'))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0EEE9' }}>
      <StatusBar connected={connected} overrideMode={hasOverride} />
      <HeroStrip platforms={platforms} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 56px' }}>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
          {platformIds.length > 0
            ? platformIds.map(pid => <PlatformCard key={pid} state={platforms[pid]} />)
            : ['A', 'B'].map(pid => <PlatformCard key={pid} state={null} />)
          }
        </div>

        {/* Chart */}
        <div style={{ marginBottom: 20 }}>
          <DensityChart graphSeries={graphSeries} />
        </div>

        {/* Log + sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 16, alignItems: 'start' }}>
          <AgentActionLog log={log} onOverride={overrideAction} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ScanPage scanTicket={scanTicket} platforms={platforms} />
            <AgentControls triggerTick={triggerTick} />
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: '#C8C4BC', fontSize: 11, textAlign: 'center', marginTop: 40, marginBottom: 0 }}>
          Privacy: platform ID + train ID only · no PII · no camera frames stored · data expires ≤1h after train departure
        </p>
      </main>
    </div>
  )
}
