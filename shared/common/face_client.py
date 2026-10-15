"""Client of the face service (face/)."""

import httpx
import numpy as np

from . import settings


class FaceServiceError(Exception):
    pass


def embed(images: list[bytes]) -> list[np.ndarray | None]:
    """The face embedding of each image, or None where no face was found."""
    files = [("images", (f"capture{i + 1}.jpg", image, "image/jpeg")) for i, image in enumerate(images)]
    try:
        response = httpx.post(f"{settings.FACE_URL}/embed", files=files, timeout=60)
    except httpx.HTTPError as error:
        raise FaceServiceError(str(error)) from error
    if response.status_code == 400:
        raise ValueError(response.json().get("detail", "invalid image"))
    if response.status_code != 200:
        raise FaceServiceError(f"face service answered {response.status_code}")
    return [None if face is None else np.array(face["embedding"], dtype=np.float32) for face in response.json()["faces"]]
