export const ZONE = {
  GREEN:  'GREEN',
  YELLOW: 'YELLOW',
  RED:    'RED',
}

export function classifyZone(densityPct) {
  if (densityPct >= 85) return ZONE.RED
  if (densityPct >= 60) return ZONE.YELLOW
  return ZONE.GREEN
}

export const ZONE_COLOR = {
  GREEN:  { bg: '#5C8A3A', text: '#F7F4ED', label: 'AVAILABLE',  shape: '●' },
  YELLOW: { bg: '#E8A33D', text: '#1A1A1A', label: 'FILLING UP', shape: '◆' },
  RED:    { bg: '#D7483B', text: '#F7F4ED', label: 'CROWDED',    shape: '■' },
}

export const TREND_ICON = {
  rising:  '↑',
  falling: '↓',
  stable:  '→',
}
