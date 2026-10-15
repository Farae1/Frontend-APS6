# APS-6 — Face biometrics access

Face biometrics access system of the **Ministério do Meio Ambiente** (Brazil's
Ministry of the Environment). Employees register and sign in with their face;
each registration is approved by someone higher in the hierarchy. Signing in
opens the vault: state secrets split by level.

Everything runs locally, including on a Raspberry Pi 5.

## Running

Requires Docker with Compose v2.

```bash
cp .env.example .env      # optional: ports, passwords, thresholds
docker compose up -d --build
```

- On this machine: http://localhost:8080
- From a phone or another computer: https://<this machine's IP>:8443
  (self-signed certificate: accept the warning; the camera needs HTTPS)

The first build downloads the face model (~290 MB) and takes a few minutes.
Then set the base minister's password (asked in the terminal):

```bash
docker compose exec api python set_base_password.py
```

## Architecture

```
browser ──► frontend (nginx) ──/api──► api ──────────────► face (model)
                                        │  sign in and registration,
                                        │  both right away
                                        ├──► redis (base minister's challenges)
                                        │
                                        ├──────────────────────────┐
                                        ▼                          ▼
                                    database (Postgres)    vectors (Postgres + pgvector)
                                    employees, accesses    face embeddings
```

| folder | container | what it does |
|--------|-----------|--------------|
| `frontend/` | `frontend` | the web app (React + TypeScript), served by nginx, which also proxies `/api` |
| `api/` | `api` | the HTTP API (FastAPI): sign in and registration run the biometrics right away |
| `face/` | `face` | the face model: photos → embeddings, in its own container |
| `shared/` | — | Python code used by `api` (settings, databases, biometric rules) |
| `database/` | `database` | Postgres: employees, registration status, accesses (`init.sql`) |
| `vectors/` | `vectors` | Postgres + pgvector: the face embeddings (`init.sql`) |
| `kiosk/` | — | opens the app full screen on the Pi's display |
| — | `redis` | Redis: the base minister's one-time challenges and failed attempts |

### The face model

- **Detection:** YuNet (OpenCV Zoo): finds the face and 5 landmarks (eyes,
  nose, mouth corners), used to align it.
- **Recognition:** **ArcFace ResNet-50** trained on WebFace600K (InsightFace
  `buffalo_l`, `w600k_r50`): a 512-number embedding per face. Two photos of
  the same person point the same way (cosine similarity close to 1).

Measured on a Raspberry Pi 5 (CPU):

| model | time per face | |
|-------|---------------|-|
| **ArcFace R50 (chosen)** | ~200 ms | the most accurate |
| MobileFaceNet (InsightFace `buffalo_s`) | ~18 ms | lighter, less accurate |
| SFace (OpenCV) | ~19 ms | lighter, less accurate |

A full sign in (two photos) takes ~0.8 s. With test photos, the same person
scored 0.94–0.97 and different people scored below 0, against a threshold of
0.5. The InsightFace models are licensed for non-commercial research use,
which covers this academic project.

### Why these databases

The Pi 5 kernel uses 16 KB memory pages, which breaks programs built with
jemalloc for 4 KB pages (Qdrant, for instance). Postgres with **pgvector** has
no such problem and gives nearest-neighbour search with an HNSW index. The
official Redis image is built for larger pages on ARM and works.

## Flows

**Sign in** — `POST /identifier`, synchronous:
1. `face` embeds the two captures; both must have a face and be the same
   person (similarity ≥ `MATCH_SAME_SESSION`).
2. Their combined embedding is searched in `vectors`; the nearest employee
   must score ≥ `MATCH_EMPLOYEE`.
3. If the employee is `ACTIVE`, the access is recorded and returned.

**Registration** — `POST /register`, synchronous too:
1. `face` embeds the two captures; both must have a face and be the same
   person, and the face must not be registered yet (otherwise the app says
   why right away, and nothing is stored).
2. `api` creates the employee (`UNDER_REVIEW`) and stores the embeddings.
3. Someone above approves it (the gear ⚙ in the app).

The photos are not stored: only the embeddings are kept.

### The hierarchy

| who | approves | sees in the vault |
|-----|----------|-------------------|
| base minister (password) | everyone (the root: approves the first registrations) | — |
| minister | managers and analysts | levels 0, 1 and 2 |
| manager | analysts | levels 1 and 2 |
| analyst | nobody | level 2 |

### Sessions and the base minister's password

- A face sign-in, or the base minister's password, opens a **session**: a
  signed token (JWT, HS256) that expires in 10 minutes. The vault and the
  approvals require it (`Authorization: Bearer <token>`); the app goes back
  to the start when it expires.
- The password never travels in clear: `GET /auth/challenge` gives the API's
  RSA public key and a one-time nonce (60 s, kept in Redis); the browser
  encrypts `nonce:password` with **RSA-OAEP** (Web Crypto) and sends it to
  `POST /auth/base`. A captured request can't be replayed.
- The database keeps only a **scrypt** hash of the password. After 5 wrong
  passwords, the base sign-in is locked for 5 minutes.

## API

All endpoints are behind `/api` on the frontend (e.g.
`http://localhost:8080/api/registrations`). Photos go as
`multipart/form-data` fields `capture1` and `capture2` (JPEG or PNG, up to
5 MB each).

| endpoint | does | answers |
|----------|------|---------|
| `POST /identifier` | sign in | `200 {id, name, level, accessedAt, session}`; `401` no face / captures of different people; `404` not recognized; `403` registration not approved yet |
| `POST /register` | registration, with `name` and `level` (`ANALYST`, `MANAGER`, `MINISTER`) | `202 {status: "UNDER_REVIEW", id, registeredAt}` |
| `GET /registrations/{id}` | one registration | `{id, name, level, status, statusReason, registeredAt, approvedBy}` |
| `GET /auth/challenge` | public key and nonce for the password | `{publicKey, nonce}` |
| `POST /auth/base` | base minister's sign in: `{nonce, password}` (encrypted, base64) | session; `401` wrong password; `429` locked |
| `GET /secrets` 🔑 | the vault, up to the session's level | list of `{code, level, glyph, title, summary, body, formula}` |
| `GET /registrations/pending` 🔑 | registrations this session may approve | list |
| `POST /registrations/{id}/approve` 🔑 | approve | `200`; `403` not allowed; `409` not under review |
| `POST /registrations/{id}/reject` 🔑 | reject (the face can register again) | same as approve |

🔑 needs the session token. A session is `{token, expiresAt, role, name,
canApprove}`.

Rejection reasons (`statusReason`): `no-face`, `captures-differ`,
`already-registered`, `invalid-photo`, `processing-failed`, `not-approved`.

## The base minister

The base minister approves registrations of any level with a password, set (and changed)
with:

```bash
docker compose exec api python set_base_password.py
```

To give an existing employee a face without the approval flow (an
administration tool), either merge a registration made in the app or use two
photos in `photos/` (ignored by git):

```bash
docker compose exec api python enroll.py MMA-000001 --from MMA-000100
docker compose run --rm -v "$PWD/photos:/photos" api \
    python enroll.py MMA-000001 --photos /photos/1.jpg /photos/2.jpg --name "Nome Completo"
```

## The vault

The secrets live in the database (`database/02-vault.sql`) and the API only
returns the ones the session's level may see. Level 0 (ministers) holds the
most advanced ones, level 2 (analysts) the most basic. They are fiction:
scientific and mathematical "discoveries" (an infinite energy crystal, a
proof of the Riemann hypothesis, every digit of π...), marked as theoretical
where real mathematics says otherwise.

## Kiosk (the Pi's own display)

`kiosk/` opens the app full screen on the Raspberry Pi's display at login,
using a webcam connected to the Pi. See [kiosk/README.md](kiosk/README.md).

## Configuration

Set in `.env` (see `.env.example`):

| variable | default | |
|----------|---------|-|
| `HTTP_PORT`, `HTTPS_PORT` | 8080, 8443 | frontend ports |
| `DATABASE_PASSWORD`, `VECTORS_PASSWORD` | `aps6` | database passwords |
| `TOKEN_MINUTES` | 10 | how long a session lasts |
| `TOKEN_SECRET` | random at each start | signs the session tokens (set it to keep sessions across restarts) |
| `MATCH_SAME_SESSION` | 0.5 | minimum similarity between the two captures of a session |
| `MATCH_EMPLOYEE` | 0.5 | minimum similarity to recognize an employee |
| `FACE_THREADS` | 2 | CPU threads per face inference |

To start over with empty databases: `docker compose down -v`. The database
scripts (`database/*.sql`, in name order) run only when the volume is
created.
