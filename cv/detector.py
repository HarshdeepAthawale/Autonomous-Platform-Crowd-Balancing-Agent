"""YOLOv8 person counter (Phase2 plan §5.1).

PRIVACY: a frame is a numpy array passed by reference and discarded after
count() returns. There is NO cv2.imwrite, NO VideoWriter, NO disk write anywhere
in this module — only a number leaves it.
"""
from ultralytics import YOLO

PERSON_CLASS = 0  # COCO class id for 'person'


class PersonCounter:
    def __init__(self, model_path: str = "yolov8n.pt", conf: float = 0.35):
        self.model = YOLO(model_path)
        self.conf = conf

    def count(self, frame) -> int:
        """Return the number of persons detected in a single in-memory frame."""
        res = self.model.predict(
            frame,
            classes=[PERSON_CLASS],
            conf=self.conf,
            verbose=False,
        )
        return int(len(res[0].boxes))
