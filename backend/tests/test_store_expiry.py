"""TTL auto-expiry with an injectable clock (deterministic fast-forward)."""
from datetime import datetime, timedelta, timezone

from app.store import Store


class FakeClock:
    def __init__(self, start: datetime):
        self.now = start

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **kw):
        self.now += timedelta(**kw)


def test_records_expire_after_ttl():
    clock = FakeClock(datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc))
    store = Store(clock=clock)

    expires = clock.now + timedelta(minutes=60)
    store.add_arrival("A", "12045", expires_at=expires)
    store.add_density("A", 100, 50.0, "rising", expires_at=expires)

    assert store.arrival_count("A") == 1
    assert store.latest_density("A") is not None

    # Before expiry: nothing purged.
    clock.advance(minutes=30)
    assert store.sweep() == 0
    assert store.arrival_count("A") == 1

    # After expiry: both records purged.
    clock.advance(minutes=31)
    removed = store.sweep()
    assert removed == 2
    assert store.arrival_count("A") == 0
    assert store.latest_density("A") is None


def test_arrival_rate_window():
    clock = FakeClock(datetime(2026, 6, 14, 12, 0, tzinfo=timezone.utc))
    store = Store(clock=clock)
    far = clock.now + timedelta(hours=2)
    for _ in range(10):
        store.add_arrival("A", "12045", expires_at=far)
    # 10 arrivals over a 5-min window => 2.0 per minute
    assert store.arrival_rate_per_min("A", window_min=5) == 2.0
