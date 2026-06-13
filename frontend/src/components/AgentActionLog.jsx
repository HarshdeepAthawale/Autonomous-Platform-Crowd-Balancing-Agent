import { AgentIcon } from '../lib/icons'

const ACTION_CHIP = {
  hold:     { color: '#B8352C', lightBg: '#F9EAE6', label: 'Hold' },
  redirect: { color: '#2E6F95', lightBg: '#EAF1F6', label: 'Redirect' },
  announce: { color: '#5C8A3A', lightBg: '#EDF3E4', label: 'Announce' },
  log:      { color: '#6E6356', lightBg: '#F4EEE3', label: 'Log' },
}

function detectChip(entry) {
  const t = (entry.action_type || entry.type || '').toLowerCase()
  if (t.includes('hold'))     return ACTION_CHIP.hold
  if (t.includes('redirect')) return ACTION_CHIP.redirect
  if (t.includes('announce')) return ACTION_CHIP.announce
  return ACTION_CHIP.log
}

function formatTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

export default function AgentActionLog({ log, onOverride }) {
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
          <span style={{ fontFamily: 'var(--font-display)', color: '#211C15', fontSize: 16, fontWeight: 700 }}>Agent Action Log</span>
        </div>
        <span style={{
          backgroundColor: '#F4EEE3', color: '#6E6356',
          fontSize: 11, padding: '3px 9px', borderRadius: 9999, fontWeight: 500,
        }}>
          {log.length} event{log.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Entries */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {log.length === 0 ? (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <p style={{ color: '#A99E8C', fontSize: 13, margin: '0 0 4px' }}>Waiting for agent activity…</p>
            <p style={{ color: '#C2B7A4', fontSize: 12, margin: 0 }}>The agent acts when a platform reaches RED.</p>
          </div>
        ) : (
          log.map((entry) => {
            const chip = detectChip(entry)
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  borderBottom: '1px solid #EFE7D9',
                  borderLeft: `3px solid ${chip.color}`,
                  padding: '14px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}
              >
                <span style={{ color: '#A99E8C', fontSize: 11, minWidth: 54, paddingTop: 3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {formatTs(entry.ts)}
                </span>

                <div style={{ flex: 1 }}>
                  <span style={{
                    backgroundColor: chip.lightBg, color: chip.color,
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 9999, letterSpacing: '0.06em',
                    display: 'inline-block', marginBottom: 6, textTransform: 'uppercase',
                  }}>
                    {chip.label}
                  </span>
                  <p style={{ color: '#211C15', fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                    {entry.reasoning || entry.message || entry.text || JSON.stringify(entry)}
                  </p>
                </div>

                {onOverride && entry.id && (
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
                    Override
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
