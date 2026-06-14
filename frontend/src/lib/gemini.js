// Gemini-powered translation service.
// Translates the full English string map to a target language in one API call.
// Results are cached in localStorage so repeat language switches are instant.

const CACHE_VERSION = 'v1'

const LANG_NAMES = {
  ja: 'Japanese',
  hi: 'Hindi',
}

const LANG_CONTEXT = {
  ja: 'a Japanese railway station (use standard polite station-announcement style, 丁寧語)',
  hi: 'an Indian railway station (use clear formal Hindi in Devanagari script, as heard in station PA announcements)',
}

/**
 * Translate all UI strings to targetLang using Gemini 2.0 Flash.
 * Returns the translated string map (same keys as englishStrings).
 * Falls back to englishStrings on any error.
 */
export async function translateStrings(englishStrings, targetLang) {
  if (targetLang === 'en') return englishStrings
  if (!LANG_NAMES[targetLang]) return englishStrings

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.warn('[i18n] VITE_GEMINI_API_KEY not set — falling back to English')
    return englishStrings
  }

  const cacheKey = `crowd-trans-${targetLang}-${CACHE_VERSION}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {}

  const prompt = `You are a professional UI translator for an autonomous railway station crowd-management and platform balancing system.

Translate every string value in the JSON below from English to ${LANG_NAMES[targetLang]}, as used on ${LANG_CONTEXT[targetLang]}.

STRICT RULES — NEVER violate these:
1. Keep {placeholder} tokens exactly as written: {count}, {id}, {min}, {pct}, {step} — do not translate or alter them.
2. Keep the symbols → · ≈ % + unchanged.
3. Keep platform identifiers "A" and "B" as-is.
4. For "language.en" value: always output "English".
5. For "language.ja" value: always output "日本語".
6. For "language.hi" value: always output "हिन्दी".
7. Translate zone status terms appropriately: AVAILABLE → calm/spacious, FILLING UP → getting crowded, CROWDED → overcrowded — choose natural railway-announcement equivalents.
8. Maintain the same brevity and clarity as the English source (this is display-board text, not paragraphs).
9. Return ONLY valid JSON with identical keys — no markdown, no code fences, no explanation.

English source:
${JSON.stringify(englishStrings, null, 2)}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!raw) throw new Error('Empty Gemini response')

    const translated = JSON.parse(raw)

    // Merge so any keys Gemini missed fall back to English
    const merged = { ...englishStrings, ...translated }

    try { localStorage.setItem(cacheKey, JSON.stringify(merged)) } catch {}
    return merged
  } catch (err) {
    console.error('[i18n] Gemini translation failed:', err)
    return englishStrings
  }
}

/**
 * Clear cached translations (call after English source strings change).
 */
export function clearTranslationCache() {
  for (const lang of Object.keys(LANG_NAMES)) {
    try { localStorage.removeItem(`crowd-trans-${lang}-${CACHE_VERSION}`) } catch {}
  }
}
