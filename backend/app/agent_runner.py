"""In-process agent runner — hosts the decision engine inside the backend.

Single-process for demo reliability (no self-HTTP): it perceives via build_states,
decides via agent.engine, then applies side effects directly on the schedule +
WebSocket manager. The documented LangGraph form (agent/graph.py) wraps the same
engine functions and is parity-tested.
"""
import asyncio
import sys
from collections import deque
from pathlib import Path

# Make the top-level `agent` package importable regardless of launch dir.
_ROOT = Path(__file__).resolve().parents[2]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from agent.agents.supervisor import run_tick as decide_tick   # noqa: E402
from agent.llm import make_draft        # noqa: E402
from agent.types import Policy          # noqa: E402

from .config import settings            # noqa: E402
from .deps import schedule, store       # noqa: E402
from .fusion import build_states        # noqa: E402
from .ws import manager                 # noqa: E402

POLICY = Policy(
    hold_max_min=settings.hold_max_min,
    grace_min=settings.grace_min,
    yellow_max=settings.yellow_max,
)
# No CLAUDE_API_KEY => deterministic template wording (rule-only).
DRAFT = make_draft(settings.claude_api_key or None)

_history: deque[dict] = deque(maxlen=50)


def _snapshot() -> list[dict]:
    return [s.model_dump(mode="json") for s in build_states(store, schedule)]


def _update_outcomes(snap: list[dict]):
    """Log & Learn: mark a past decision normalized once its platform clears RED."""
    by = {p["platform_id"]: p for p in snap}
    for d in _history:
        if d.get("outcome") is not None:
            continue
        p = by.get(d["trigger"]["platform_id"])
        if p and p["density_pct"] < POLICY.yellow_max:
            d["outcome"] = {
                "normalized": True,
                "density_after_pct": p["density_pct"],
                "measured_at": p["ts"],
            }


async def run_tick():
    snap = _snapshot()
    _update_outcomes(snap)
    result = decide_tick(snap, POLICY, draft=DRAFT)

    if result.side_effects.hold:
        schedule.hold(result.side_effects.hold.train_id, result.side_effects.hold.minutes)
    for msg in result.side_effects.dashboard_msgs:
        await manager.broadcast("dashboard", msg)
    for pid, msg in result.side_effects.display_msgs:
        await manager.broadcast(f"display:{pid}", msg)
    if result.decision:
        _history.append(result.decision)
    return result


def decisions() -> list[dict]:
    return list(_history)


async def agent_loop():
    """Background autonomous loop — ticks every loop_period_sec."""
    while True:
        await asyncio.sleep(settings.loop_period_sec)
        try:
            await run_tick()
        except Exception as e:  # never let the loop die
            print("[agent] tick error:", e)
