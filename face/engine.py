"""Face detection and face embeddings.

- Detection: YuNet (OpenCV), finds the face and 5 landmarks (eyes, nose,
  mouth corners).
- Embedding: ArcFace ResNet-50 trained on WebFace600K (InsightFace
  "buffalo_l", w600k_r50), a 512-number vector. Two photos of the same person
  give vectors pointing the same way (cosine similarity close to 1).

On a Raspberry Pi 5 the embedding takes ~200 ms per face on the CPU.
"""

import threading
from dataclasses import dataclass

import cv2
import numpy as np
import onnxruntime as ort

# Where ArcFace expects the 5 landmarks in its 112x112 input.
ARCFACE_LANDMARKS = np.array(
    [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
    dtype=np.float32,
)

# Bigger photos are scaled down before detection (faster, same result).
MAX_SIDE = 1280


@dataclass
class Face:
    embedding: np.ndarray
    score: float
    box: list[int]


class FaceEngine:
    def __init__(self, detector_path: str, embedder_path: str, threads: int, min_score: float, min_size: int):
        options = ort.SessionOptions()
        options.intra_op_num_threads = threads
        self.embedder = ort.InferenceSession(embedder_path, options, providers=["CPUExecutionProvider"])
        self.embedder_input = self.embedder.get_inputs()[0].name
        self.detector_path = detector_path
        self.min_score = min_score
        self.min_size = min_size
        # The OpenCV detector is not thread-safe: one per thread.
        self.local = threading.local()

    def _detector(self, width: int, height: int):
        detector = getattr(self.local, "detector", None)
        if detector is None:
            detector = cv2.FaceDetectorYN.create(self.detector_path, "", (width, height), self.min_score)
            self.local.detector = detector
        detector.setInputSize((width, height))
        return detector

    def analyze(self, image_bytes: bytes) -> Face | None:
        """The biggest face in the photo with its embedding, or None if there is no usable face."""
        image = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("not an image")
        scale = MAX_SIDE / max(image.shape[:2])
        if scale < 1:
            image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)

        height, width = image.shape[:2]
        _, faces = self._detector(width, height).detect(image)
        if faces is None:
            return None
        face = max(faces, key=lambda f: f[2] * f[3])
        if min(face[2], face[3]) < self.min_size:
            return None

        landmarks = face[4:14].reshape(5, 2).astype(np.float32)
        transform, _ = cv2.estimateAffinePartial2D(landmarks, ARCFACE_LANDMARKS, method=cv2.LMEDS)
        aligned = cv2.warpAffine(image, transform, (112, 112))
        blob = cv2.dnn.blobFromImage(aligned, 1 / 127.5, (112, 112), (127.5, 127.5, 127.5), swapRB=True)
        vector = self.embedder.run(None, {self.embedder_input: blob})[0][0]
        return Face(
            embedding=vector / np.linalg.norm(vector),
            score=float(face[14]),
            box=[int(v) for v in face[:4]],
        )
