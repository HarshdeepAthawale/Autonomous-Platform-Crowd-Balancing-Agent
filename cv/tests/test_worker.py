"""Real worker control-flow tests via dependency injection (Phase2 plan §8).

Exercises worker.py's actual loop — frame stride, publish throttling, and clip
re-open on EOF — with fakes, so no YOLO/camera/clip is needed.
"""
import pytest

from cv.config import settings
from cv.worker import run_worker

CAPTURED = "captured-fields"


class FakePublisher:
    def __init__(self):
        self.sends = []

    def send(self, platform_id, count, density_pct=None):
        self.sends.append((platform_id, count, density_pct))


class FakeCap:
    """read() yields each frame; a None entry simulates EOF (False, None)."""
    def __init__(self, frames):
        self.frames = list(frames)
        self.released = 0

    def read(self):
        if not self.frames:
            return (False, None)
        f = self.frames.pop(0)
        return (False, None) if f is None else (True, f)

    def release(self):
        self.released += 1


class FakeCounter:
    def __init__(self, value):
        self.value = value
        self.calls = 0

    def count(self, frame):
        self.calls += 1
        return self.value


@pytest.fixture(autouse=True)
def restore_settings():
    saved = (settings.frame_stride, settings.publish_interval_sec, settings.resize_width)
    yield
    (settings.frame_stride, settings.publish_interval_sec, settings.resize_width) = saved


def _noop_resize(frame, width):
    return frame


def test_worker_publishes_density_per_frame():
    settings.frame_stride = 1
    settings.publish_interval_sec = 0.0
    pub = FakePublisher()
    cap = FakeCap([object(), object(), object()])

    run_worker("A", "fake", pub,
               counter=FakeCounter(100),     # 100 / 200 capacity = 50%
               open_fn=lambda spec: cap,
               resize_fn=_noop_resize,
               max_frames=3)

    assert len(pub.sends) == 3
    assert pub.sends[0][0] == "A"
    assert pub.sends[0][2] == 50.0           # density_pct
    assert cap.released >= 1                  # cleaned up


def test_worker_respects_frame_stride():
    settings.frame_stride = 3
    settings.publish_interval_sec = 0.0
    pub = FakePublisher()
    cap = FakeCap([object() for _ in range(9)])

    run_worker("A", "fake", pub,
               counter=FakeCounter(80),
               open_fn=lambda spec: cap,
               resize_fn=_noop_resize,
               max_frames=3)

    # 9 frames, stride 3 -> only frames 3,6,9 processed -> 3 publishes
    assert len(pub.sends) == 3


def test_worker_reopens_source_on_eof():
    settings.frame_stride = 1
    settings.publish_interval_sec = 0.0
    pub = FakePublisher()
    cap1 = FakeCap([object(), None])         # one frame then EOF
    cap2 = FakeCap([object(), object()])     # looped clip
    caps = iter([cap1, cap2])

    run_worker("A", "fake", pub,
               counter=FakeCounter(50),
               open_fn=lambda spec: next(caps),
               resize_fn=_noop_resize,
               max_frames=2)

    assert cap1.released >= 1                 # first source closed on EOF
    assert len(pub.sends) == 2               # kept going after re-open


def test_worker_throttles_publishing_by_interval():
    settings.frame_stride = 1
    settings.publish_interval_sec = 1.0
    pub = FakePublisher()
    cap = FakeCap([object() for _ in range(4)])
    times = iter([0.0, 0.1, 0.5, 1.2])       # monotonic per processed frame

    run_worker("A", "fake", pub,
               counter=FakeCounter(100),
               open_fn=lambda spec: cap,
               resize_fn=_noop_resize,
               monotonic=lambda: next(times),
               max_frames=4)

    # publish at t=0.0 and t=1.2 only (0.1, 0.5 are within the 1s window)
    assert len(pub.sends) == 2
