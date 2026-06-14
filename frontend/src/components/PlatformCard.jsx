import { ZONE_COLOR, classifyZone } from '../lib/zone'
import DensityGauge from './DensityGauge'
import { TrainIcon, PeopleIcon } from '../lib/icons'
import { useT } from '../lib/i18n/context'

function StatRow({ icon, label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ color: '#A99E8C', display: 'flex' }}>{icon}</span>}
        <span style={{ color: '#6E6356', fontSize: 12, letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', color: accent || '#211C15', fontSize: 17, fontWeight: 500 }}>
          {value}
        </span>
      </div>
    </div>
  )
}

export default function PlatformCard({ state }) {
  const t = useT()
  if (!state) return <SkeletonCard />

  const { platform_id, density_pct = 0, count = 0, zone, trend, next_train } = state
  const zoneKey = zone ?? classifyZone(density_pct)
  const zc      = ZONE_COLOR[zoneKey] ?? ZONE_COLOR.GREEN
  const isHeld  = next_train?.held === true

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
    }}>
      {/* Zone accent — slim top-left corner stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: zc.bg }} />

      <div style={{ padding: '24px 26px 24px 30px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: '#A99E8C', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {t('platform.label')}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
              {platform_id}
            </span>
          </div>

          <span style={{
            backgroundColor: zc.lightBg,
            color: zc.bg,
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 12px',
            borderRadius: 9999,
            letterSpacing: '0.06em',
            border: `1px solid ${zc.bg}25`,
          }}>
            {zc.shape} {t('zone.' + zoneKey.toLowerCase())}
          </span>
        </div>

        {/* Body: gauge + stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <DensityGauge densityPct={density_pct} zoneColor={zc.bg} label={t('zone.' + zoneKey.toLowerCase())} trend={trend} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StatRow icon={<PeopleIcon size={14} />} label={t('platform.people')} value={count} />
            <div style={{ height: 1, backgroundColor: '#EFE7D9' }} />
            {next_train ? (
              <>
                <StatRow icon={<TrainIcon size={14} />} label={t('platform.nextTrain')} value={next_train.train_id} />
                <div style={{ height: 1, backgroundColor: '#EFE7D9' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6E6356', fontSize: 12, letterSpacing: '0.04em' }}>{t('platform.eta')}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 17, fontWeight: 500 }}>
                      {next_train.eta_min} {t('platform.min')}
                    </span>
                    {isHeld && (
                      <span className="breathe" style={{
                        backgroundColor: '#B8352C', color: '#FDFBF6',
                        fontSize: 9, fontWeight: 700, padding: '3px 8px',
                        borderRadius: 9999, letterSpacing: '0.1em',
                      }}>
                        {t('platform.held')}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <span style={{ color: '#A99E8C', fontSize: 13 }}>{t('platform.noTrain')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
      padding: '24px 26px 24px 30px',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: '#E7DECE' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ width: 168, height: 150, borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle at center, transparent 52%, #EFE7D9 53%, #EFE7D9 70%, transparent 71%)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[70, 90, 50].map((w, i) => (
            <div key={i} style={{ height: 14, width: `${w}%`, backgroundColor: '#EFE7D9', borderRadius: 6 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
