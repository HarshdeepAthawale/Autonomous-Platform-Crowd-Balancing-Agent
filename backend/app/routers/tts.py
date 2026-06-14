"""POST /api/tts — server-side ElevenLabs proxy for natural multilingual voice.

The browser's built-in SpeechSynthesis (espeak on Linux) is robotic and can't
reliably voice Japanese/Hindi. We proxy ElevenLabs (Multilingual v2) here so the
API key stays off the client, there's no CORS issue, and identical announcements
are cached. Returns audio/mpeg the frontend plays directly.
"""
import hashlib

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from ..config import settings

router = APIRouter()

MODEL_ID = "eleven_multilingual_v2"   # speaks EN / JA / HI from one model
_cache: dict[str, bytes] = {}          # sha1(lang:text) -> mp3 bytes


class TTSIn(BaseModel):
    text: str
    lang: str = "en"


@router.post("/api/tts")
async def tts(body: TTSIn):
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="TTS not configured (no ElevenLabs key)")
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="empty text")

    key = hashlib.sha1(f"{body.lang}:{text}".encode()).hexdigest()
    if key in _cache:
        return Response(content=_cache[key], media_type="audio/mpeg")

    url = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{settings.elevenlabs_voice_id}"
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
                    "text": text,
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
