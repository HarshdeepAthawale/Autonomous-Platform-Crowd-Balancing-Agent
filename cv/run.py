"""CV entrypoint — picks the run mode (CV_MODE).

  python -m cv.run                          # synthetic worked-example feed (no camera)
  CV_MODE=hybrid python -m cv.run           # webcam -> Platform A (YOLO), others synthetic
  CV_MODE=real   python -m cv.run           # every platform from its source (webcams/clips)
  USE_SYNTHETIC=false python -m cv.run      # back-compat alias for CV_MODE=real

The real/hybrid paths' heavy deps (ultralytics/opencv) are imported lazily, so the
synthetic demo runs on machines that don't have them installed.
"""
from .config import settings


def _effective_mode() -> str:
    mode = settings.cv_mode.lower()
    # Back-compat: USE_SYNTHETIC=false forces the real path.
    if mode == "synthetic" and not settings.use_synthetic:
        return "real"
    return mode


def main():
    mode = _effective_mode()
    if mode == "hybrid":
        from .hybrid import run_hybrid     # lazy: imports ultralytics/opencv
        run_hybrid()
    elif mode == "real":
        from .worker import run_workers     # lazy: imports ultralytics/opencv
        run_workers()
    else:
        from .synthetic import run_synthetic
        run_synthetic()


if __name__ == "__main__":
    main()
