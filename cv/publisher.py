"""Publish density readings to the backend (Phase2 plan §5.4).

PRIVACY: the payload carries ONLY platform_id + count (+ optional density_pct).
A frame is never serialized, sent, or stored — just a number.
"""
import httpx

from .config import settings


def build_payload(platform_id: str, count: int, density_pct: float | None = None) -> dict:
    payload = {"platform_id": platform_id, "count": int(count)}
    if density_pct is not None:
        payload["density_pct"] = float(density_pct)
    return payload


class Publisher:
    def __init__(self, base_url: str | None = None, timeout: float = 2.0):
        self.base = (base_url or settings.backend_url).rstrip("/")
        self.client = httpx.Client(timeout=timeout)

    def send(self, platform_id: str, count: int, density_pct: float | None = None) -> dict:
        r = self.client.post(
            f"{self.base}/api/density",
            json=build_payload(platform_id, count, density_pct),
        )
        r.raise_for_status()
        return r.json()

    def close(self):
        self.client.close()
