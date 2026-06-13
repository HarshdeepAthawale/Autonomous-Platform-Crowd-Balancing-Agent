"""Count -> density %, rolling-average smoothing, and trend (Phase2 plan §5.2).

Pure module — no heavy deps. Suppresses single-frame jitter so the agent sees a
stable signal.
"""
from collections import deque


class DensityTracker:
    def __init__(self, capacity: int, window: int = 10):
        self.capacity = capacity
        self.buf: deque[int] = deque(maxlen=window)

    def update(self, count: int) -> dict:
        self.buf.append(count)
        smooth = sum(self.buf) / len(self.buf)
        pct = min(100.0, round(smooth / self.capacity * 100, 1))
        return {
            "count": round(smooth),
            "density_pct": pct,
            "trend": self._trend(),
        }

    def _trend(self) -> str:
        if len(self.buf) < 4:
            return "stable"
        delta = self.buf[-1] - self.buf[0]
        if delta > 3:
            return "rising"
        if delta < -3:
            return "falling"
        return "stable"
