// UI-string translation via our backend /api/translate (Groq-powered).
// English is the single source of truth; JA/HI are AI-translated on demand and
// cached in localStorage so repeat language switches are instant. The Groq key
// stays server-side. (No Gemini anywhere — translation + announcements use Groq,
// voice uses ElevenLabs.)

const CACHE_VERSION = 'v3'   // bumped: invalidates any stale Gemini/partial cache

/**
 * Translate the full English string map to targetLang via the backend.
 * Returns the translated map (same keys); falls back to English on any error.
 */
export async function translateStrings(englishStrings, targetLang) {
  if (targetLang === 'en') return englishStrings

  const cacheKey = `crowd-trans-${targetLang}-${CACHE_VERSION}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strings: englishStrings, lang: targetLang }),
    })
    if (!res.ok) throw new Error(`translate ${res.status}`)
    const merged = { ...englishStrings, ...(await res.json()) }
    try { localStorage.setItem(cacheKey, JSON.stringify(merged)) } catch {}
    return merged
  } catch (err) {
    console.error('[i18n] translation failed:', err)
    return englishStrings
  }
}

// Translate a single dynamic string (agent-log lines, announcements, etc.) to
// targetLang via the backend (Groq). Cached in-memory; returns English on failure.
const _textCache = new Map()   // `${lang}:${text}` -> translated
export async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text
  const key = `${targetLang}:${text}`
  if (_textCache.has(key)) return _textCache.get(key)
  try {
    const res = await fetch('/api/translate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: targetLang }),
    })
    if (!res.ok) throw new Error(`translate-text ${res.status}`)
    const out = (await res.json()).text || text
    _textCache.set(key, out)
    return out
  } catch {
    return text
  }
}

/** Clear cached translations (call after English source strings change). */
export function clearTranslationCache() {
  for (const lang of ['ja', 'hi']) {
    try { localStorage.removeItem(`crowd-trans-${lang}-${CACHE_VERSION}`) } catch {}
  }
}
