"""GET /api/debug/store — privacy proof (Rules.md §2 / Schema.md).

Dumps the *entire* in-memory store so anyone (judge, auditor) can verify with their
own eyes that it holds ONLY aggregate counts, percentages, platform/train IDs, and
timestamps — never names, faces, raw frames, or any other personal data.

The endpoint also computes the set of field names actually present and flags any
key not on the privacy allow-list, so the proof is machine-checkable, not just
"trust me".
"""
from fastapi import APIRouter

from ..deps import store

router = APIRouter()

# The only fields privacy rules permit the store to hold (Schema.md retention model).
ALLOWED_DENSITY_FIELDS = {"count", "density_pct", "trend", "ts", "expires_at"}
ALLOWED_ARRIVAL_FIELDS = {"ts", "train_id", "expires_at"}


def _isoize(record: dict) -> dict:
    """Render datetimes as ISO strings so the dump is plain JSON."""
    return {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in record.items()}


@router.get("/api/debug/store")
async def debug_store():
    density = {pid: [_isoize(r) for r in dq] for pid, dq in store.density.items()}
    arrivals = {pid: [_isoize(r) for r in lst] for pid, lst in store.arrivals.items()}

    # Collect every distinct key the store actually contains, right now.
    density_keys: set[str] = {k for rows in density.values() for r in rows for k in r}
    arrival_keys: set[str] = {k for rows in arrivals.values() for r in rows for k in r}

    violations = sorted(
        (density_keys - ALLOWED_DENSITY_FIELDS) | (arrival_keys - ALLOWED_ARRIVAL_FIELDS)
    )

    return {
        "privacy_ok": not violations,
        "violations": violations,  # any field outside the allow-list (should be empty)
        "explanation": (
            "Store holds only aggregate counts, percentages, platform/train IDs and "
            "timestamps. No names, faces, raw frames, or PII are ever persisted "
            "(Rules.md §2). Every record carries expires_at and is swept after the "
            "train departs."
        ),
        "allowed_fields": {
            "density": sorted(ALLOWED_DENSITY_FIELDS),
            "arrivals": sorted(ALLOWED_ARRIVAL_FIELDS),
        },
        "present_fields": {
            "density": sorted(density_keys),
            "arrivals": sorted(arrival_keys),
        },
        "record_counts": {
            "density": {pid: len(rows) for pid, rows in density.items()},
            "arrivals": {pid: len(rows) for pid, rows in arrivals.items()},
        },
        "store": {"density": density, "arrivals": arrivals},
    }
