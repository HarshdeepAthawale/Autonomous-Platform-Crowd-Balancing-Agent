const ACTION_CHIP = {
  hold:     { color: '#B8352C', bg: '#B8352C22', label: 'HOLD' },
  redirect: { color: '#2E6F95', bg: '#2E6F9522', label: 'REDIRECT' },
  announce: { color: '#5C8A3A', bg: '#5C8A3A22', label: 'ANNOUNCE' },
  log:      { color: '#8A9BB5', bg: '#8A9BB522', label: 'LOG' },
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
  const d = new Date(ts * 1000)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
}

export default function AgentActionLog({ log, onOverride }) {
  return (
    <div style={{ backgroundColor: '#243356', border: '1px solid #2A3A5C', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ borderBottom: '1px solid #2A3A5C', padding: '14px 20px' }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: '#2E6F95', fontSize: 16 }}>🤖</span>
          <span style={{ color: '#8A9BB5', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Agent Action Log
          </span>
        </div>
        <span style={{ color: '#8A9BB5', fontSize: 11 }}>
          {log.length} event{log.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Entries */}
      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {log.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ color: '#8A9BB5', fontSize: 13, margin: 0 }}>
              Waiting for agent activity…
            </p>
            <p style={{ color: '#2A3A5C', fontSize: 11, margin: '4px 0 0' }}>
              The agent will act when a platform reaches RED.
            </p>
          </div>
        ) : (
          log.map((entry) => {
            const chip = detectChip(entry)
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  borderBottom: '1px solid #1B2A4A',
                  padding: '12px 20px',
                  borderLeft: `3px solid ${chip.color}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* Timestamp */}
                <span
                  style={{ color: '#8A9BB5', fontSize: 11, minWidth: 54, paddingTop: 2, fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatTs(entry.ts)}
                </span>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        backgroundColor: chip.bg,
                        color: chip.color,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {chip.label}
                    </span>
                  </div>
                  <p style={{ color: '#F7F4ED', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                    {entry.reasoning || entry.message || entry.text || JSON.stringify(entry)}
                  </p>
                </div>

                {/* Override button */}
                {onOverride && entry.id && (
                  <button
                    onClick={() => onOverride(entry.id)}
                    style={{
                      border: '1px solid #2A3A5C',
                      backgroundColor: 'transparent',
                      color: '#8A9BB5',
                      fontSize: 11,
                      padding: '3px 10px',
                      borderRadius: 9999,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                    onMouseOver={e => { e.target.style.borderColor = '#D7483B'; e.target.style.color = '#D7483B' }}
                    onMouseOut={e =>  { e.target.style.borderColor = '#2A3A5C'; e.target.style.color = '#8A9BB5' }}
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
