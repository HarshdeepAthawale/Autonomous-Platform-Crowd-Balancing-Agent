"""Shared snapshot fixtures mirroring backend GET /api/state output."""
import pytest

from agent.types import Policy


def platform(pid, density_pct, zone, trend, train_id, eta_min, held=False, capacity=200):
    return {
        "platform_id": pid,
        "density_pct": density_pct,
        "count": round(density_pct / 100 * capacity),
        "trend": trend,
        "zone": zone,
        "arrival_rate_per_min": 5.0,
        "next_train": {"train_id": train_id, "eta_min": eta_min, "held": held, "hold_min": 0},
        "capacity": capacity,
        "ts": "2026-06-14T12:04:30Z",
    }


@pytest.fixture
def policy():
    return Policy()


@pytest.fixture
def worked_example():
    """AppFlow.md §4: A=92% RED rising, B=35% GREEN, B-train 9m vs A-train 6m."""
    return [
        platform("A", 92.0, "RED", "rising", "12045", 6.0),
        platform("B", 35.0, "GREEN", "stable", "12046", 9.0),
    ]
