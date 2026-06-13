"""Real CV worker (Phase2 plan §5.4): frame -> detect -> smooth -> publish.

One worker thread per platform. Frames are processed in memory and discarded;
only the smoothed count + density % are published to the backend.
"""
import threading
import time

from .config import settings
from .density import DensityTracker
from .detector import PersonCounter
from .publisher import Publisher
from .sources import open_source, resize_for_speed


def run_worker(platform_id: str, source_spec: str, pub: Publisher):
    counter = PersonCounter(settings.model_path, settings.conf)
    tracker = DensityTracker(settings.platform_capacity[platform_id], settings.smoothing_window)
    cap = open_source(source_spec)
    i = 0
    last_publish = 0.0
    print(f"[cv/worker] platform {platform_id} <- source {source_spec!r}")
    try:
        while True:
            ok, frame = cap.read()
            if not ok:                      # end of clip -> loop it for the demo
                cap.release()
                cap = open_source(source_spec)
                continue

            i += 1
            if i % settings.frame_stride:   # process every Nth frame
                continue

            frame = resize_for_speed(frame, settings.resize_width)
            n = counter.count(frame)
            reading = tracker.update(n)
            # frame goes out of scope here — never saved

            now = time.monotonic()
            if now - last_publish >= settings.publish_interval_sec:
                try:
                    pub.send(platform_id, reading["count"], reading["density_pct"])
                except Exception as e:
                    print(f"[cv/worker] publish failed for {platform_id}: {e}")
                last_publish = now
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
