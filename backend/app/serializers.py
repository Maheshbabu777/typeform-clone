from typing import Any

from app.constants import DEFAULT_FORM_SETTINGS, DEFAULT_THEME_COLORS
from app.json_fields import parse_json_array, parse_json_object


def serialize_question(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "form_id": row["form_id"],
        "type": row["type"],
        "title": row["title"],
        "description": row["description"],
        "required": bool(row["required"]),
        "order_index": row["order_index"],
        "options": parse_json_array(row.get("options")),
        "settings": parse_json_object(row.get("settings")),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def serialize_logic_rule(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "form_id": row["form_id"],
        "source_question_id": row["source_question_id"],
        "operator": row["operator"],
        "condition_value": row["condition_value"],
        "target_question_id": row["target_question_id"],
    }


def serialize_form(row: dict[str, Any]) -> dict[str, Any]:
    settings = DEFAULT_FORM_SETTINGS | parse_json_object(row.get("settings"))
    return {
        "id": row["id"],
        "creator_id": row["creator_id"],
        "title": row["title"],
        "description": settings.get("description", ""),
        "status": row["status"],
        "public_slug": row["public_slug"],
        "theme_id": row["theme_id"],
        "theme_colors": DEFAULT_THEME_COLORS | parse_json_object(row.get("theme_colors")),
        "theme_roundness": settings.get("theme_roundness", "small"),
        "theme_font_size": settings.get("theme_font_size", "medium"),
        "thank_you_text": settings.get("thank_you_text", DEFAULT_FORM_SETTINGS["thank_you_text"]),
        "settings": settings,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }

