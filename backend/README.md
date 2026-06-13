# Backend — Phase 1 (Foundation & Skeleton)

Privacy-safe FastAPI service: ingests ticket arrivals + CV density, fuses them into
per-platform live state with zone classification, mock train schedule + capped hold, and
WebSocket fan-out. See [../plan/Phase1-Foundation-Backend.md](../plan/Phase1-Foundation-Backend.md).

## Setup
```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate            # fish: . .venv/bin/activate.fish
pip install -r requirements.txt
cp .env.example .env            # optional; defaults work out of the box
```

## Run
```bash
uvicorn app.main:app --reload
# docs:   http://127.0.0.1:8000/docs
# health: http://127.0.0.1:8000/health
```

## Test
```bash
pytest -q
```

## API (Phase 1)
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/api/scan` | `{platform_id, train_id}` | extra/PII keys dropped at edge |
| POST | `/api/density` | `{platform_id, count, density_pct?}` | server computes % if omitted |
| GET  | `/api/state` | — | fused `PlatformState[]` |
| POST | `/api/scheduling/hold` | `{train_id, minutes}` | hard-capped at `HOLD_MAX_MIN` |
| POST | `/api/override` | `{action_id, decision}` | operator hook |
| WS   | `/ws/dashboard` | — | `state_update` / `agent_action` / `override` |
| WS   | `/ws/display/{platform_id}` | — | `signage` / `redirect` |

## Privacy controls (Rules.md §2)
- `ScanIn` accepts only `platform_id` + `train_id`; everything else is discarded.
- Store holds only counts/%/IDs/timestamps — no PII fields exist.
- Every record carries `expires_at`; a background sweep purges it after train departure.

## Layout
```
app/  config models store schedule fusion zones ws deps services main + routers/
tests/  test_zones  test_store_expiry  test_state_endpoint
```
