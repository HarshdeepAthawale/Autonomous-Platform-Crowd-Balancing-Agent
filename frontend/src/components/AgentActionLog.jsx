import { AgentIcon } from '../lib/icons'
import { useT, useTranslatedText } from '../lib/i18n/context'

// Renders the entry's dynamic text, translated to the current UI language.
function LogText({ entry }) {
  const raw = entry.reasoning || entry.message || entry.text || ''
  const text = useTranslatedText(raw)
  return (
    <p style={{ color: '#211C15', fontSize: 13, margin: 0, lineHeight: 1.55 }}>
      {text || JSON.stringify(entry)}
    </p>
  )
}

const CHIP_STYLE = {
  HOLD:               { color: '#B8352C', lightBg: '#F9EAE6', key: 'log.chip.hold' },
  REDIRECT_SUGGESTION:{ color: '#2E6F95', lightBg: '#EAF1F6', key: 'log.chip.redirect' },
  ANNOUNCE:           { color: '#5C8A3A', lightBg: '#EDF3E4', key: 'log.chip.announce' },
  SIGNAGE:            { color: '#9A7B1F', lightBg: '#FBF1DA', key: 'log.chip.signage' },
  OPERATOR_ALERT:     { color: '#B8352C', lightBg: '#F9EAE6', key: 'log.chip.alert' },
  LOG:                { color: '#6E6356', lightBg: '#F4EEE3', key: 'log.chip.log' },
  STATUS:             { color: '#2E6F95', lightBg: '#EAF4FC', key: 'log.chip.status' },
}

// Order chips by importance and keep it readable
const CHIP_ORDER = ['HOLD', 'REDIRECT_SUGGESTION', 'ANNOUNCE', 'SIGNAGE', 'OPERATOR_ALERT']

function chipsFor(entry) {
  if (entry.isStatus) return [CHIP_STYLE.STATUS]
  const actions = Array.isArray(entry.actions) ? entry.actions : []
  const ordered = CHIP_ORDER.filter(a => actions.includes(a))
  const list = ordered.length ? ordered : ['LOG']
  return list.map(a => CHIP_STYLE[a] || CHIP_STYLE.LOG)
}

// Primary action drives the left-border accent
function accentColor(entry) {
  if (entry.isStatus) return '#2E6F95'
  const c = chipsFor(entry)[0]
  return c.color
}

function formatTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

export default function AgentActionLog({ log, onOverride }) {
  const t = useT()
  return (
    <div style={{
      backgroundColor: '#FDFBF6',
      border: '1px solid #E7DECE',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(80,55,20,0.04), 0 6px 20px rgba(80,55,20,0.05)',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #EFE7D9',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ color: '#6E6356', display: 'flex' }}><AgentIcon size={17} /></span>
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 16, fontWeight: 700 }}>{t('log.title')}</span>
        </div>
        <span style={{
          backgroundColor: '#F4EEE3', color: '#6E6356',
          fontSize: 11, padding: '3px 9px', borderRadius: 9999, fontWeight: 500,
        }}>
          {t('log.event', { count: log.length })}
        </span>
      </div>

      {/* Entries */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {log.length === 0 ? (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <p style={{ color: '#A99E8C', fontSize: 13, margin: '0 0 4px' }}>{t('log.waiting')}</p>
            <p style={{ color: '#C2B7A4', fontSize: 12, margin: 0 }}>{t('log.agentActs')}</p>
          </div>
        ) : (
          log.map((entry) => {
            const chips = chipsFor(entry)
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  borderBottom: '1px solid #EFE7D9',
                  borderLeft: `3px solid ${entry.overridden ? '#C2B7A4' : accentColor(entry)}`,
                  padding: '14px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  opacity: entry.overridden ? 0.6 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <span style={{ color: '#A99E8C', fontSize: 11, minWidth: 54, paddingTop: 3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {formatTs(entry.ts)}
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                    {chips.map((chip, i) => (
                      <span key={i} style={{
                        backgroundColor: chip.lightBg, color: chip.color,
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 9999, letterSpacing: '0.06em',
                        display: 'inline-block', textTransform: 'uppercase',
                      }}>
                        {t(chip.key)}
                      </span>
                    ))}
                  </div>
                  <LogText entry={entry} />
                </div>

                {entry.overridden ? (
                  <span style={{
                    border: '1px solid #E7DECE', backgroundColor: '#F4EEE3',
                    color: '#6E6356', fontSize: 11, padding: '4px 12px',
                    borderRadius: 9999, whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600,
                  }}>
                    {t('log.overridden')}
                  </span>
                ) : onOverride && entry.id && (
                  <button
                    onClick={() => onOverride(entry.id)}
                    style={{
                      border: '1px solid #E7DECE', backgroundColor: 'transparent',
                      color: '#6E6356', fontSize: 11, padding: '4px 12px',
                      borderRadius: 9999, cursor: 'pointer', whiteSpace: 'nowrap',
                      transition: 'all 0.15s', flexShrink: 0,
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#D7483B'; e.currentTarget.style.color = '#D7483B' }}
                    onMouseOut={e =>  { e.currentTarget.style.borderColor = '#E7DECE'; e.currentTarget.style.color = '#6E6356' }}
                  >
                    {t('log.override')}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
