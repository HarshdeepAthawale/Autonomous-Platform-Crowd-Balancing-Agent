"""Central configuration. All thresholds/caps live here — no magic numbers in logic.

Values are env-driven (see ../.env.example) per Rules.md §4.2.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    # Zone thresholds (Schema.md / TechSpecifications.md):
    #   density < green_max            -> GREEN
    #   green_max <= density < yellow  -> YELLOW
    #   density >= yellow_max          -> RED
    green_max: float = 60.0
    yellow_max: float = 85.0

    # Agent / safety (Rules.md §1 — hard caps)
    hold_max_min: int = 10
    grace_min: int = 5
    loop_period_sec: int = 20

    # Privacy: auto-expiry window after train departure (Rules.md §2.5)
    retention_after_departure_min: int = 60

    # Per-platform capacity for density % calibration
    platform_capacity: dict[str, int] = {"A": 200, "B": 200}

    # Reasoning layer (Phase 3) — blank => rule-only fallback
    claude_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: str = "groq"  # "groq" (free, Llama 3) or "claude"

    # Voice (TTS) — ElevenLabs, proxied server-side (keeps key off the client).
    # A distinct premade voice per language (all free-tier usable).
    # One key, OR several comma-separated — the TTS route rotates to the next key
    # automatically when one runs out of credits.
    elevenlabs_api_key: str = ""
    elevenlabs_voices: dict[str, str] = {
        "en": "EXAVITQu4vr4xnSDxMaL",  # Sarah  — mature, reassuring
        "ja": "XrExE9yKIg1WjnnlVkGX",  # Matilda — knowledgeable, professional
        "hi": "Xb7hH8MSUJpSbSDYk0k2",  # Alice  — clear, engaging
    }

    @property
    def elevenlabs_keys(self) -> list[str]:
        """All configured ElevenLabs keys (comma-separated), for credit rotation."""
        return [k.strip() for k in self.elevenlabs_api_key.split(",") if k.strip()]

    @property
    def effective_llm_key(self) -> str:
        """Return the API key for the active provider."""
        if self.llm_provider == "claude":
            return self.claude_api_key
        return self.groq_api_key


settings = Settings()
