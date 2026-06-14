"""POST /api/translate — Groq-backed live UI-string translation (no hardcoded JA/HI)."""
from fastapi import APIRouter

from pydantic import BaseModel

from ..translate import translate_map, translate_text

router = APIRouter()


class TranslateIn(BaseModel):
    strings: dict
    lang: str


class TranslateTextIn(BaseModel):
    text: str
    lang: str


@router.post("/api/translate")
async def translate(body: TranslateIn):
    return translate_map(body.strings, body.lang)


@router.post("/api/translate-text")
async def translate_one(body: TranslateTextIn):
    """Translate a single dynamic string (e.g. an agent-log line) to `lang`."""
    return {"text": translate_text(body.text, body.lang)}
