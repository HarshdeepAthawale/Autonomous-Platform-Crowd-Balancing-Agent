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
  GREEN:  { bg: '#5C8A3A', text: '#FFFFFF', label: 'AVAILABLE',  shape: '●', lightBg: '#EDF3E4' },
  YELLOW: { bg: '#E8A33D', text: '#FFFFFF', label: 'FILLING UP', shape: '◆', lightBg: '#FBF1DA' },
  RED:    { bg: '#D7483B', text: '#FFFFFF', label: 'CROWDED',    shape: '■', lightBg: '#F9EAE6' },
}

export const TREND_ICON = {
  rising:  '↑',
  falling: '↓',
  stable:  '→',
}
