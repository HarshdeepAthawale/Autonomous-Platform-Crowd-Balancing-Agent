"""CV entrypoint — picks the synthetic (default) or real YOLOv8 path.

  python -m cv.run                 # synthetic worked-example feed (no camera)
  USE_SYNTHETIC=false python -m cv.run   # real YOLOv8 from configured sources

The real path's heavy deps (ultralytics/opencv) are imported lazily, so the
synthetic demo runs on machines that don't have them installed.
"""
from .config import settings


def main():
    if settings.use_synthetic:
        from .synthetic import run_synthetic
        run_synthetic()
    else:
        from .worker import run_workers  # lazy: imports ultralytics/opencv
        run_workers()


if __name__ == "__main__":
    main()
