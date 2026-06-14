"""POST /api/tts — natural multilingual voice (Groq translation + ElevenLabs).

The frontend always sends ENGLISH text + a target language. We Groq-translate it
(no hardcoded JA/HI), then synthesize with ElevenLabs Multilingual v2 using a
distinct premade voice per language. Result MP3 is cached and returned as
audio/mpeg. Keeps both API keys server-side; no CORS.
"""
import hashlib

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from ..config import settings
from ..translate import translate_text

router = APIRouter()

MODEL_ID = "eleven_multilingual_v2"   # speaks EN / JA / HI
_cache: dict[str, bytes] = {}          # sha1(lang:english_text) -> mp3 bytes
_state = {"idx": 0}                     # index of the current working ElevenLabs key

# Status codes that mean "this key is spent/invalid — try the next one".
_ROTATE_CODES = {401, 402, 429}


class TTSIn(BaseModel):
    text: str        # English source text
    lang: str = "en"


@router.post("/api/tts")
async def tts(body: TTSIn):
    keys = settings.elevenlabs_keys
    if not keys:
        raise HTTPException(status_code=503, detail="TTS not configured (no ElevenLabs key)")
    text_en = body.text.strip()
    if not text_en:
        raise HTTPException(status_code=400, detail="empty text")

    cache_key = hashlib.sha1(f"{body.lang}:{text_en}".encode()).hexdigest()
    if cache_key in _cache:
        return Response(content=_cache[cache_key], media_type="audio/mpeg")

    # AI-translate EN -> target language (falls back to English on failure).
    spoken = translate_text(text_en, body.lang)
    voice_id = settings.elevenlabs_voices.get(body.lang, settings.elevenlabs_voices["en"])
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
    payload = {
        "text": spoken,
        "model_id": MODEL_ID,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    n = len(keys)
    last_err = "no keys tried"
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Start from the last-known-good key; rotate through the rest on exhaustion.
        for offset in range(n):
            idx = (_state["idx"] + offset) % n
            try:
                r = await client.post(
                    url,
                    headers={"xi-api-key": keys[idx], "Content-Type": "application/json", "Accept": "audio/mpeg"},
                    json=payload,
                )
            except httpx.HTTPError as e:
                last_err = f"network: {e}"
                continue
            if r.status_code == 200:
                _state["idx"] = idx           # stick with this working key
                _cache[cache_key] = r.content
                return Response(content=r.content, media_type="audio/mpeg")
            if r.status_code in _ROTATE_CODES:
                last_err = f"key #{idx + 1} exhausted ({r.status_code})"
                continue                       # try the next key
            # Other error (bad request, server error) — don't burn other keys on it.
            raise HTTPException(status_code=502, detail=f"ElevenLabs {r.status_code}: {r.text[:200]}")

    raise HTTPException(status_code=502, detail=f"All {n} ElevenLabs keys exhausted ({last_err})")
