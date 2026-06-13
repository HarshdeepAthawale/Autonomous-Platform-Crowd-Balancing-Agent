"""In-memory live state + rolling time-series with TTL auto-expiry.

Privacy (Rules.md §2): stores only counts, percentages, platform/train IDs, and
timestamps. Every record carries `expires_at`; `sweep()` purges expired entries.
A `clock` callable is injectable so expiry is deterministically testable.
"""
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Callable


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Store:
    def __init__(self, clock: Callable[[], datetime] = utcnow, history: int = 120):
        self.clock = clock
        self._history = history
        # platform_id -> deque[{count, density_pct, trend, ts, expires_at}]
        self.density: dict[str, deque] = defaultdict(lambda: deque(maxlen=history))
        # platform_id -> list[{ts, train_id, expires_at}]  (aggregate, not per-person)
        self.arrivals: dict[str, list] = defaultdict(list)

    # ---- writes ----
    def add_density(self, platform_id, count, density_pct, trend, expires_at):
        self.density[platform_id].append({
            "count": count,
            "density_pct": density_pct,
            "trend": getattr(trend, "value", trend),
            "ts": self.clock(),
            "expires_at": expires_at,
        })

    def add_arrival(self, platform_id, train_id, expires_at):
        self.arrivals[platform_id].append({
            "ts": self.clock(),
            "train_id": train_id,
            "expires_at": expires_at,
        })

    # ---- reads ----
    def latest_density(self, platform_id):
        dq = self.density.get(platform_id)
        return dq[-1] if dq else None

    def density_history(self, platform_id) -> list[float]:
        return [d["density_pct"] for d in self.density.get(platform_id, [])]

    def arrival_count(self, platform_id) -> int:
        return len(self.arrivals.get(platform_id, []))

    def arrival_rate_per_min(self, platform_id, window_min: int = 5) -> float:
        now = self.clock()
        cutoff = now - timedelta(minutes=window_min)
        recent = [a for a in self.arrivals.get(platform_id, []) if a["ts"] >= cutoff]
        return round(len(recent) / window_min, 2)

    # ---- maintenance ----
    def sweep(self) -> int:
        """Purge expired records. Returns number of records removed."""
        now = self.clock()
        removed = 0
        for pid in list(self.arrivals):
            before = len(self.arrivals[pid])
            self.arrivals[pid] = [a for a in self.arrivals[pid] if a["expires_at"] > now]
            removed += before - len(self.arrivals[pid])
        for pid in list(self.density):
            dq = self.density[pid]
            kept = [d for d in dq if d["expires_at"] > now]
            removed += len(dq) - len(kept)
            dq.clear()
            dq.extend(kept)
        return removed
