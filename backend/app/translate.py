"""Groq-backed live translation — no hardcoded JA/HI text anywhere.

English is the single source of truth; Japanese/Hindi are generated on demand by
Groq (Llama 3.3) and cached in-process. Used by both the UI-string endpoint and
the TTS endpoint so every non-English string is AI-translated, never hardcoded.
"""
import hashlib
import json

import httpx

from .config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"
_LANG = {"ja": "Japanese", "hi": "Hindi"}

_text_cache: dict[tuple[str, str], str] = {}
# keyed by (lang, hash of the exact input map) so a partial request can't return
# a stale full map (or vice-versa)
_map_cache: dict[tuple[str, str], dict] = {}


def _chat(prompt: str, max_tokens: int, json_mode: bool = False) -> str:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY not configured")
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.2,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}
    r = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.groq_api_key}", "Content-Type": "application/json"},
        json=body,
        timeout=30.0,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def translate_text(text: str, lang: str) -> str:
    """Translate a single announcement string EN -> lang. Returns English on failure."""
    if lang == "en" or not text:
        return text
    key = (lang, text)
    if key in _text_cache:
        return _text_cache[key]
    name = _LANG.get(lang, lang)
    try:
        out = _chat(
            f"Translate this railway-station announcement into {name}. Keep it calm and "
            f"natural, the way a station PA system speaks. Return ONLY the translation — no "
            f"quotes, no notes:\n\n{text}",
            300,
        ).strip()
    except Exception:
        return text  # graceful fallback: speak English rather than nothing
    _text_cache[key] = out
    return out


def translate_map(strings: dict, lang: str) -> dict:
    """Translate a whole UI string map EN -> lang in one call (cached per language)."""
    if lang == "en":
        return strings
    digest = hashlib.sha1(json.dumps(strings, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    cache_key = (lang, digest)
    if cache_key in _map_cache:
        return _map_cache[cache_key]
    name = _LANG.get(lang, lang)
    prompt = (
        f"Translate the JSON string VALUES from English to {name} for a railway-station UI. "
        "Rules: keep all keys identical; keep {placeholder} tokens, the symbols → · ≈ % +, and "
        'platform letters A/B unchanged; for keys "language.en"/"language.ja"/"language.hi" output '
        '"English"/"日本語"/"हिन्दी" respectively; keep it concise (display-board text). '
        "Return ONLY valid JSON with the same keys.\n\n"
        + json.dumps(strings, ensure_ascii=False)
    )
    try:
        raw = _chat(prompt, 4000, json_mode=True)
        merged = {**strings, **json.loads(raw)}
    except Exception:
        return strings  # fall back to English UI rather than breaking
    _map_cache[cache_key] = merged
    return merged
