"""Announcement / reasoning drafting (Phase3 plan §6).

Three sources:
  • template_draft  — deterministic, calm, bilingual (Design.md §6). Always works.
  • groq_draft      — uses Groq (Llama 3 70B) free tier; OpenAI-compatible API.
  • claude_draft    — uses Claude (claude-haiku-4-5) when an API key is present;

On ANY error all LLM paths fall back to the template.

The LLM only writes *wording* and picks among already-safe options — it can never
introduce an unsafe action (the engine validates everything). Default (no key) =
template, so the whole agent runs offline and deterministically.
"""
import json
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
            "announcement_hi": (
                f"ट्रेन {train} के यात्रियों का ध्यान — आपकी सुरक्षा के लिए यह ट्रेन कुछ समय के लिए रोकी जा रही है।"
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
        "announcement_hi": (
            f"ट्रेन {train} के यात्रियों का ध्यान — आपकी सुरक्षा के लिए यह ट्रेन लगभग {minutes} मिनट के लिए रोकी जा रही है। "
            f"प्लेटफ़ॉर्म {target} पर ट्रेन जल्द आ रही है और वहाँ जगह उपलब्ध है।"
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
    draft.setdefault("announcement_hi", "")
    return draft


SYSTEM_PROMPT = (
    "You are a calm Japanese railway station-master assistant for a crowd-balancing system. "
    "You receive context about a platform overcrowding situation and must produce bilingual "
    "announcements and reasoning.\n\n"
    "RULES:\n"
    "- Never command or order passengers. Only inform and suggest (polite 丁寧語 in Japanese).\n"
    "- The redirect is always a SUGGESTION, never an order.\n"
    "- Keep announcements calm, brief, and reassuring.\n"
    "- Japanese text must be natural, grammatically correct, and use polite form (です/ます).\n\n"
    "Return STRICT JSON with exactly these keys:\n"
    "{\n"
    '  "reasoning": "plain English explanation of why the agent is acting",\n'
    '  "announcement_ja": "Japanese announcement (polite, natural, 丁寧語)",\n'
    '  "announcement_en": "English announcement (calm, brief)",\n'
    '  "redirect_text": "suggestion text for passengers (calm, advisory, never commanding)"\n'
    "}"
)


def template_status_green(ctx: dict) -> dict:
    """All-clear status — all platforms GREEN."""
    return {
        "reasoning": "all platforms within safe limits — status announcement",
        "announcement_ja": "現在、すべてのホームにゆとりがございます。通常通り運行しております。",
        "announcement_hi": "वर्तमान में सभी प्लेटफ़ॉर्म पर जगह उपलब्ध है। सेवा सामान्य रूप से चल रही है।",
        "announcement_en": "All platforms currently have available space. Service is running normally.",
        "source": "rule",
    }


def template_status_yellow(ctx: dict) -> dict:
    """Filling-up advisory — some platforms YELLOW."""
    plats = ctx.get("yellow_platforms", [])
    plat_str = ", ".join(plats)
    if len(plats) == 1:
        return {
            "reasoning": f"platform {plat_str} is YELLOW — advisory announcement",
            "announcement_ja": f"ホーム{plat_str}は混み合ってきています。お時間に余裕のある方は、他のホームをご利用ください。",
            "announcement_hi": f"प्लेटफ़ॉर्म {plat_str} पर भीड़ बढ़ रही है। यदि समय हो तो कृपया किसी अन्य प्लेटफ़ॉर्म का उपयोग करें।",
            "announcement_en": f"Platform {plat_str} is filling up. If your schedule allows, please consider using an alternative platform.",
            "source": "rule",
        }
    return {
        "reasoning": f"platforms {plat_str} are YELLOW — advisory announcement",
        "announcement_ja": f"ホーム{plat_str}は混み合ってきています。お時間に余裕のある方は、他のホームをご利用ください。",
        "announcement_hi": f"प्लेटफ़ॉर्म {plat_str} पर भीड़ बढ़ रही है। यदि समय हो तो कृपया किसी अन्य प्लेटफ़ॉर्म का उपयोग करें।",
        "announcement_en": f"Platforms {plat_str} are filling up. If your schedule allows, please consider using alternative platforms.",
        "source": "rule",
    }


def template_status_crowded(ctx: dict) -> dict:
    """Crowded advisory — RED platforms exist but agent cannot act."""
    plats = ctx.get("red_platforms", [])
    plat_str = ", ".join(plats)
    return {
        "reasoning": f"platform{'s' if len(plats) != 1 else ''} {plat_str} RED but no action possible — status announcement",
        "announcement_ja": f"ホーム{plat_str}は大変混雑しています。安全のため、係員の指示に従ってください。",
        "announcement_hi": f"प्लेटफ़ॉर्म {plat_str} पर बहुत भीड़ है। कृपया अपनी सुरक्षा के लिए कर्मचारियों के निर्देशों का पालन करें।",
        "announcement_en": f"Platform{'s' if len(plats) != 1 else ''} {plat_str} {'are' if len(plats) != 1 else 'is'} very crowded. Please follow staff instructions for your safety.",
        "source": "rule",
    }


def template_failsafe(ctx: dict) -> dict:
    """No-data / fail-safe situation."""
    return {
        "reasoning": "no platform data — fail-safe status announcement",
        "announcement_ja": "現在、システムがデータを待機しています。しばらくお待ちください。",
        "announcement_hi": "सिस्टम प्लेटफ़ॉर्म डेटा की प्रतीक्षा कर रहा है। कृपया प्रतीक्षा करें।",
        "announcement_en": "The system is waiting for platform data. Please stand by.",
        "source": "rule",
    }


def groq_draft(ctx: dict, api_key: str) -> dict:
    """Use Groq (Llama 3 70B) free tier for calm wording. OpenAI-compatible API."""
    import httpx

    if ctx.get("hold_only"):
        user_msg = (
            f"A railway crowd-balancing agent must act on this situation:\n"
            f"- Platform {ctx['red_id']} is RED ({ctx['red_pct']}%) and rising\n"
            f"- No platform has safe spare capacity for a redirect\n"
            f"- Action: hold train {ctx['train_id']} only, alert operator\n"
            f"Produce bilingual announcements explaining the hold. No redirect suggestion."
        )
    else:
        user_msg = (
            f"A railway crowd-balancing agent must act on this situation:\n"
            f"- Platform {ctx['red_id']} is RED ({ctx['red_pct']}%) and rising — train {ctx['train_id']} held +{ctx['minutes']} min\n"
            f"- Platform {ctx['target_id']} is {ctx['target_zone']} ({ctx['target_pct']}%) with train in {ctx['target_eta']} min\n"
            f"- Action: hold {ctx['train_id']} +{ctx['minutes']} min, suggest redirect to {ctx['target_id']}\n"
            f"Produce bilingual announcements and reasoning. The redirect text is a SUGGESTION for passengers at {ctx['red_id']}."
        )

    resp = httpx.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            "max_tokens": 400,
            "temperature": 0.2,
        },
        timeout=10.0,
    )
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    data = json.loads(text)
    data["source"] = "rule+llm"
    # Fill in empty JA from template as fallback
    if not data.get("announcement_ja"):
        tpl = template_draft(ctx)
        data["announcement_ja"] = tpl["announcement_ja"]
    return data


def claude_draft(ctx: dict, api_key: str) -> dict:
    """Use Claude for nuanced calm wording. Imported lazily; never required."""
    import anthropic  # lazy: only when a key is configured

    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=400,
        temperature=0.2,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": str(ctx)}],
    )
    text = msg.content[0].text
    # Strip markdown code fences if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    data = json.loads(text)
    data["source"] = "rule+llm"
    return data


def make_draft(api_key: str | None, provider: str = "groq") -> Callable[[dict], dict]:
    """Return a draft(ctx) function. No key => deterministic template path.

    provider: "groq" (default, free tier) or "claude" (needs anthropic key).
    """
    if not api_key:
        return lambda ctx: _validate(template_draft(ctx))

    draft_fn = groq_draft if provider == "groq" else claude_draft

    def draft(ctx: dict) -> dict:
        try:
            return _validate(draft_fn(ctx, api_key))
        except Exception:
            return _validate(template_draft(ctx))  # safe fallback

    return draft
