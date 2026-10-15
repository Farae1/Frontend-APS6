"""The backend API.

Biometrics
- POST /identifier            sign in: runs the biometrics right away, opens a session
- POST /register              registration: runs the biometrics right away too
- GET  /registrations/{id}    the status of a registration

Base minister
- GET  /auth/challenge        public key + one-time nonce to encrypt the password
- POST /auth/base             encrypted password -> session

With a session ("Authorization: Bearer <token>")
- GET  /secrets                       the vault, up to the session's level
- GET  /registrations/pending         registrations this session may decide
- POST /registrations/{id}/approve | /reject

The endpoints are plain functions: FastAPI runs them in a thread pool, so a
slow face check doesn't hold the other requests.
"""

import logging
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import auth
import vault
from common import embeddings, employees, face_client, hierarchy, settings
from common.biometrics import combine, similarity
from common.employees import Employee
from common.registration import check_faces

app = FastAPI(title="APS-6 API")
log = logging.getLogger("uvicorn.error")

MAX_PHOTO_BYTES = 5 * 1024 * 1024

Capture = Annotated[UploadFile, File()]
Level = Literal["ANALYST", "MANAGER", "MINISTER"]
Authorization = Annotated[str | None, Header()]


@app.exception_handler(auth.AuthError)
def auth_error(request, error: auth.AuthError):
    log.warning("%s %s refused: %s", request.method, request.url.path, error.reason)
    return JSONResponse({"detail": error.reason}, status_code=error.status)


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


def registration_view(employee: Employee) -> dict:
    return {
        "id": employee.id,
        "name": employee.name,
        "level": employee.level,
        "status": employee.status,
        "statusReason": employee.status_reason,
        "registeredAt": employee.registered_at.isoformat(),
        "approvedBy": employee.approved_by,
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


@app.post("/register", status_code=201)
def register(name: Annotated[str, Form(min_length=3, max_length=120)], level: Annotated[Level, Form()], capture1: Capture, capture2: Capture):
    """Checks the faces right away: 422 "unusable-capture" (no face, or the two
    captures are different people), 409 "already-registered"; otherwise the
    registration goes under review."""
    try:
        vectors, problem = check_faces(read_photo(capture1), read_photo(capture2))
    except ValueError:
        raise HTTPException(422, "unusable-capture")
    except face_client.FaceServiceError:
        raise HTTPException(503, "face service unavailable")
    if problem == "already-registered":
        raise HTTPException(409, problem)
    if problem:
        raise HTTPException(422, "unusable-capture")
    employee = employees.create(name.strip(), level)
    embeddings.replace(employee.id, vectors)
    return {"status": employee.status, "id": employee.id, "registeredAt": employee.registered_at.isoformat()}


# Base minister ------------------------------------------------------------


class EncryptedPassword(BaseModel):
    nonce: str
    password: str  # base64 of RSA-OAEP("nonce:password")


@app.get("/auth/challenge")
def challenge():
    return {"publicKey": auth.PUBLIC_KEY, "nonce": auth.new_challenge()}


@app.post("/auth/base")
def base_sign_in(body: EncryptedPassword):
    auth.check_base_password(body.nonce, body.password)
    return session_view("MMA-000001", hierarchy.BASE, "Ministro base")


# With a session -----------------------------------------------------------


@app.get("/secrets")
def list_secrets(authorization: Authorization = None):
    session = auth.read_token(authorization)
    return vault.secrets_for(hierarchy.SECRET_LEVELS.get(session["role"], []))


@app.get("/registrations/pending")
def pending_registrations(authorization: Authorization = None):
    session = auth.read_token(authorization)
    levels = hierarchy.approvable_levels(session["role"])
    return [registration_view(e) for e in employees.list_pending(levels)] if levels else []


def decidable(employee_id: str, authorization: str | None) -> tuple[Employee, dict]:
    session = auth.read_token(authorization)
    candidate = employees.get(employee_id)
    if candidate is None:
        raise HTTPException(404, "registration not found")
    if candidate.status != "UNDER_REVIEW":
        raise HTTPException(409, f"registration is {candidate.status}")
    if not hierarchy.can_approve(session["role"], candidate.level):
        raise HTTPException(403, "not-allowed")
    return candidate, session


@app.post("/registrations/{employee_id}/approve")
def approve(employee_id: str, authorization: Authorization = None):
    candidate, session = decidable(employee_id, authorization)
    return registration_view(employees.approve(candidate.id, session["sub"]))


@app.post("/registrations/{employee_id}/reject")
def reject(employee_id: str, authorization: Authorization = None):
    candidate, _ = decidable(employee_id, authorization)
    employees.set_status(candidate.id, "REJECTED", "not-approved")
    embeddings.delete(candidate.id)
    return registration_view(employees.get(candidate.id))


# Declared last: "/registrations/pending" must match before "{employee_id}".
@app.get("/registrations/{employee_id}")
def get_registration(employee_id: str):
    employee = employees.get(employee_id)
    if employee is None:
        raise HTTPException(404, "registration not found")
    return registration_view(employee)
