"""Zone boundaries + trend, and the privacy guardrail on ScanIn."""
from app.models import ScanIn, Trend, Zone
from app.zones import classify, trend_of


def test_zone_boundaries():
    assert classify(0) == Zone.GREEN
    assert classify(59.9) == Zone.GREEN
    assert classify(60) == Zone.YELLOW
    assert classify(84.9) == Zone.YELLOW
    assert classify(85) == Zone.RED
    assert classify(92) == Zone.RED


def test_trend():
    assert trend_of([]) == Trend.STABLE
    assert trend_of([50]) == Trend.STABLE
    assert trend_of([40, 50, 60, 70, 80]) == Trend.RISING
    assert trend_of([80, 70, 60, 50, 40]) == Trend.FALLING
    assert trend_of([50, 50, 51, 50, 50]) == Trend.STABLE


def test_scan_has_no_pii_fields():
    # Privacy guardrail (Rules.md §2): ScanIn accepts ONLY these two fields.
    assert set(ScanIn.model_fields) == {"platform_id", "train_id"}


def test_scan_drops_extra_pii_keys():
    s = ScanIn.model_validate({
        "platform_id": "A", "train_id": "12045",
        "name": "Harshdeep", "phone": "99999", "payment": "card",
    })
    dumped = s.model_dump()
    assert dumped == {"platform_id": "A", "train_id": "12045"}
    assert "name" not in dumped and "phone" not in dumped
