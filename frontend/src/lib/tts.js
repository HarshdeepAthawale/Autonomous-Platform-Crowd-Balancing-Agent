// Natural multilingual voice via Gemini's native TTS model.
// The browser SpeechSynthesis engine (espeak on Linux) can't reliably voice
// Japanese / Hindi and sounds robotic — so we generate real audio from Gemini
// (EN/JA/HI all handled by one multilingual model) and play it as an <audio> clip.
// Falls back to the browser engine (see useAnnouncer) if this fails.

const TTS_MODEL = 'gemini-2.5-flash-preview-tts'
const VOICE_NAME = 'Kore'   // calm, even — suits station announcements

// Cache generated clips so repeat/identical announcements are instant + free.
const _cache = new Map()      // key `${lang}:${text}` -> blob: URL
let _current = null           // currently-playing Audio, so we can interrupt it

function _b64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// Gemini returns raw 16-bit PCM (mono). Wrap it in a WAV container so <audio> can play it.
function _pcmToWavUrl(pcmBytes, sampleRate) {
  const header = new ArrayBuffer(44)
  const view = new DataView(header)
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)) }
  const dataLen = pcmBytes.length
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + dataLen, true); writeStr(8, 'WAVE')
  writeStr(12, 'fmt '); view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)            // PCM
  view.setUint16(22, 1, true)            // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)  // byte rate (mono, 16-bit)
  view.setUint16(32, 2, true)            // block align
  view.setUint16(34, 16, true)           // bits per sample
  writeStr(36, 'data'); view.setUint32(40, dataLen, true)
  const blob = new Blob([header, pcmBytes], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

async function _synthesize(text, lang) {
  const key = `${lang}:${text}`
  if (_cache.has(key)) return _cache.get(key)

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } } },
        },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${await res.text()}`)

  const data = await res.json()
  const part = data.candidates?.[0]?.content?.parts?.[0]?.inlineData
  if (!part?.data) throw new Error('Gemini TTS: no audio in response')

  const rate = parseInt(/rate=(\d+)/.exec(part.mimeType || '')?.[1] || '24000', 10)
  const url = _pcmToWavUrl(_b64ToBytes(part.data), rate)
  _cache.set(key, url)
  return url
}

export function stopGemini() {
  if (_current) { try { _current.pause() } catch {} _current = null }
}

// Speak `text` in `lang` using Gemini audio. Resolves once playback STARTS;
// rejects on any failure so the caller can fall back to the browser engine.
export async function speakGemini(text, lang) {
  if (!text) return
  const url = await _synthesize(text, lang)
  stopGemini()
  const audio = new Audio(url)
  _current = audio
  await audio.play()   // rejects if autoplay is blocked -> caller falls back
}
