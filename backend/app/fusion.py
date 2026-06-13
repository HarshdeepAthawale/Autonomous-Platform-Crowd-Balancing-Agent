"""Fuse arrivals + density + schedule into per-platform PlatformState (TechSpec §3.3)."""
from .config import settings
from .models import NextTrain, PlatformState
from .zones import classify, trend_of


def build_states(store, schedule) -> list[PlatformState]:
    now = schedule.clock()
    states: list[PlatformState] = []

    for pid in settings.platform_capacity:
        latest = store.latest_density(pid)
        density_pct = latest["density_pct"] if latest else 0.0
        count = latest["count"] if latest else 0
        trend = trend_of(store.density_history(pid))
        zone = classify(density_pct)

        nt = schedule.next_train_for(pid)
        next_train = None
        if nt:
            next_train = NextTrain(
                train_id=nt["train_id"],
                eta_min=schedule.eta_min(nt, now),
                held=nt["held"],
                hold_min=nt["hold_min"],
            )

        states.append(PlatformState(
            platform_id=pid,
            density_pct=density_pct,
            count=count,
            trend=trend,
            zone=zone,
            arrival_rate_per_min=store.arrival_rate_per_min(pid),
            next_train=next_train,
            capacity=settings.platform_capacity[pid],
            ts=now,
        ))

    return states
