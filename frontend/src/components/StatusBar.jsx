import { useState, useEffect } from 'react'

export default function StatusBar({ connected, overrideMode }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')

  return (
    <header
      style={{ backgroundColor: '#0f1e36', borderBottom: '1px solid #2A3A5C' }}
      className="flex items-center justify-between px-6 py-3"
    >
      <div className="flex items-center gap-3">
        <span style={{ color: '#2E6F95' }} className="text-xl">🚉</span>
        <div>
          <span style={{ color: '#F7F4ED' }} className="text-base font-semibold tracking-wide">
            Crowd-Balancing Agent
          </span>
          <span style={{ color: '#8A9BB5' }} className="text-xs ml-3 uppercase tracking-widest">
            Autonomous Platform Manager
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {overrideMode ? (
          <span
            style={{ backgroundColor: '#E8A33D22', color: '#E8A33D', border: '1px solid #E8A33D66' }}
            className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest"
          >
            ⚠ Override Mode
          </span>
        ) : (
          <span
            style={{ backgroundColor: '#5C8A3A22', color: '#5C8A3A', border: '1px solid #5C8A3A66' }}
            className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest"
          >
            ● Autonomous
          </span>
        )}

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? '' : 'opacity-40'}`}
            style={{ backgroundColor: connected ? '#5C8A3A' : '#8A9BB5' }}
          />
          <span style={{ color: '#8A9BB5' }} className="text-xs">
            {connected ? 'Live' : 'Connecting…'}
          </span>
        </div>

        <span style={{ color: '#F7F4ED', fontVariantNumeric: 'tabular-nums' }} className="text-sm font-mono">
          {hh}:{mm}:{ss}
        </span>
      </div>
    </header>
  )
}
