import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { translateStrings } from '../gemini'

const LANG_KEY = 'crowd-lang'
const FALLBACK = 'en'

export const LANGS = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語',   short: 'JA' },
  { code: 'hi', label: 'हिन्दी',   short: 'HI' },
]

// English source strings — the single source of truth for all UI text.
// Japanese and Hindi are fetched from Gemini API and cached in localStorage.
const EN = {
  'app.title': 'Crowd Balancing Agent',
  'nav.dashboard': 'Dashboard',
  'nav.gate': 'Gate',
  'nav.boardA': 'Board A',
  'nav.boardB': 'Board B',

  'status.live': 'Live',
  'status.voice': 'Voice',
  'status.voiceOn': 'Voice On',
  'status.override': 'Override',
  'status.autonomous': 'Autonomous',

  'hero.stationOverview': 'Station Overview',
  'hero.platformStatus': 'Platform Status',
  'hero.monitored': '{count} platform(s) monitored · autonomous balancing active',
  'hero.waiting': 'Waiting for platform data…',
  'hero.crowded': 'Crowded',
  'hero.filling': 'Filling',
  'hero.available': 'Available',

  'platform.label': 'Platform',
  'platform.people': 'People',
  'platform.nextTrain': 'Next Train',
  'platform.eta': 'ETA',
  'platform.min': 'min',
  'platform.held': 'HELD',
  'platform.noTrain': 'No upcoming train',

  'zone.available': 'AVAILABLE',
  'zone.filling': 'FILLING UP',
  'zone.crowded': 'CROWDED',

  'density.title': 'Density Over Time',
  'density.subtitle': 'Platform Comparison',
  'density.waiting': 'Waiting for data…',
  'density.up': 'up',
  'density.down': 'down',
  'density.overWindow': 'over window',
  'density.live': 'Live · updates each reading',

  'log.title': 'Agent Action Log',
  'log.event': '{count} event(s)',
  'log.waiting': 'Waiting for agent activity…',
  'log.agentActs': 'The agent acts when a platform reaches RED.',
  'log.overridden': 'Overridden',
  'log.override': 'Override',

  'log.chip.hold': 'Hold',
  'log.chip.redirect': 'Redirect',
  'log.chip.announce': 'Announce',
  'log.chip.signage': 'Signage',
  'log.chip.alert': 'Alert',
  'log.chip.log': 'Log',

  'controls.title': 'Agent Controls',
  'controls.running': 'Running tick…',
  'controls.trigger': 'Trigger Agent Tick',
  'controls.lastResult': 'Last result',
  'controls.acted': 'Acted',
  'controls.noAction': 'No action',
  'controls.tickComplete': 'Tick complete.',
  'controls.autoRuns': 'Auto-runs every 20 s in background',

  'scan.title': 'Ticket Scan',
  'scan.demo': '/ Demo',
  'scan.reset': 'Reset',
  'scan.scan': 'Scan →',
  'scan.platform': 'Platform {id}',
  'scan.people': '≈{count} people · {pct}%',
  'scan.footer': 'Each scan +{step} · drives gauge, graph & agent · no PII',

  'gate.title': 'Station Entrance',
  'gate.scanPrompt': 'Please scan your ticket to enter',
  'gate.welcome': 'Welcome',
  'gate.busy': 'Platform {id} is busy right now',
  'gate.suggestion': 'If your train allows, Platform {id} has more space',
  'gate.suggestionEta': ' and a train arriving in about {min} minutes.',
  'gate.suggestionAvailable': ' available.',
  'gate.disclaimer': 'This is a suggestion — please follow your own train',
  'gate.allBalanced': 'All platforms balanced — have a safe journey',
  'gate.privacy': 'No personal data is collected · platform + train ID only',

  'signage.title': 'Platform Information',
  'signage.platform': 'Platform',
  'signage.crowd': 'Crowd',
  'signage.people': 'People',
  'signage.train': 'Train',
  'signage.min': ' min',
  'signage.held': 'TRAIN HELD +{min} MIN — FOR YOUR SAFETY',
  'signage.footer': 'Autonomous Platform Crowd Balancing Agent',

  'privacy.footer': 'Privacy: platform ID + train ID only · no PII · no camera frames stored · data expires ≤1h after train departure',

  'scanA.label': 'Scan →',
  'agents.acted': 'Acted',
  'agents.noAction': 'No action',

  'language.label': 'Language',
  'language.en': 'English',
  'language.ja': '日本語',
  'language.hi': 'हिन्दी',

  // Aliases used by PlatformCard and SignageBoard: t('zone.' + zoneKey.toLowerCase())
  // where zoneKey is GREEN / YELLOW / RED (uppercase from backend)
  'zone.green':  'AVAILABLE',
  'zone.yellow': 'FILLING UP',
  'zone.red':    'CROWDED',

  'log.chip.status': 'Status',
}

function getInitialLang() {
  try { return localStorage.getItem(LANG_KEY) || FALLBACK }
  catch { return FALLBACK }
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)
  const [strings, setStrings] = useState(EN)
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (lang === 'en') {
      setStrings(EN)
      return
    }
    setTranslating(true)
    // Show English immediately while Gemini translates (or serves from cache).
    setStrings(EN)
    translateStrings(EN, lang).then(result => {
      setStrings(result)
      setTranslating(false)
    })
  }, [lang])

  const setLang = useCallback((next) => {
    setLangState(next)
    try { localStorage.setItem(LANG_KEY, next) } catch {}
  }, [])

  const t = useCallback((key, vars) => {
    let val = strings[key]
    if (val == null) return key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v)
      })
    }
    return val
  }, [strings])

  return (
    <I18nContext.Provider value={{ lang, setLang, t, translating }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function useT() {
  const { t } = useI18n()
  return t
}
