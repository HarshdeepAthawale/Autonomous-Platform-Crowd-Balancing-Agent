import { useEffect, useRef } from 'react'

// Speaks the agent's English announcement via the browser SpeechSynthesis API.
// No API key. `payload` is { text, nonce } — a fresh nonce triggers a new utterance
// even if the text is identical to the last one (fires on every crowded tick).
export function useAnnouncer(payload, enabled) {
  const lastNonce = useRef(null)

  useEffect(() => {
    if (!enabled || !payload?.text) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (payload.nonce === lastNonce.current) return
    lastNonce.current = payload.nonce

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
