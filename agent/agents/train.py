"""Train Agent (parallel layer) — schedule view + holdability.

Answers: which platform has which next train, and can it be held (exists and not
already held — no-thrash)? Pure, no I/O.
"""
from ..models import TrainReport


def analyze(snapshot: list[dict]) -> TrainReport:
    next_train = {p["platform_id"]: p.get("next_train") for p in snapshot}
    holdable = {
        pid: bool(t) and not t.get("held", False)
        for pid, t in next_train.items()
    }
    return TrainReport(next_train=next_train, holdable=holdable)
