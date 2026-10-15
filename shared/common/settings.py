import os

# Regular data: employees, registrations, accesses.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aps6:aps6@database:5432/aps6")
# Face embeddings (pgvector).
VECTORS_URL = os.getenv("VECTORS_URL", "postgresql://aps6:aps6@vectors:5432/vectors")
# Redis: the base minister's one-time challenges and failed attempts.
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
# The face model service.
FACE_URL = os.getenv("FACE_URL", "http://face:8001")

# Cosine similarity between embeddings (1 = identical, ~0 = unrelated):
# - the two captures of one session must be the same person;
MATCH_SAME_SESSION = float(os.getenv("MATCH_SAME_SESSION", "0.5"))
# - a face matches a registered employee from this value on.
MATCH_EMPLOYEE = float(os.getenv("MATCH_EMPLOYEE", "0.5"))
