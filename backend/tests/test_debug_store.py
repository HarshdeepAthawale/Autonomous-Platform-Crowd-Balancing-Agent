"""Privacy proof (Tracker 5.3 / Rules.md §2).

Asserts GET /api/debug/store exposes only allow-listed aggregate fields — no name,
face, image, frame, or other PII field can ever appear in the store.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Fields that would indicate a privacy violation if ever present.
FORBIDDEN_SUBSTRINGS = ("name", "face", "image", "frame", "photo", "email", "phone", "id_card")


def test_store_holds_only_allowed_fields():
    # Generate some real data first.
    client.post("/api/density", json={"platform_id": "A", "count": 120})
    client.post("/api/scan", json={"platform_id": "A", "train_id": "12045"})

    body = client.get("/api/debug/store").json()

    assert body["privacy_ok"] is True
    assert body["violations"] == []

    present = set(body["present_fields"]["density"]) | set(body["present_fields"]["arrivals"])
    for field in present:
        for bad in FORBIDDEN_SUBSTRINGS:
            assert bad not in field.lower(), f"privacy-sensitive field leaked: {field}"


def test_no_raw_frame_or_pii_in_stored_data():
    import json

    client.post("/api/density", json={"platform_id": "B", "count": 80})
    body = client.get("/api/debug/store").json()
    # Scan only the actual stored records (not the human-readable explanation prose).
    raw = json.dumps(body["store"]).lower()
    for bad in FORBIDDEN_SUBSTRINGS:
        assert bad not in raw, f"forbidden token {bad!r} present in stored data"
