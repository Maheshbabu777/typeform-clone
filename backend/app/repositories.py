import secrets
import string
from typing import Any

from app.constants import DEFAULT_CREATOR_ID, DEFAULT_FORM_SETTINGS, DEFAULT_THEME_COLORS
from app.json_fields import dump_json, parse_json_object

SLUG_ALPHABET = string.ascii_letters + string.digits


def generate_slug(length: int = 10) -> str:
    return "".join(secrets.choice(SLUG_ALPHABET) for _ in range(length))


def fetch_one(connection, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    return connection.execute(query, params).fetchone()


def fetch_all(connection, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    return list(connection.execute(query, params).fetchall())


def get_form_row(connection, form_id: int) -> dict[str, Any] | None:
    return fetch_one(
        connection,
        "SELECT * FROM form WHERE id = ? AND creator_id = ?",
        (form_id, DEFAULT_CREATOR_ID),
    )


def get_public_form_row(connection, slug: str) -> dict[str, Any] | None:
    return fetch_one(
        connection,
        "SELECT * FROM form WHERE public_slug = ? AND status = 'published'",
        (slug,),
    )


def list_questions(connection, form_id: int) -> list[dict[str, Any]]:
    return fetch_all(
        connection,
        "SELECT * FROM question WHERE form_id = ? ORDER BY order_index ASC, id ASC",
        (form_id,),
    )


def list_logic_rules(connection, form_id: int) -> list[dict[str, Any]]:
    return fetch_all(
        connection,
        "SELECT * FROM logic_rule WHERE form_id = ? ORDER BY id ASC",
        (form_id,),
    )


def create_unique_slug(connection) -> str:
    for _ in range(20):
        slug = generate_slug()
        exists = fetch_one(connection, "SELECT id FROM form WHERE public_slug = ?", (slug,))
        if not exists:
            return slug
    raise RuntimeError("Unable to generate a unique public slug")


def build_form_settings(row: dict[str, Any] | None, updates: dict[str, Any]) -> str:
    current = DEFAULT_FORM_SETTINGS | parse_json_object(row.get("settings") if row else None)
    current.update({key: value for key, value in updates.items() if value is not None})
    return dump_json(current)


def default_theme_colors_json() -> str:
    return dump_json(DEFAULT_THEME_COLORS)

