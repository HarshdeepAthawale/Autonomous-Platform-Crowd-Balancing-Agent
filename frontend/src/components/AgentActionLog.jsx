const ACTION_CHIP = {
  hold:     { color: '#B8352C', lightBg: '#FEF2F2', label: 'Hold' },
  redirect: { color: '#2E6F95', lightBg: '#EFF6FF', label: 'Redirect' },
  announce: { color: '#5C8A3A', lightBg: '#F0FFF4', label: 'Announce' },
  log:      { color: '#6B7280', lightBg: '#F9FAFB', label: 'Log' },
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
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E1D8',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #F0EEE9',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <span style={{ color: '#1A1A1A', fontSize: 14, fontWeight: 600 }}>Agent Action Log</span>
        </div>
        <span style={{
          backgroundColor: '#F0EEE9',
          color: '#6B7280',
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 9999,
          fontWeight: 500,
        }}>
          {log.length} event{log.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Entries */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {log.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: 13, margin: '0 0 4px' }}>Waiting for agent activity…</p>
            <p style={{ color: '#D1D5DB', fontSize: 12, margin: 0 }}>The agent acts when a platform reaches RED.</p>
          </div>
        ) : (
          log.map((entry) => {
            const chip = detectChip(entry)
            return (
              <div
                key={entry.id}
                className="slide-in"
                style={{
                  borderBottom: '1px solid #F0EEE9',
                  borderLeft: `3px solid ${chip.color}`,
                  padding: '14px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                {/* Timestamp */}
                <span style={{ color: '#9CA3AF', fontSize: 11, minWidth: 54, paddingTop: 3, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {formatTs(entry.ts)}
                </span>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <span style={{
                    backgroundColor: chip.lightBg,
                    color: chip.color,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                    marginBottom: 6,
                  }}>
                    {chip.label}
                  </span>
                  <p style={{ color: '#1A1A1A', fontSize: 13, margin: 0, lineHeight: 1.55 }}>
                    {entry.reasoning || entry.message || entry.text || JSON.stringify(entry)}
                  </p>
                </div>

                {/* Override */}
                {onOverride && entry.id && (
                  <button
                    onClick={() => onOverride(entry.id)}
                    style={{
                      border: '1px solid #E5E1D8',
                      backgroundColor: 'transparent',
                      color: '#6B7280',
                      fontSize: 11,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#D7483B'; e.currentTarget.style.color = '#D7483B' }}
                    onMouseOut={e =>  { e.currentTarget.style.borderColor = '#E5E1D8'; e.currentTarget.style.color = '#6B7280' }}
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
