"""Synthetic-density fallback (Phase2 plan §5.5) — the PRIMARY demo path.

Produces a deterministic worked-example arc (AppFlow.md §4) with no camera or
YOLO required, so the demo never depends on hardware or lighting:

  Platform A:  GREEN -> ramps to ~92% RED -> (agent acts) -> decays below YELLOW
  Platform B:  stays GREEN (~35%) throughout

This module imports NO heavy deps, so the full demo runs on any laptop.
"""
import math
import time

from .config import settings
from .publisher import Publisher


class ScenarioGenerator:
    """Pure, deterministic density curve as a function of elapsed seconds.

    Timeline (seconds):
      A:  0–25 ramp 10%→92% · 25–45 plateau ~92% (RED) · 45–75 decay 92%→55% · 75+ ~55%
      B:  steady ~35% with gentle noise
    """

    def __init__(self, capacity: dict[str, int]):
        self.capacity = capacity

    def density_pct_at(self, elapsed: float) -> dict[str, float]:
        # Platform A — rise, plateau (RED zone), then rebalanced decay below YELLOW
        if elapsed < 25:
            a = 10 + (92 - 10) * (elapsed / 25)
        elif elapsed < 45:
            a = 92.0
        elif elapsed < 75:
            a = 92 - (92 - 55) * ((elapsed - 45) / 30)
        else:
            a = 55.0

        # Platform B — steady GREEN with gentle ±3% noise
        b = 35 + 3 * math.sin(elapsed / 4)

        return {"A": round(a, 1), "B": round(max(0.0, b), 1)}

    def counts_at(self, elapsed: float) -> dict[str, int]:
        """Density % -> count (backend recomputes % from count via same capacity)."""
        pct = self.density_pct_at(elapsed)
        out: dict[str, int] = {}
        for pid, cap in self.capacity.items():
            p = pct.get(pid, 0.0)
            out[pid] = round(p / 100 * cap)
        return out


def run_synthetic(duration: float | None = None, interval: float | None = None):
    """Loop: emit synthetic counts to the backend until duration elapses."""
    interval = interval or settings.publish_interval_sec
    pub = Publisher()
    gen = ScenarioGenerator(settings.platform_capacity)
    t0 = time.monotonic()
    print(f"[cv/synthetic] worked-example feed -> {settings.backend_url} "
          f"(interval={interval}s)")
    try:
        while True:
            elapsed = time.monotonic() - t0
            for pid, count in gen.counts_at(elapsed).items():
                try:
                    pub.send(pid, count)
                except Exception as e:  # backend not up yet / transient
                    print(f"[cv/synthetic] publish failed for {pid}: {e}")
            if duration is not None and elapsed >= duration:
                break
            time.sleep(interval)
    finally:
        pub.close()


if __name__ == "__main__":
    run_synthetic()
