from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.database import get_connection
from app.json_fields import dump_json
from app.repositories import fetch_all, fetch_one, list_questions
from app.routers.forms import ensure_form
from app.schemas import QuestionCreate, QuestionUpdate, ReorderQuestions
from app.serializers import serialize_question

router = APIRouter(tags=["questions"])


@router.get("/forms/{form_id}/questions")
def get_questions(form_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        return [serialize_question(row) for row in list_questions(connection, form_id)]


@router.post("/forms/{form_id}/questions", status_code=status.HTTP_201_CREATED)
def create_question(form_id: int, payload: QuestionCreate) -> dict[str, Any]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        next_order = fetch_one(
            connection,
            """
            SELECT COALESCE(MAX(order_index), -1) + 1 AS next_order
            FROM question
            WHERE form_id = ?
            """,
            (form_id,),
        )["next_order"]
        cursor = connection.execute(
            """
            INSERT INTO question
                (form_id, type, title, description, required, order_index, options, settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                form_id,
                payload.type,
                payload.title,
                payload.description,
                int(payload.required),
                next_order,
                dump_json(payload.options) if payload.options is not None else None,
                dump_json(payload.settings or {}),
            ),
        )
        row = fetch_one(connection, "SELECT * FROM question WHERE id = ?", (cursor.lastrowid,))
        touch_form(connection, form_id)
        return serialize_question(row)


@router.put("/questions/{question_id}")
def update_question(question_id: int, payload: QuestionUpdate) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No updates provided.")

    with get_connection() as connection:
        row = ensure_question(connection, question_id)
        assignments: list[str] = []
        values: list[Any] = []
        for field, value in updates.items():
            column_value = value
            if field == "required":
                column_value = int(value)
            elif field in {"options", "settings"}:
                column_value = dump_json(value) if value is not None else None
            assignments.append(f"{field} = ?")
            values.append(column_value)

        assignments.append("updated_at = datetime('now')")
        values.append(question_id)
        connection.execute(
            f"UPDATE question SET {', '.join(assignments)} WHERE id = ?",
            tuple(values),
        )
        touch_form(connection, row["form_id"])
        return serialize_question(ensure_question(connection, question_id))


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(question_id: int) -> Response:
    with get_connection() as connection:
        row = ensure_question(connection, question_id)
        form_id = row["form_id"]
        connection.execute("DELETE FROM question WHERE id = ?", (question_id,))
        reindex_questions(connection, form_id)
        touch_form(connection, form_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/forms/{form_id}/questions/reorder")
def reorder_questions(form_id: int, payload: ReorderQuestions) -> list[dict[str, Any]]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        existing_rows = fetch_all(
            connection,
            "SELECT id FROM question WHERE form_id = ?",
            (form_id,),
        )
        existing_ids = {int(row["id"]) for row in existing_rows}
        requested_ids = set(payload.ordered_ids)
        if existing_ids != requested_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ordered_ids must contain every question for the form exactly once.",
            )
        for index, question_id in enumerate(payload.ordered_ids):
            connection.execute(
                "UPDATE question SET order_index = ?, updated_at = datetime('now') WHERE id = ?",
                (index, question_id),
            )
        touch_form(connection, form_id)
        return [serialize_question(row) for row in list_questions(connection, form_id)]


def ensure_question(connection, question_id: int) -> dict[str, Any]:
    row = fetch_one(connection, "SELECT * FROM question WHERE id = ?", (question_id,))
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    return row


def reindex_questions(connection, form_id: int) -> None:
    for index, row in enumerate(list_questions(connection, form_id)):
        connection.execute("UPDATE question SET order_index = ? WHERE id = ?", (index, row["id"]))


def touch_form(connection, form_id: int) -> None:
    connection.execute("UPDATE form SET updated_at = datetime('now') WHERE id = ?", (form_id,))
