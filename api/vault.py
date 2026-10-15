"""The secrets of the vault (database/02-vault.sql)."""

import psycopg
from psycopg.rows import dict_row

from common import settings


def secrets_for(levels: list[str]) -> list[dict]:
    """The secrets of these levels, highest level first."""
    with psycopg.connect(settings.DATABASE_URL, row_factory=dict_row) as db:
        return db.execute(
            """SELECT code, level, glyph, title, summary, body, formula FROM secrets
               WHERE level = ANY(%s::level[])
               ORDER BY level DESC, position""",
            (levels,),
        ).fetchall()
