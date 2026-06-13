import StatusBar      from './components/StatusBar'
import PlatformCard   from './components/PlatformCard'
import DensityChart   from './components/DensityChart'
import AgentActionLog from './components/AgentActionLog'
import ScanPage       from './components/ScanPage'
import AgentControls  from './components/AgentControls'
import { useBackend } from './hooks/useBackend'
import './index.css'

export default function App() {
  const { platforms, log, graphSeries, connected, scanTicket, triggerTick, overrideAction } = useBackend()

  const platformIds = Object.keys(platforms).sort()
  const hasOverride = log.some(e => (e.type || '').includes('override'))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1B2A4A' }}>
      <StatusBar connected={connected} overrideMode={hasOverride} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 40px' }}>

        {/* Section label */}
        <p style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
          Live Platform Status
        </p>

        {/* Platform cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {platformIds.length > 0
            ? platformIds.map(pid => <PlatformCard key={pid} state={platforms[pid]} />)
            : ['A', 'B'].map(pid => <PlatformCard key={pid} state={null} />)
          }
        </div>

        {/* Density chart */}
        <div style={{ marginBottom: 24 }}>
          <DensityChart graphSeries={graphSeries} />
        </div>

        {/* Log + sidebar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: 16,
            alignItems: 'start',
          }}
        >
          <AgentActionLog log={log} onOverride={overrideAction} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ScanPage scanTicket={scanTicket} platforms={platforms} />
            <AgentControls triggerTick={triggerTick} />
          </div>
        </div>

        {/* Privacy footer */}
        <p style={{ color: '#2A3A5C', fontSize: 11, textAlign: 'center', marginTop: 32 }}>
          Privacy: platform ID + train ID only · no PII · no camera frames · data auto-expires ≤1h after train departure
        </p>
      </main>
    </div>
  )
}
