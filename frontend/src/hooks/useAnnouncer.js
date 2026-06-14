import { useEffect, useRef } from 'react'
import { speakNatural } from '../lib/tts'

// Language → BCP-47 tag used to select the best SpeechSynthesis voice.
const VOICE_LANG = {
  en: ['en-GB', 'en-US', 'en'],
  ja: ['ja-JP', 'ja'],
  hi: ['hi-IN', 'hi'],
}

function pickVoice(voices, lang) {
  const prefs = VOICE_LANG[lang] || VOICE_LANG.en
  for (const pref of prefs) {
    const match = voices.find(v => {
      const vLang = v.lang.toLowerCase()
      // Never resolve to an English voice when the target language is non-English
      if (lang !== 'en' && vLang.startsWith('en')) return false
      return vLang.startsWith(pref.toLowerCase())
    })
    if (match) return match
  }
  return null
}

// Browser SpeechSynthesis path — used only as a fallback if Gemini audio fails.
function speakBrowser(text, lang) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  if (!text) return
  const u = new SpeechSynthesisUtterance(text)
  u.rate   = 0.92
  u.pitch  = 1.0
  u.volume = 1.0
  u.lang   = (VOICE_LANG[lang] || VOICE_LANG.en)[0]
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const voice  = pickVoice(voices, lang)
    if (voice) u.voice = voice
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }
  const voices = window.speechSynthesis.getVoices()
  if (voices.length) trySpeak()
  else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      trySpeak()
    }
  }
}

// Speak arbitrary text immediately (welcome message, zone-change alerts).
// Prefers natural Gemini audio; falls back to the browser engine on any failure.
export function speakText(text, lang) {
  if (!text) return
  speakNatural(text, lang).catch(() => speakBrowser(text, lang))
}

/**
 * Speaks an announcement via the browser SpeechSynthesis API.
 *
 * payload — { texts: { en, ja, hi }, nonce } from useBackend.
 * lang    — current UI language code ('en' | 'ja' | 'hi').
 * enabled — voice toggle state.
 *
 * A fresh nonce triggers a new utterance even if the text is identical.
 */
export function useAnnouncer(payload, lang, enabled) {
  const lastNonce = useRef(null)

  useEffect(() => {
    if (!enabled || !payload?.texts) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (payload.nonce === lastNonce.current) return
    lastNonce.current = payload.nonce

    // Prefer the current UI language; fall back to English if that text is missing.
    const text = payload.texts[lang] || payload.texts.en
    if (!text) return

    // Natural Gemini audio first; browser engine only if that fails.
    speakNatural(text, lang).catch(() => speakBrowser(text, lang))
  }, [payload, lang, enabled])
}
