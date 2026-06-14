"""Privacy guarantee (Phase2 plan §2 exit criterion): no frame is ever written.

Greps the cv/ source for any frame-persisting call. Must find none.
"""
import pathlib

CV_DIR = pathlib.Path(__file__).resolve().parent.parent
# Match actual CALLS ("token("), not doc/comment mentions of the token name.
FORBIDDEN = ("imwrite(", "VideoWriter(", "imencode(")


def test_no_frame_writing_calls_in_cv_source():
    offenders = []
    # Only OUR modules (top-level cv/*.py) — not tests, not installed libs in .venv.
    for py in CV_DIR.glob("*.py"):
        text = py.read_text()
        for token in FORBIDDEN:
            if token in text:
                offenders.append(f"{py.name}:{token}")
    assert not offenders, f"frame-persisting calls found: {offenders}"
