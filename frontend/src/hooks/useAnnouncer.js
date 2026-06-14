import { useEffect, useRef } from 'react'
import { speakNatural } from '../lib/tts'

// Speak arbitrary text immediately (welcome message, zone-change alerts) using
// natural ElevenLabs audio. No browser-SpeechSynthesis fallback — if TTS fails we
// stay silent rather than play the robotic engine voice.
export function speakText(text, lang) {
  if (!text) return
  speakNatural(text, lang).catch(err => console.warn('[tts]', err))
}

/**
 * Speaks an announcement via ElevenLabs (natural EN/JA/HI voice).
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
    if (payload.nonce === lastNonce.current) return
    lastNonce.current = payload.nonce

    // Prefer the current UI language; fall back to English text if missing.
    const text = payload.texts[lang] || payload.texts.en
    if (!text) return

    speakNatural(text, lang).catch(err => console.warn('[tts]', err))
  }, [payload, lang, enabled])
}
