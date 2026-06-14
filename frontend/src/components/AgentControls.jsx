import { useState } from 'react'
import { GearIcon, PlayIcon } from '../lib/icons'
import { useT } from '../lib/i18n/context'

export default function AgentControls({ triggerTick }) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [last, setLast]       = useState(null)

  async function handleTick() {
    setLoading(true)
    try {
      const res = await triggerTick()
      setLast(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: '#6E6356', display: 'flex' }}><GearIcon size={16} /></span>
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 15, fontWeight: 700 }}>{t('controls.title')}</span>
      </div>

      <button
        onClick={handleTick}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: loading ? '#EFE7D9' : '#211C15',
          color: loading ? '#A99E8C' : '#FDFBF6',
          border: 'none',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.01em',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
        }}
      >
        {!loading && <PlayIcon size={12} />}
        <span>{loading ? t('controls.running') : t('controls.trigger')}</span>
      </button>

      {last && (
        <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: '#F4EEE3', border: '1px solid #E7DECE', borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ color: '#6E6356', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('controls.lastResult')}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, letterSpacing: '0.05em', textTransform: 'uppercase',
              backgroundColor: last.action ? '#EDF3E4' : '#F4EEE3',
              color: last.action ? '#5C8A3A' : '#A99E8C',
              border: `1px solid ${last.action ? '#BCD49E' : '#E7DECE'}`,
            }}>
              {last.action ? t('agents.acted') : t('agents.noAction')}
            </span>
          </div>
          <p style={{ color: '#211C15', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {last.decision?.reasoning || last.reason || t('controls.tickComplete')}
          </p>
        </div>
      )}

      <p style={{ color: '#C2B7A4', fontSize: 11, marginTop: 12, marginBottom: 0 }}>
        {t('controls.autoRuns')}
      </p>
    </div>
  )
}
