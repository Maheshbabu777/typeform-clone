from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.database import get_connection
from app.repositories import fetch_one, list_logic_rules
from app.routers.forms import ensure_form, ensure_question_belongs_to_form
from app.routers.questions import touch_form
from app.schemas import LogicRuleCreate
from app.serializers import serialize_logic_rule

router = APIRouter(tags=["logic"])


@router.get("/forms/{form_id}/logic")
def get_logic_rules(form_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        return [serialize_logic_rule(row) for row in list_logic_rules(connection, form_id)]


@router.post("/forms/{form_id}/logic", status_code=status.HTTP_201_CREATED)
def create_logic_rule(form_id: int, payload: LogicRuleCreate) -> dict[str, Any]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        ensure_question_belongs_to_form(connection, form_id, payload.source_question_id)
        if payload.target_question_id is not None:
            ensure_question_belongs_to_form(connection, form_id, payload.target_question_id)
        cursor = connection.execute(
            """
            INSERT INTO logic_rule
                (form_id, source_question_id, operator, condition_value, target_question_id)
            VALUES (?, ?, 'equals', ?, ?)
            """,
            (
                form_id,
                payload.source_question_id,
                payload.condition_value,
                payload.target_question_id,
            ),
        )
        touch_form(connection, form_id)
        row = fetch_one(connection, "SELECT * FROM logic_rule WHERE id = ?", (cursor.lastrowid,))
        return serialize_logic_rule(row)


@router.delete("/logic/{logic_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_logic_rule(logic_id: int) -> Response:
    with get_connection() as connection:
        row = fetch_one(connection, "SELECT * FROM logic_rule WHERE id = ?", (logic_id,))
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Logic rule not found.",
            )
        connection.execute("DELETE FROM logic_rule WHERE id = ?", (logic_id,))
        touch_form(connection, row["form_id"])
    return Response(status_code=status.HTTP_204_NO_CONTENT)
