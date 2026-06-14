"""POST /api/translate — Groq-backed live UI-string translation (no hardcoded JA/HI)."""
from fastapi import APIRouter

from pydantic import BaseModel

from ..translate import translate_map

router = APIRouter()


class TranslateIn(BaseModel):
    strings: dict
    lang: str


@router.post("/api/translate")
async def translate(body: TranslateIn):
    return translate_map(body.strings, body.lang)
