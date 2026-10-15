"""Employees in the regular database (database/init.sql).

An employee goes through these statuses (PROCESSING, from when registration
went through a queue, is no longer used):
  UNDER_REVIEW  registered with valid biometrics, waiting for someone above to approve
  ACTIVE        approved: can sign in
  REJECTED      biometrics invalid or duplicated, or not approved
"""

from dataclasses import dataclass
from datetime import datetime

import psycopg
from psycopg.rows import class_row

from . import settings


@dataclass
class Employee:
    id: str
    name: str
    level: str
    status: str
    status_reason: str | None
    registered_at: datetime
    approved_by: str | None
    approved_at: datetime | None


COLUMNS = "id, name, level, status, status_reason, registered_at, approved_by, approved_at"


def _connect():
    return psycopg.connect(settings.DATABASE_URL, autocommit=True, row_factory=class_row(Employee))


def create(name: str, level: str, status: str = "UNDER_REVIEW") -> Employee:
    with _connect() as db:
        return db.execute(
            f"INSERT INTO employees (name, level, status) VALUES (%s, %s, %s) RETURNING {COLUMNS}", (name, level, status)
        ).fetchone()


def get(employee_id: str) -> Employee | None:
    with _connect() as db:
        return db.execute(f"SELECT {COLUMNS} FROM employees WHERE id = %s", (employee_id,)).fetchone()


def set_status(employee_id: str, status: str, reason: str | None = None) -> None:
    with _connect() as db:
        db.execute("UPDATE employees SET status = %s, status_reason = %s WHERE id = %s", (status, reason, employee_id))


def rename(employee_id: str, name: str) -> None:
    with _connect() as db:
        db.execute("UPDATE employees SET name = %s WHERE id = %s", (name, employee_id))


def approve(employee_id: str, approver_id: str) -> Employee:
    with _connect() as db:
        return db.execute(
            f"""UPDATE employees SET status = 'ACTIVE', status_reason = NULL, approved_by = %s, approved_at = now()
                WHERE id = %s RETURNING {COLUMNS}""",
            (approver_id, employee_id),
        ).fetchone()


def record_access(employee_id: str, match: float) -> datetime:
    with psycopg.connect(settings.DATABASE_URL, autocommit=True) as db:
        return db.execute(
            "INSERT INTO accesses (employee_id, match) VALUES (%s, %s) RETURNING accessed_at", (employee_id, match)
        ).fetchone()[0]


def delete(employee_id: str) -> None:
    with psycopg.connect(settings.DATABASE_URL, autocommit=True) as db:
        db.execute("DELETE FROM employees WHERE id = %s", (employee_id,))


def list_pending(levels: list[str]) -> list[Employee]:
    """Registrations under review at these levels, oldest first."""
    with _connect() as db:
        return db.execute(
            f"SELECT {COLUMNS} FROM employees WHERE status = 'UNDER_REVIEW' AND level = ANY(%s::level[]) ORDER BY registered_at",
            (levels,),
        ).fetchall()
