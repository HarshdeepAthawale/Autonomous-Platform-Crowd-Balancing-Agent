"""Real CV worker (Phase2 plan §5.4): frame -> detect -> smooth -> publish.

Heavy deps (ultralytics/opencv) are imported lazily and are injectable, so the
worker's control flow (frame stride, publish throttling, clip looping) is unit-
testable with fakes — no YOLO or camera required. One worker thread per platform.

Frames are processed in memory and discarded; only the smoothed count + density %
are published to the backend.
"""
import threading
import time

from .config import settings
from .density import DensityTracker
from .publisher import Publisher


def _default_counter():
    from .detector import PersonCounter  # lazy: imports ultralytics
    return PersonCounter(settings.model_path, settings.conf)


def _default_open(spec):
    from .sources import open_source  # lazy: imports opencv
    return open_source(spec)


def _default_resize(frame, width):
    from .sources import resize_for_speed
    return resize_for_speed(frame, width)


def run_worker(
    platform_id: str,
    source_spec: str,
    pub: Publisher,
    *,
    counter=None,
    open_fn=None,
    resize_fn=None,
    monotonic=time.monotonic,
    max_frames: int | None = None,   # for tests / bounded runs
):
    counter = counter or _default_counter()
    open_fn = open_fn or _default_open
    resize_fn = resize_fn or _default_resize

    tracker = DensityTracker(settings.platform_capacity[platform_id], settings.smoothing_window)
    cap = open_fn(source_spec)
    i = 0
    processed = 0
    last_publish = -1e9
    print(f"[cv/worker] platform {platform_id} <- source {source_spec!r}")
    try:
        while True:
            ok, frame = cap.read()
            if not ok:                       # end of clip -> loop it for the demo
                cap.release()
                cap = open_fn(source_spec)
                continue

            i += 1
            if i % settings.frame_stride:    # process every Nth frame
                continue

            frame = resize_fn(frame, settings.resize_width)
            if settings.log_latency:
                _t0 = time.perf_counter()
                n = counter.count(frame)
                _detect_ms = (time.perf_counter() - _t0) * 1000
                print(f"[cv/worker] {platform_id} detect {_detect_ms:.0f}ms count={n}")
            else:
                n = counter.count(frame)
            reading = tracker.update(n)
            # `frame` goes out of scope here — never saved to disk

            now = monotonic()
            if now - last_publish >= settings.publish_interval_sec:
                try:
                    pub.send(platform_id, reading["count"], reading["density_pct"])
                except Exception as e:
                    print(f"[cv/worker] publish failed for {platform_id}: {e}")
                last_publish = now

            processed += 1
            if max_frames is not None and processed >= max_frames:
                break
    finally:
        cap.release()


def run_workers():
    """Run one worker thread per configured platform source."""
    pub = Publisher()
    threads = [
        threading.Thread(target=run_worker, args=(pid, spec, pub), daemon=True)
        for pid, spec in settings.sources.items()
    ]
    for t in threads:
        t.start()
    try:
        while any(t.is_alive() for t in threads):
            time.sleep(0.5)
    finally:
        pub.close()
