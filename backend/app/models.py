"""Pydantic models — mirror Schema.md exactly.

PRIVACY GUARDRAIL (Rules.md §2): no model here may contain a name, phone, face,
payment, or ticket-serial field. `ScanIn` accepts ONLY platform_id + train_id; any
extra keys a client sends are dropped at the edge (pydantic `extra="ignore"`).
"""
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class Zone(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    RED = "RED"


class Trend(str, Enum):
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"


# ---- Stored entities (Schema.md §2) -----------------------------------------

class ArrivalEvent(BaseModel):
    """Aggregated gate scan record (Schema.md §2.1).
    No per-passenger row ever exists — counts are aggregated per platform+train.
    """
    platform_id: str
    train_id: str
    ts: datetime
    expires_at: datetime


class DensityReading(BaseModel):
    """Per-platform headcount snapshot from the CV worker (Schema.md §2.2).
    No raw frames stored — only the resulting number.
    """
    platform_id: str
    count: int
    density_pct: float
    trend: Trend
    ts: datetime
    expires_at: datetime


# ---- Inbound request bodies -------------------------------------------------

class ScanIn(BaseModel):
    # Whitelist: ONLY these two fields. Extra keys (PII) are silently discarded.
    model_config = ConfigDict(extra="ignore")
    platform_id: str
    train_id: str


class DensityIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    platform_id: str
    count: int
    density_pct: float | None = None  # server computes from capacity if omitted


class HoldIn(BaseModel):
    train_id: str
    minutes: int


class OverrideIn(BaseModel):
    action_id: str
    decision: str  # e.g. "cancel"


# ---- Derived / outbound -----------------------------------------------------

class NextTrain(BaseModel):
    train_id: str
    eta_min: float
    held: bool = False
    hold_min: int = 0


class PlatformState(BaseModel):
    platform_id: str
    density_pct: float
    count: int
    trend: Trend
    zone: Zone
    arrival_rate_per_min: float
    next_train: NextTrain | None
    capacity: int
    ts: datetime
