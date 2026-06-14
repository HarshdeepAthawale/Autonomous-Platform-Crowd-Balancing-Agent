import { useEffect, useRef } from 'react'

// Speaks the agent's English announcement via the browser SpeechSynthesis API.
// No API key. `payload` is { text, nonce } so repeated identical text re-fires.
// Dedup: never speaks the same text twice in a row (avoids repeating "all clear"
// on every tick when state hasn't changed).
export function useAnnouncer(payload, enabled) {
  const lastNonce = useRef(null)
  const lastText  = useRef(null)

  useEffect(() => {
    if (!enabled || !payload?.text) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (payload.nonce === lastNonce.current) return
    lastNonce.current = payload.nonce
    if (payload.text === lastText.current) return
    lastText.current = payload.text

    const u = new SpeechSynthesisUtterance(payload.text)
    u.rate = 0.95          // calm, measured station-announcement pace
    u.pitch = 1.0
    u.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const en = voices.find(v => /en-GB/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang))
    if (en) u.voice = en

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }, [payload, enabled])
}
