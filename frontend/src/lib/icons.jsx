// Minimal inline SVG icons — 1.5px stroke, currentColor. Replaces emoji.

const base = (size) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round',
})

export function StationMark({ size = 22, color = 'currentColor' }) {
  // Torii gate — clean station/Japan glyph
  return (
    <svg {...base(size)} style={{ color }}>
      <path d="M3 6.5h18" />
      <path d="M2.5 4.5c3 1.2 16 1.2 19 0" />
      <path d="M6 6.5V20" />
      <path d="M18 6.5V20" />
      <path d="M5 10.5h14" />
    </svg>
  )
}

export function TrainIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <rect x="5" y="3" width="14" height="13" rx="3" />
      <path d="M5 10h14" />
      <circle cx="9" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M8 19l-2 2M16 19l2 2" />
    </svg>
  )
}

export function TicketIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="1.5 2" />
    </svg>
  )
}

export function GearIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
    </svg>
  )
}

export function AgentIcon({ size = 16, color = 'currentColor' }) {
  // Node / spark — autonomous agent
  return (
    <svg {...base(size)} style={{ color }}>
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="4" r="1.4" />
      <circle cx="5" cy="17" r="1.4" />
      <circle cx="19" cy="17" r="1.4" />
      <path d="M12 8.8V5.4M10.2 13.6l-3.6 2.5M13.8 13.6l3.6 2.5" />
    </svg>
  )
}

export function PlayIcon({ size = 13, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export function SpeakerOnIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" />
    </svg>
  )
}

export function SpeakerOffIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M22 9l-5 6M17 9l5 6" />
    </svg>
  )
}

export function PeopleIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg {...base(size)} style={{ color }}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 11a3 3 0 0 0 0-6M21 20c0-2.5-1.5-4.7-3.7-5.6" />
    </svg>
  )
}
