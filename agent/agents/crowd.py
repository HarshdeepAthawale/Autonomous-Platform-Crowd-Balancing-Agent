"""Crowd Agent (parallel layer) — analyzes density + trend per platform.

Answers: which platforms are crowded and getting worse? Pure, fast, no I/O.
"""
from ..types import CrowdReport


def analyze(snapshot: list[dict]) -> CrowdReport:
    density = {p["platform_id"]: p.get("density_pct", 0.0) for p in snapshot}
    trend = {p["platform_id"]: p.get("trend", "stable") for p in snapshot}
    crowded_rising = [
        p["platform_id"]
        for p in snapshot
        if p.get("zone") == "RED" and p.get("trend") == "rising"
    ]
    return CrowdReport(crowded_rising=crowded_rising, density=density, trend=trend)
