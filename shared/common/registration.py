"""The registration biometrics, run right away by the API (POST /register) and by
the enrollment tool (api/enroll.py)."""

import numpy as np

from . import embeddings, face_client, settings
from .biometrics import combine, similarity


def check_faces(capture1: bytes, capture2: bytes, exclude: str | None = None) -> tuple[list[np.ndarray] | None, str | None]:
    """The two embeddings, or why they can't be used: "no-face",
    "captures-differ" or "already-registered" (`exclude`: an employee whose
    own face doesn't count as a duplicate). Raises ValueError for an invalid
    photo and face_client.FaceServiceError when the model is down."""
    first, second = face_client.embed([capture1, capture2])
    if first is None or second is None:
        return None, "no-face"
    if similarity(first, second) < settings.MATCH_SAME_SESSION:
        return None, "captures-differ"
    match = embeddings.nearest(combine(first, second), exclude=exclude)
    if match and match.similarity >= settings.MATCH_EMPLOYEE:
        return None, "already-registered"
    return [first, second], None
