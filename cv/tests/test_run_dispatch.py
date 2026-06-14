"""Entrypoint dispatch (cv/run.py): synthetic vs real path selection."""
import cv.run as run
from cv.config import settings


def test_run_selects_synthetic(monkeypatch):
    called = {}
    monkeypatch.setattr(settings, "use_synthetic", True)
    monkeypatch.setattr("cv.synthetic.run_synthetic", lambda: called.setdefault("synthetic", True))
    run.main()
    assert called == {"synthetic": True}


def test_run_selects_real_worker(monkeypatch):
    called = {}
    monkeypatch.setattr(settings, "use_synthetic", False)
    # Patch worker.run_workers so we don't import ultralytics/opencv.
    monkeypatch.setattr("cv.worker.run_workers", lambda: called.setdefault("real", True))
    run.main()
    assert called == {"real": True}


def test_run_selects_hybrid(monkeypatch):
    called = {}
    monkeypatch.setattr(settings, "cv_mode", "hybrid")
    monkeypatch.setattr("cv.hybrid.run_hybrid", lambda: called.setdefault("hybrid", True))
    run.main()
    assert called == {"hybrid": True}


def test_run_selects_real_via_mode(monkeypatch):
    called = {}
    monkeypatch.setattr(settings, "cv_mode", "real")
    monkeypatch.setattr("cv.worker.run_workers", lambda: called.setdefault("real", True))
    run.main()
    assert called == {"real": True}
