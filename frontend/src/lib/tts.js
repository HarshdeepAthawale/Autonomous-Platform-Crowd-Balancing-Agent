// Natural multilingual voice via ElevenLabs (Multilingual v2 handles EN/JA/HI),
// proxied through our backend (/api/tts) so the key stays server-side and there's
// no CORS issue. The browser SpeechSynthesis engine (espeak on Linux) is robotic
// and can't reliably voice Japanese/Hindi, so this is the primary path; useAnnouncer
// falls back to the browser engine only if this fails.

// Cache generated clips so repeat/identical announcements are instant + free.
const _cache = new Map()   // key `${lang}:${text}` -> blob: URL
let _current = null         // currently-playing Audio, so we can interrupt it

async function _synthesize(text, lang) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang }),
  })
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`)
  return URL.createObjectURL(await res.blob())
}

export function stopNatural() {
  if (_current) { try { _current.pause() } catch {} _current = null }
}

// Speak `text` (in any of EN/JA/HI) using ElevenLabs audio. `lang` is only used
// as a cache key — the multilingual model detects the language from the text.
// Resolves once playback STARTS; rejects on any failure so the caller can fall
// back to the browser engine.
export async function speakNatural(text, lang = 'en') {
  if (!text) return
  const key = `${lang}:${text}`
  let url = _cache.get(key)
  if (!url) {
    url = await _synthesize(text, lang)
    _cache.set(key, url)
  }
  stopNatural()
  const audio = new Audio(url)
  _current = audio
  await audio.play()   // rejects if autoplay is blocked -> caller falls back
}
