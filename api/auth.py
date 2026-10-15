"""Sessions and the base minister's password.

- Sessions are signed tokens (JWT, HS256) that expire in TOKEN_MINUTES. A
  face sign-in gets one with the employee's level as role; the base
  minister's password gets one with role BASE.
- The password never travels in clear: the browser encrypts "nonce:password"
  with this server's RSA public key (RSA-OAEP, SHA-256). The nonce comes from
  GET /auth/challenge, is valid for 60 s and only once (stored in Redis), so
  a captured request can't be replayed.
- The database keeps only a scrypt hash of the password (settings table).
- After 5 wrong passwords, the base sign-in is locked for 5 minutes.
"""

import base64
import hashlib
import hmac
import os
import secrets
import time

import jwt
import psycopg
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from redis import Redis

from common import settings

TOKEN_MINUTES = int(os.getenv("TOKEN_MINUTES", "10"))
# Signs the tokens. A new one at every start (all sessions end) unless set.
TOKEN_SECRET = os.getenv("TOKEN_SECRET") or secrets.token_hex(32)

NONCE_SECONDS = 60
MAX_FAILURES = 5
LOCK_SECONDS = 300

redis = Redis.from_url(settings.REDIS_URL)

# A new key pair at every start: only the public half leaves the server.
_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
PUBLIC_KEY = base64.b64encode(
    _private_key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
).decode()
_OAEP = padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)


class AuthError(Exception):
    """A failed sign-in, with the HTTP status to answer."""

    def __init__(self, status: int, reason: str):
        super().__init__(reason)
        self.status = status
        self.reason = reason


# Sessions -----------------------------------------------------------------


def issue_token(subject: str, role: str, name: str) -> tuple[str, int]:
    expires_at = int(time.time()) + TOKEN_MINUTES * 60
    token = jwt.encode({"sub": subject, "role": role, "name": name, "exp": expires_at}, TOKEN_SECRET, algorithm="HS256")
    return token, expires_at


def read_token(authorization: str | None) -> dict:
    """The session of an "Authorization: Bearer <token>" header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthError(401, "missing-token")
    try:
        return jwt.decode(authorization.removeprefix("Bearer "), TOKEN_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise AuthError(401, "session-expired")
    except jwt.InvalidTokenError:
        raise AuthError(401, "invalid-token")


# The base minister's password ---------------------------------------------


def new_challenge() -> str:
    nonce = secrets.token_urlsafe(18)
    redis.set(f"auth:nonce:{nonce}", 1, ex=NONCE_SECONDS)
    return nonce


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${digest.hex()}"


def _matches(password: str, stored: str) -> bool:
    _, salt, digest = stored.split("$")
    candidate = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(candidate.hex(), digest)


def _stored_hash() -> str | None:
    with psycopg.connect(settings.DATABASE_URL) as db:
        row = db.execute("SELECT value FROM settings WHERE key = 'base_password'").fetchone()
    return row[0] if row else None


def save_password_hash(password: str) -> None:
    with psycopg.connect(settings.DATABASE_URL, autocommit=True) as db:
        db.execute(
            """INSERT INTO settings (key, value) VALUES ('base_password', %s)
               ON CONFLICT (key) DO UPDATE SET value = excluded.value""",
            (hash_password(password),),
        )


def check_base_password(nonce: str, encrypted: str) -> None:
    """Raises AuthError unless the encrypted password is right."""
    failures_key = "auth:base:failures"
    if int(redis.get(failures_key) or 0) >= MAX_FAILURES:
        raise AuthError(429, "too-many-attempts")
    if not redis.delete(f"auth:nonce:{nonce}"):
        raise AuthError(401, "expired-challenge")

    stored = _stored_hash()
    if stored is None:
        raise AuthError(503, "base-password-not-set")
    try:
        plain = _private_key.decrypt(base64.b64decode(encrypted), _OAEP).decode()
    except ValueError:
        raise AuthError(400, "undecryptable")
    received_nonce, _, password = plain.partition(":")

    if received_nonce != nonce or not _matches(password, stored):
        redis.incr(failures_key)
        redis.expire(failures_key, LOCK_SECONDS)
        raise AuthError(401, "wrong-password")
    redis.delete(failures_key)
