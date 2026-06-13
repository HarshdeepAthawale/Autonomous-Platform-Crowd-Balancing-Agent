"""LLM fallback + wording guardrails (Phase3 plan §6)."""
import pytest

from agent.llm import _validate, make_draft, template_draft


def test_no_key_uses_template():
    draft = make_draft(None)
    out = draft({"red_id": "A", "red_pct": 92.0, "target_id": "B", "target_zone": "GREEN",
                 "target_pct": 35.0, "target_eta": 4, "train_id": "12045", "minutes": 10})
    assert out["source"] == "rule"
    assert "12045" in out["announcement_en"]
    assert out["announcement_ja"]            # bilingual


def test_template_is_calm_not_commanding():
    out = template_draft({"red_id": "A", "red_pct": 92.0, "target_id": "B",
                          "target_zone": "GREEN", "target_pct": 35.0, "target_eta": 4,
                          "train_id": "12045", "minutes": 10})
    assert "if your train allows" in out["redirect_text"].lower()
    # _validate must accept calm wording
    assert _validate(out)


def test_validate_rejects_commanding_redirect():
    bad = {"reasoning": "x", "announcement_en": "x",
           "redirect_text": "GO TO platform B"}
    with pytest.raises(ValueError):
        _validate(bad)


def test_hold_only_template():
    out = template_draft({"hold_only": True, "red_id": "A", "red_pct": 92.0,
                          "train_id": "12045"})
    assert out["redirect_text"] == ""
    assert "12045" in out["announcement_en"]
