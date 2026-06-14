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


class TTSIn(BaseModel):
    text: str        # English source text
    lang: str = "en"


@router.post("/api/tts")
async def tts(body: TTSIn):
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="TTS not configured (no ElevenLabs key)")
    text_en = body.text.strip()
    if not text_en:
        raise HTTPException(status_code=400, detail="empty text")

    key = hashlib.sha1(f"{body.lang}:{text_en}".encode()).hexdigest()
    if key in _cache:
        return Response(content=_cache[key], media_type="audio/mpeg")

    # AI-translate EN -> target language (falls back to English on failure).
    spoken = translate_text(text_en, body.lang)
    voice_id = settings.elevenlabs_voices.get(body.lang, settings.elevenlabs_voices["en"])

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        "?output_format=mp3_44100_128"
    )
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                url,
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": spoken,
                    "model_id": MODEL_ID,
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                },
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"TTS upstream error: {e}")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"ElevenLabs {r.status_code}: {r.text[:200]}")

    audio = r.content
    _cache[key] = audio
    return Response(content=audio, media_type="audio/mpeg")
