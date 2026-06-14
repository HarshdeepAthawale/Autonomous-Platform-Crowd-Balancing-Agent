// Natural multilingual voice via ElevenLabs (Multilingual v2 handles EN/JA/HI).
// The browser SpeechSynthesis engine (espeak on Linux) can't reliably voice
// Japanese / Hindi and sounds robotic — so we fetch real audio from ElevenLabs
// and play it as an <audio> clip. Falls back to the browser engine (see
// useAnnouncer) if this fails.

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'   // "Rachel" — calm, clear premade voice
const MODEL_ID = 'eleven_multilingual_v2' // multilingual: speaks EN / JA / HI

// Cache generated clips so repeat/identical announcements are instant + free.
const _cache = new Map()   // key `${lang}:${text}` -> blob: URL
let _current = null         // currently-playing Audio, so we can interrupt it

async function _synthesize(text) {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('VITE_ELEVENLABS_API_KEY not set')

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  )
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
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
    url = await _synthesize(text)
    _cache.set(key, url)
  }
  stopNatural()
  const audio = new Audio(url)
  _current = audio
  await audio.play()   // rejects if autoplay is blocked -> caller falls back
}
