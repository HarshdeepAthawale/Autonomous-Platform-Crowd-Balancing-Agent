"""Shared value types for the hierarchical multi-agent system.

Pure data, no I/O. Covers the policy knobs, the per-agent reports produced by the
parallel layer (Crowd / Train / Safety), the decision output, and the side
effects the Action Agent emits for the runner to execute.
"""
from dataclasses import dataclass, field


@dataclass
class Policy:
    hold_max_min: int = 10              # hard cap on a hold (Rules.md §1.3)
    grace_min: int = 5                  # target train may arrive this much later
    safe_target_max_pct: float = 75.0   # target must have genuine spare capacity
    yellow_max: float = 85.0            # used to judge outcome normalization


# ---- Plan parts (Decision Agent output) ------------------------------------

@dataclass
class Hold:
    train_id: str
    minutes: int


@dataclass
class Redirect:
    from_platform: str
    to_platform: str
    mode: str = "suggestion"            # never "command" (Rules.md §1.5)


@dataclass
class Plan:
    hold: Hold | None
    redirect: Redirect | None
    announce: bool


# ---- Reports from the parallel agent layer ---------------------------------

@dataclass
class CrowdReport:
    """Crowd Agent — who is crowded and getting worse."""
    crowded_rising: list[str]              # platforms RED and rising
    density: dict[str, float]
    trend: dict[str, str]


@dataclass
class TrainReport:
    """Train Agent — schedule view + what can be held."""
    next_train: dict[str, dict | None]     # platform_id -> train slice
    holdable: dict[str, bool]              # has a train and not already held


@dataclass
class SafetyReport:
    """Safety Agent — risk classification + fail-safe signal."""
    zones: dict[str, str]
    breaches: list[str]                    # platforms in RED
    failsafe: bool                         # missing/stale data -> take no action
    reason: str


@dataclass
class DecisionOutput:
    """Decision Agent — whether to act and the validated plan."""
    act: bool
    reason: str
    red_p: dict | None = None
    target: dict | None = None
    plan: Plan | None = None


# ---- Action Agent output ----------------------------------------------------

@dataclass
class SideEffects:
    """What the runner must execute (engine itself does no I/O)."""
    hold: Hold | None = None
    dashboard_msgs: list[dict] = field(default_factory=list)        # -> /ws/dashboard
    display_msgs: list[tuple[str, dict]] = field(default_factory=list)  # (pid, msg)


@dataclass
class TickResult:
    action: bool
    reason: str
    decision: dict | None = None
    side_effects: SideEffects = field(default_factory=SideEffects)
