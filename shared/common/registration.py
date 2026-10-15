"""The registration biometrics, run right away by the API (POST /register) and by
the enrollment tool (api/enroll.py)."""

import numpy as np

from . import face_client, settings
from .biometrics import similarity


def check_faces(capture1: bytes, capture2: bytes) -> tuple[list[np.ndarray] | None, str | None]:
    """The two embeddings, or why they can't be used: "no-face" or
    "captures-differ". Raises ValueError for an invalid photo and
    face_client.FaceServiceError when the model is down."""
    first, second = face_client.embed([capture1, capture2])
    if first is None or second is None:
        return None, "no-face"
    if similarity(first, second) < settings.MATCH_SAME_SESSION:
        return None, "captures-differ"
    return [first, second], None
