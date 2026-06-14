// UI-string translation via our backend /api/translate (Groq-powered).
// English is the single source of truth; JA/HI are AI-translated on demand and
// cached in localStorage so repeat language switches are instant. The Groq key
// stays server-side. (Filename kept for import compatibility.)

const CACHE_VERSION = 'v2'   // bumped: invalidates any old Gemini-era cache

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

/** Clear cached translations (call after English source strings change). */
export function clearTranslationCache() {
  for (const lang of ['ja', 'hi']) {
    try { localStorage.removeItem(`crowd-trans-${lang}-${CACHE_VERSION}`) } catch {}
  }
}
