"""Synthetic worked-example arc (Phase2 plan §8 fallback test).

Asserts the deterministic curve drives Platform A into RED then rebalances it
below YELLOW, while Platform B stays GREEN — matching AppFlow.md §4.
"""
from cv.synthetic import ScenarioGenerator

CAP = {"A": 200, "B": 200}
GREEN_MAX, YELLOW_MAX = 60.0, 85.0


def test_platform_a_starts_green():
    gen = ScenarioGenerator(CAP)
    assert gen.density_pct_at(0)["A"] < GREEN_MAX


def test_platform_a_reaches_red_during_plateau():
    gen = ScenarioGenerator(CAP)
    a = gen.density_pct_at(35)["A"]   # plateau window
    assert a > YELLOW_MAX             # RED zone
    assert a == 92.0


def test_platform_a_rebalances_below_yellow_after_hold():
    gen = ScenarioGenerator(CAP)
    a = gen.density_pct_at(80)["A"]   # after decay
    assert a < YELLOW_MAX             # back under RED threshold
    # Phase 5 DoD: rebalanced below YELLOW within the hold window
    assert a < GREEN_MAX or a < YELLOW_MAX


def test_platform_b_stays_green_throughout():
    gen = ScenarioGenerator(CAP)
    for t in (0, 25, 45, 75, 100):
        assert gen.density_pct_at(t)["B"] < GREEN_MAX


def test_counts_match_capacity_calibration():
    gen = ScenarioGenerator(CAP)
    counts = gen.counts_at(35)        # A at 92%
    assert counts["A"] == round(0.92 * 200)   # 184
