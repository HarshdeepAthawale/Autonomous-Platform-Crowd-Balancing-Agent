"""CV pipeline configuration (env-driven). Mirrors backend capacity calibration.

Importing this module pulls in NO heavy deps (no ultralytics/opencv), so the
synthetic fallback path stays runnable on machines without a camera or YOLO.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class CVSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    backend_url: str = "http://127.0.0.1:8000"

    # YOLOv8 (real path)
    model_path: str = "yolov8n.pt"   # nano — fastest on CPU; kept out of git
    conf: float = 0.35
    frame_stride: int = 3            # process every Nth frame for latency budget
    resize_width: int = 640          # downscale input for speed (in-memory only)

    # Smoothing / publishing
    smoothing_window: int = 10       # rolling-average window (frames)
    publish_interval_sec: float = 1.0

    # Sources: platform_id -> spec ("0"/"1" = webcam index, or a clip path)
    sources: dict[str, str] = {"A": "0", "B": "1"}

    # Must match backend settings.platform_capacity for consistent density %
    platform_capacity: dict[str, int] = {"A": 200, "B": 200}

    # Primary demo path: deterministic, no camera required
    use_synthetic: bool = True

    # Print rolling frame->detect->publish latency (for the on-device latency proof).
    log_latency: bool = False


settings = CVSettings()
