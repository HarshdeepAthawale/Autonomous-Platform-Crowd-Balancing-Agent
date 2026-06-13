"""Publisher payload privacy (Phase2 plan §8) — only numbers, never a frame."""
from cv.publisher import build_payload


def test_payload_only_has_allowed_keys():
    p = build_payload("A", 184, 92.0)
    assert set(p) == {"platform_id", "count", "density_pct"}


def test_payload_without_density_pct():
    p = build_payload("B", 70)
    assert set(p) == {"platform_id", "count"}
    assert p["count"] == 70


def test_payload_has_no_frame_or_pii_fields():
    p = build_payload("A", 100, 50.0)
    for forbidden in ("frame", "image", "name", "phone", "face", "payment"):
        assert forbidden not in p
