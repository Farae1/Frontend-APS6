"""The backend API.

Biometrics
- POST /identifier            sign in: runs the biometrics right away, opens a session

The endpoints are plain functions: FastAPI runs them in a thread pool, so a
slow face check doesn't hold the other requests.
"""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile

import auth
from common import embeddings, employees, face_client, hierarchy, settings
from common.biometrics import combine, similarity
from common.employees import Employee

app = FastAPI(title="APS-6 API")

MAX_PHOTO_BYTES = 5 * 1024 * 1024

Capture = Annotated[UploadFile, File()]


def read_photo(upload: UploadFile) -> bytes:
    data = upload.file.read()
    if not data or len(data) > MAX_PHOTO_BYTES:
        raise HTTPException(422, f"{upload.filename}: empty or larger than 5 MB")
    return data


def identify(capture1: bytes, capture2: bytes) -> tuple[Employee, float]:
    """Who these two captures belong to. 401 when there is no usable face or
    the captures are of different people; 404 when nobody matches."""
    try:
        faces = face_client.embed([capture1, capture2])
    except ValueError as error:
        raise HTTPException(422, str(error))
    except face_client.FaceServiceError:
        raise HTTPException(503, "face service unavailable")

    first, second = faces
    if first is None or second is None:
        raise HTTPException(401, "no-face")
    if similarity(first, second) < settings.MATCH_SAME_SESSION:
        raise HTTPException(401, "captures-differ")

    match = embeddings.nearest(combine(first, second))
    if match is None or match.similarity < settings.MATCH_EMPLOYEE:
        raise HTTPException(404, "not-recognized")
    employee = employees.get(match.employee_id)
    if employee is None or employee.status == "REJECTED":
        raise HTTPException(404, "not-recognized")
    return employee, match.similarity


def session_view(subject: str, role: str, name: str) -> dict:
    token, expires_at = auth.issue_token(subject, role, name)
    return {
        "token": token,
        "expiresAt": datetime.fromtimestamp(expires_at, timezone.utc).isoformat(),
        "role": role,
        "name": name,
        "canApprove": hierarchy.approvable_levels(role),
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# Biometrics ---------------------------------------------------------------


@app.post("/identifier")
def sign_in(capture1: Capture, capture2: Capture):
    employee, match = identify(read_photo(capture1), read_photo(capture2))
    if employee.status != "ACTIVE":
        raise HTTPException(403, "pending-approval")
    accessed_at = employees.record_access(employee.id, match)
    return {
        "id": employee.id,
        "name": employee.name,
        "level": employee.level,
        "accessedAt": accessed_at.isoformat(),
        "session": session_view(employee.id, employee.level, employee.name),
    }
