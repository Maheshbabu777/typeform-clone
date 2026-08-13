from pathlib import Path

from app.database import get_connection

SCHEMA_PATH = Path(__file__).resolve().parents[1] / "schema.sql"


def init_database() -> None:
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    with get_connection() as connection:
        connection.executescript(schema_sql)


if __name__ == "__main__":
    init_database()
    print("Database initialized.")

