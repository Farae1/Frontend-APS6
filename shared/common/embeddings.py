"""Face embeddings in the vector database (vectors/init.sql, pgvector)."""

from dataclasses import dataclass

import numpy as np
import psycopg

from . import settings


@dataclass
class Match:
    employee_id: str
    similarity: float


def _literal(vector: np.ndarray) -> str:
    return "[" + ",".join(f"{v:.6f}" for v in vector) + "]"


def _connect():
    return psycopg.connect(settings.VECTORS_URL, autocommit=True)


def replace(employee_id: str, vectors: list[np.ndarray]) -> None:
    """Stores the embeddings of an employee (one per capture), replacing older ones."""
    with _connect() as db, db.transaction():
        db.execute("DELETE FROM face_embeddings WHERE employee_id = %s", (employee_id,))
        for vector in vectors:
            db.execute(
                "INSERT INTO face_embeddings (employee_id, embedding) VALUES (%s, %s::vector)",
                (employee_id, _literal(vector)),
            )


def delete(employee_id: str) -> None:
    with _connect() as db:
        db.execute("DELETE FROM face_embeddings WHERE employee_id = %s", (employee_id,))


def nearest(vector: np.ndarray, exclude: str | None = None) -> Match | None:
    """The employee whose face is closest to this embedding (cosine similarity)."""
    with _connect() as db:
        row = db.execute(
            """SELECT employee_id, 1 - (embedding <=> %(v)s::vector) FROM face_embeddings
               WHERE employee_id IS DISTINCT FROM %(exclude)s
               ORDER BY embedding <=> %(v)s::vector LIMIT 1""",
            {"v": _literal(vector), "exclude": exclude},
        ).fetchone()
    return Match(row[0], float(row[1])) if row else None


def move(from_id: str, to_id: str) -> int:
    """Gives the embeddings of one employee to another (replacing theirs)."""
    with _connect() as db, db.transaction():
        db.execute("DELETE FROM face_embeddings WHERE employee_id = %s", (to_id,))
        return db.execute("UPDATE face_embeddings SET employee_id = %s WHERE employee_id = %s", (to_id, from_id)).rowcount
