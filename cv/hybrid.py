"""Hybrid CV feed — one platform from a real webcam (YOLO), the rest synthetic.

For the demo: Platform A counts real people from the webcam (live "it's real CV"),
while the other platform(s) keep a calm GREEN synthetic feed so the agent can still
redirect crowds A→B. Both publish independently to the backend via Publisher.

Heavy deps (ultralytics/opencv) are imported lazily inside run_worker, so importing
this module stays cheap.
"""
import threading
import time

from .config import settings
from .publisher import Publisher
from .synthetic import ScenarioGenerator
from .worker import run_worker


def _synthetic_others(pub: Publisher, real_pid: str, stop: threading.Event):
    """Emit a steady synthetic GREEN feed for every platform except the webcam one."""
    gen = ScenarioGenerator(settings.platform_capacity)
    t0 = time.monotonic()
    while not stop.is_set():
        counts = gen.counts_at(time.monotonic() - t0)
        for pid, count in counts.items():
            if pid == real_pid:
                continue
            try:
                pub.send(pid, count)
            except Exception as e:  # backend not up yet / transient
                print(f"[cv/hybrid] synthetic publish failed for {pid}: {e}")
        stop.wait(settings.publish_interval_sec)


def run_hybrid():
    """Real webcam worker for settings.webcam_platform + synthetic for the others."""
    real_pid = settings.webcam_platform
    # Calibrate the webcam platform so a few people fill the gauge (Green→Red).
    settings.platform_capacity[real_pid] = settings.webcam_capacity

    pub = Publisher()
    stop = threading.Event()
    synth = threading.Thread(
        target=_synthetic_others, args=(pub, real_pid, stop), daemon=True
    )
    synth.start()

    print(f"[cv/hybrid] webcam -> platform {real_pid} (source {settings.webcam_source!r}, "
          f"capacity {settings.webcam_capacity}); others synthetic")
    try:
        # Blocks reading the webcam; processes frame -> YOLO count -> publish.
        run_worker(real_pid, settings.webcam_source, pub)
    finally:
        stop.set()
        pub.close()
