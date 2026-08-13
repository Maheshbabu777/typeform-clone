from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.constants import DEFAULT_CREATOR_ID
from app.database import get_connection
from app.json_fields import dump_json, parse_json_object
from app.repositories import (
    build_form_settings,
    create_unique_slug,
    default_theme_colors_json,
    fetch_all,
    fetch_one,
    get_form_row,
    list_logic_rules,
    list_questions,
)
from app.schemas import FormCreate, FormUpdate
from app.serializers import serialize_form, serialize_logic_rule, serialize_question

router = APIRouter(prefix="/forms", tags=["forms"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_form(payload: FormCreate) -> dict[str, Any]:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO form (creator_id, title, theme_colors, settings)
            VALUES (?, ?, ?, ?)
            """,
            (
                DEFAULT_CREATOR_ID,
                payload.title,
                default_theme_colors_json(),
                build_form_settings(None, {}),
            ),
        )
        row = get_form_row(connection, cursor.lastrowid)
        return serialize_form(row)


@router.get("")
def list_forms() -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = fetch_all(
            connection,
            """
            SELECT
                form.*,
                COUNT(CASE WHEN response.completed_at IS NOT NULL THEN 1 END) AS response_count
            FROM form
            LEFT JOIN response ON response.form_id = form.id
            WHERE form.creator_id = ?
            GROUP BY form.id
            ORDER BY form.updated_at DESC, form.id DESC
            """,
            (DEFAULT_CREATOR_ID,),
        )
        return [serialize_form(row) | {"response_count": row["response_count"]} for row in rows]


@router.get("/{form_id}")
def get_form(form_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        form = ensure_form(connection, form_id)
        return serialize_form(form) | {
            "questions": [serialize_question(row) for row in list_questions(connection, form_id)],
            "logic": [serialize_logic_rule(row) for row in list_logic_rules(connection, form_id)],
        }


@router.put("/{form_id}")
def update_form(form_id: int, payload: FormUpdate) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    with get_connection() as connection:
        row = ensure_form(connection, form_id)
        settings_updates = {
            key: updates.pop(key)
            for key in ["description", "theme_roundness", "theme_font_size", "thank_you_text"]
            if key in updates
        }
        
        if "settings" in updates and isinstance(updates["settings"], dict):
            settings_updates.update(updates.pop("settings"))

        assignments: list[str] = []
        values: list[Any] = []
        if "title" in updates:
            assignments.append("title = ?")
            values.append(updates["title"])
        if "theme_colors" in updates:
            current_colors = parse_json_object(row.get("theme_colors"))
            current_colors.update(updates["theme_colors"] or {})
            assignments.append("theme_colors = ?")
            values.append(dump_json(current_colors))
        if settings_updates:
            assignments.append("settings = ?")
            values.append(build_form_settings(row, settings_updates))

        if assignments:
            assignments.append("updated_at = datetime('now')")
            values.append(form_id)
            connection.execute(
                f"UPDATE form SET {', '.join(assignments)} WHERE id = ?",
                tuple(values),
            )

        return serialize_form(ensure_form(connection, form_id))


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_form(form_id: int) -> Response:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        connection.execute("DELETE FROM form WHERE id = ?", (form_id,))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{form_id}/publish")
def publish_form(form_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        row = ensure_form(connection, form_id)
        slug = row["public_slug"] or create_unique_slug(connection)
        connection.execute(
            """
            UPDATE form
            SET status = 'published', public_slug = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (slug, form_id),
        )
        return serialize_form(ensure_form(connection, form_id))


@router.post("/{form_id}/unpublish")
def unpublish_form(form_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        connection.execute(
            "UPDATE form SET status = 'draft', updated_at = datetime('now') WHERE id = ?",
            (form_id,),
        )
        return serialize_form(ensure_form(connection, form_id))


@router.post("/{form_id}/duplicate", status_code=status.HTTP_201_CREATED)
def duplicate_form(form_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        form = ensure_form(connection, form_id)
        cursor = connection.execute(
            """
            INSERT INTO form (creator_id, title, status, theme_id, theme_colors, settings)
            VALUES (?, ?, 'draft', ?, ?, ?)
            """,
            (
                DEFAULT_CREATOR_ID,
                f"{form['title']} copy",
                form["theme_id"],
                form["theme_colors"],
                form["settings"],
            ),
        )
        new_form_id = cursor.lastrowid

        question_id_map: dict[int, int] = {}
        for question in list_questions(connection, form_id):
            cursor = connection.execute(
                """
                INSERT INTO question
                    (form_id, type, title, description, required, order_index, options, settings)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    new_form_id,
                    question["type"],
                    question["title"],
                    question["description"],
                    question["required"],
                    question["order_index"],
                    question["options"],
                    question["settings"],
                ),
            )
            question_id_map[int(question["id"])] = cursor.lastrowid

        for rule in list_logic_rules(connection, form_id):
            source_id = question_id_map[int(rule["source_question_id"])]
            target_id = (
                question_id_map.get(int(rule["target_question_id"]))
                if rule["target_question_id"] is not None
                else None
            )
            connection.execute(
                """
                INSERT INTO logic_rule
                    (form_id, source_question_id, operator, condition_value, target_question_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                (new_form_id, source_id, rule["operator"], rule["condition_value"], target_id),
            )

        new_form = ensure_form(connection, new_form_id)
        return serialize_form(new_form) | {
            "questions": [
                serialize_question(row) for row in list_questions(connection, int(new_form_id))
            ],
            "logic": [
                serialize_logic_rule(row) for row in list_logic_rules(connection, int(new_form_id))
            ],
        }


def ensure_form(connection, form_id: int) -> dict[str, Any]:
    row = get_form_row(connection, form_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Form not found.")
    return row


def ensure_question_belongs_to_form(connection, form_id: int, question_id: int) -> dict[str, Any]:
    row = fetch_one(
        connection,
        "SELECT * FROM question WHERE id = ? AND form_id = ?",
        (question_id, form_id),
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Question {question_id} does not belong to form {form_id}.",
        )
    return row
