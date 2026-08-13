from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.database import get_connection
from app.repositories import fetch_one, get_public_form_row, list_logic_rules, list_questions
from app.schemas import PublicSubmit
from app.serializers import serialize_form, serialize_logic_rule, serialize_question
from app.validation import validate_public_answers

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/{slug}")
def get_public_form(slug: str) -> dict[str, Any]:
    with get_connection() as connection:
        form = ensure_public_form(connection, slug)
        questions = list_questions(connection, form["id"])
        logic_rules = list_logic_rules(connection, form["id"])
        return serialize_form(form) | {
            "questions": [serialize_question(row) for row in questions],
            "logic": [serialize_logic_rule(row) for row in logic_rules],
        }


@router.post("/{slug}/start", status_code=status.HTTP_201_CREATED)
def start_public_response(slug: str) -> dict[str, int]:
    with get_connection() as connection:
        form = ensure_public_form(connection, slug)
        cursor = connection.execute("INSERT INTO response (form_id) VALUES (?)", (form["id"],))
        return {"response_id": cursor.lastrowid}


@router.post("/{slug}/submit", status_code=status.HTTP_201_CREATED)
def submit_public_response(slug: str, payload: PublicSubmit) -> dict[str, Any]:
    with get_connection() as connection:
        form = ensure_public_form(connection, slug)
        questions = list_questions(connection, form["id"])
        logic_rules = list_logic_rules(connection, form["id"])
        validated_answers = validate_public_answers(questions, logic_rules, payload.answers)

        response_id = payload.response_id
        if response_id is not None:
            response = fetch_one(
                connection,
                """
                SELECT * FROM response
                WHERE id = ? AND form_id = ? AND completed_at IS NULL
                """,
                (response_id, form["id"]),
            )
            if response is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Response cannot be completed.",
                )
        else:
            cursor = connection.execute("INSERT INTO response (form_id) VALUES (?)", (form["id"],))
            response_id = cursor.lastrowid

        connection.execute(
            "UPDATE response SET completed_at = datetime('now') WHERE id = ?",
            (response_id,),
        )
        for answer in validated_answers:
            connection.execute(
                """
                INSERT INTO answer (response_id, question_id, value)
                VALUES (?, ?, ?)
                ON CONFLICT(response_id, question_id)
                DO UPDATE SET value = excluded.value
                """,
                (response_id, answer.question_id, answer.value),
            )

        return {"response_id": response_id, "completed": True}


def ensure_public_form(connection, slug: str) -> dict[str, Any]:
    row = get_public_form_row(connection, slug)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published form not found.",
        )
    return row
