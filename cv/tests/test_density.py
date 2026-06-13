"""DensityTracker math + smoothing + trend (Phase2 plan §8 unit tests)."""
from cv.density import DensityTracker


def test_density_pct_from_count():
    t = DensityTracker(capacity=200, window=1)
    assert t.update(184)["density_pct"] == 92.0
    t2 = DensityTracker(capacity=200, window=1)
    assert t2.update(120)["density_pct"] == 60.0


def test_density_caps_at_100():
    t = DensityTracker(capacity=100, window=1)
    assert t.update(250)["density_pct"] == 100.0


def test_rolling_average_smooths_jitter():
    t = DensityTracker(capacity=200, window=4)
    # A single spike should be damped by the rolling window.
    t.update(20)
    t.update(20)
    t.update(20)
    out = t.update(180)  # spike
    # raw spike would be 90%; smoothed average (20+20+20+180)/4 = 60 -> 30%
    assert out["count"] == 60
    assert out["density_pct"] == 30.0


def test_trend_transitions():
    t = DensityTracker(capacity=200, window=10)
    assert t.update(10)["trend"] == "stable"      # <4 samples
    for c in (20, 30, 40):
        out = t.update(c)
    assert out["trend"] == "rising"

    t2 = DensityTracker(capacity=200, window=10)
    for c in (100, 90, 80, 70):
        out = t2.update(c)
    assert out["trend"] == "falling"

    t3 = DensityTracker(capacity=200, window=10)
    for c in (50, 50, 51, 50):
        out = t3.update(c)
    assert out["trend"] == "stable"
