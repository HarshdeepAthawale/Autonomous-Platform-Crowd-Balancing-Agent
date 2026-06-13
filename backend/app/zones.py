"""Zone classification + trend — the deterministic rules (TechSpecifications.md §4)."""
from .config import settings
from .models import Trend, Zone


def classify(density_pct: float) -> Zone:
    """Green <60% / Yellow 60-85% / Red >85% (thresholds from config)."""
    if density_pct < settings.green_max:
        return Zone.GREEN
    if density_pct < settings.yellow_max:
        return Zone.YELLOW
    return Zone.RED


def trend_of(history: list[float]) -> Trend:
    """Rising/falling/stable from the last few density readings."""
    if len(history) < 2:
        return Trend.STABLE
    window = history[-min(len(history), 5):]
    delta = window[-1] - window[0]
    if delta > 2:
        return Trend.RISING
    if delta < -2:
        return Trend.FALLING
    return Trend.STABLE
