"""Mock train schedule + hold logic (Schema.md §2.4).

The hold is the agent's advisory action surface. Holds are CAPPED at
settings.hold_max_min and reversible (Rules.md §1.3).
"""
from datetime import datetime, timedelta, timezone
from typing import Callable

from .config import settings


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Schedule:
    def __init__(self, clock: Callable[[], datetime] = utcnow, seed: bool = True):
        self.clock = clock
        self.trains: dict[str, dict] = {}
        if seed:
            self._seed()

    def _seed(self):
        # Worked-example seed (AppFlow.md §4): A train sooner, B train slightly later.
        now = self.clock()
        self.add("12045", "A", now + timedelta(minutes=6))
        self.add("12046", "B", now + timedelta(minutes=9))

    def add(self, train_id: str, platform_id: str, eta: datetime):
        self.trains[train_id] = {
            "train_id": train_id,
            "platform_id": platform_id,
            "scheduled_eta": eta,
            "current_eta": eta,
            "held": False,
            "hold_min": 0,
            "departed": False,
        }

    def hold(self, train_id: str, minutes: int) -> dict:
        minutes = max(0, min(minutes, settings.hold_max_min))  # hard cap
        t = self.trains[train_id]
        t["current_eta"] = t["current_eta"] + timedelta(minutes=minutes)
        t["held"] = True
        t["hold_min"] = minutes
        return t

    def cancel_hold(self, train_id: str) -> dict:
        t = self.trains[train_id]
        t["current_eta"] = t["current_eta"] - timedelta(minutes=t["hold_min"])
        t["held"] = False
        t["hold_min"] = 0
        return t

    def next_train_for(self, platform_id: str) -> dict | None:
        upcoming = [
            t for t in self.trains.values()
            if t["platform_id"] == platform_id and not t["departed"]
        ]
        return min(upcoming, key=lambda t: t["current_eta"], default=None)

    def eta_min(self, train: dict, now: datetime | None = None) -> float:
        now = now or self.clock()
        return max(0.0, round((train["current_eta"] - now).total_seconds() / 60, 1))

    def expiry_for(self, platform_id: str) -> datetime:
        """Records expire retention window after the platform's next train departs."""
        now = self.clock()
        nt = self.next_train_for(platform_id)
        base = nt["current_eta"] if nt else now
        return max(base, now) + timedelta(minutes=settings.retention_after_departure_min)
