"""Announcement / reasoning drafting (Phase3 plan §6).

Two sources:
  • template_draft  — deterministic, calm, bilingual (Design.md §6). Always works.
  • claude_draft    — uses Claude (claude-haiku-4-5) when an API key is present;
                      on ANY error it falls back to the template.

The LLM only writes *wording* and picks among already-safe options — it can never
introduce an unsafe action (the engine validates everything). Default (no key) =
template, so the whole agent runs offline and deterministically.
"""
from typing import Callable


def template_draft(ctx: dict) -> dict:
    """Rule-only, calm bilingual wording. ctx keys depend on the case."""
    if ctx.get("hold_only"):
        train = ctx["train_id"]
        red = ctx["red_id"]
        reasoning = (
            f"Platform {red} is RED ({ctx['red_pct']}%) and rising, but no platform has "
            f"safe spare capacity with a near-term train. Holding {train} to let the "
            f"platform clear; alerting operator. No redirect (fail-safe)."
        )
        return {
            "reasoning": reasoning,
            "announcement_ja": (
                f"列車{train}をご利用のお客様へ。安全のため、この列車をしばらく停車いたします。"
            ),
            "announcement_en": (
                f"Attention passengers for Train {train} — this train will be held briefly "
                f"for your safety and comfort."
            ),
            "redirect_text": "",
            "source": "rule",
        }

    red, target, train = ctx["red_id"], ctx["target_id"], ctx["train_id"]
    minutes = ctx["minutes"]
    reasoning = (
        f"Platform {red} is RED ({ctx['red_pct']}%) and rising; Platform {target} is "
        f"{ctx['target_zone']} ({ctx['target_pct']}%) with a train in {ctx['target_eta']} "
        f"min. Hold {train} +{minutes}m and suggest {target} — redistribute and buy time."
    )
    return {
        "reasoning": reasoning,
        "announcement_ja": (
            f"列車{train}をご利用のお客様へ。安全のため、この列車を約{minutes}分停車いたします。"
            f"ホーム{target}の列車はまもなく到着し、ゆとりがございます。"
        ),
        "announcement_en": (
            f"Attention passengers for Train {train} — this train will be held about "
            f"{minutes} minutes for your safety. The train at Platform {target} is arriving "
            f"shortly with more space available."
        ),
        "redirect_text": (
            f"Platform {red} is busy. If your train allows, Platform {target} has a train "
            f"arriving sooner with more space."
        ),
        "source": "rule",
    }


def _validate(draft: dict) -> dict:
    """Guardrails on any drafted wording before it is used."""
    for key in ("reasoning", "announcement_en"):
        if not draft.get(key):
            raise ValueError(f"draft missing {key}")
    # Calm/non-commanding: reject imperative redirect phrasing.
    lowered = (draft.get("redirect_text") or "").lower()
    for banned in ("go to", "move to platform", "you must"):
        if banned in lowered:
            raise ValueError("redirect wording too commanding")
    draft.setdefault("announcement_ja", "")
    return draft


def claude_draft(ctx: dict, api_key: str) -> dict:
    """Use Claude for nuanced calm wording. Imported lazily; never required."""
    import anthropic  # lazy: only when a key is configured

    client = anthropic.Anthropic(api_key=api_key)
    system = (
        "You are a calm Japanese station-master assistant. Choose only from the SAFE "
        "options provided. Never command passengers; only inform and suggest (丁寧語). "
        "Return strict JSON with keys: reasoning, announcement_ja, announcement_en, "
        "redirect_text. Keep announcements calm and brief."
    )
    msg = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=400,
        temperature=0.2,
        system=system,
        messages=[{"role": "user", "content": str(ctx)}],
    )
    import json
    text = msg.content[0].text
    data = json.loads(text)
    data["source"] = "rule+llm"
    return data


def make_draft(api_key: str | None) -> Callable[[dict], dict]:
    """Return a draft(ctx) function. No key => deterministic template path."""
    if not api_key:
        return lambda ctx: _validate(template_draft(ctx))

    def draft(ctx: dict) -> dict:
        try:
            return _validate(claude_draft(ctx, api_key))
        except Exception:
            return _validate(template_draft(ctx))  # safe fallback

    return draft
