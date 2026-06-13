"""Video sources — webcam or clip (Phase2 plan §5.3).

PRIVACY: opens capture for reading frames into memory only. No VideoWriter, no
frame is ever written to disk.
"""
import cv2


def open_source(spec: str):
    """Open a webcam (numeric spec like "0"/"1") or a video file (path)."""
    src = int(spec) if str(spec).isdigit() else spec
    cap = cv2.VideoCapture(src)
    if not cap.isOpened():
        raise RuntimeError(f"could not open video source: {spec!r}")
    return cap


def resize_for_speed(frame, width: int):
    """Downscale a frame in-memory to hit the latency budget (not persisted)."""
    h, w = frame.shape[:2]
    if w <= width:
        return frame
    scale = width / w
    return cv2.resize(frame, (width, int(h * scale)))
