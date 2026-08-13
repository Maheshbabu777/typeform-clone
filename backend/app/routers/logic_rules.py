from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.database import get_connection
from app.json_fields import parse_json_array, parse_json_object
from app.repositories import fetch_one, list_logic_rules
from app.routers.forms import ensure_form, ensure_question_belongs_to_form
from app.routers.questions import touch_form
from app.schemas import LogicRuleCreate, LogicRuleUpdate
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
        source_question = ensure_question_belongs_to_form(
            connection, form_id, payload.source_question_id
        )
        ensure_logic_source_can_branch(connection, form_id, source_question)
        ensure_logic_condition_matches_question(source_question, payload.condition_value)
        if payload.target_question_id is not None:
            target_question = ensure_question_belongs_to_form(
                connection, form_id, payload.target_question_id
            )
            ensure_forward_logic_target(source_question, target_question)
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


@router.put("/logic/{logic_id}")
def update_logic_rule(logic_id: int, payload: LogicRuleUpdate) -> dict[str, Any]:
    with get_connection() as connection:
        row = fetch_one(connection, "SELECT * FROM logic_rule WHERE id = ?", (logic_id,))
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Logic rule not found.",
            )

        form_id = row["form_id"]
        update_data = payload.model_dump(exclude_unset=True)

        if not update_data:
            return serialize_logic_rule(row)

        source_question = ensure_question_belongs_to_form(
            connection, form_id, row["source_question_id"]
        )
        if "condition_value" in update_data:
            ensure_logic_condition_matches_question(source_question, update_data["condition_value"])
        if "target_question_id" in update_data:
            ensure_logic_source_can_branch(connection, form_id, source_question)
        if "target_question_id" in update_data and update_data["target_question_id"] is not None:
            target_question = ensure_question_belongs_to_form(
                connection, form_id, update_data["target_question_id"]
            )
            ensure_forward_logic_target(source_question, target_question)

        set_clauses = []
        values = []
        for key, value in update_data.items():
            set_clauses.append(f"{key} = ?")
            values.append(value)

        values.append(logic_id)

        connection.execute(
            f"UPDATE logic_rule SET {', '.join(set_clauses)} WHERE id = ?",
            tuple(values),
        )
        touch_form(connection, form_id)

        updated_row = fetch_one(connection, "SELECT * FROM logic_rule WHERE id = ?", (logic_id,))
        return serialize_logic_rule(updated_row)


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


def ensure_forward_logic_target(
    source_question: dict[str, Any],
    target_question: dict[str, Any],
) -> None:
    if int(target_question["order_index"]) <= int(source_question["order_index"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logic jumps can only target later questions.",
        )


def ensure_logic_source_can_branch(
    connection,
    form_id: int,
    source_question: dict[str, Any],
) -> None:
    if source_question["type"] == "statement":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statement blocks cannot be used as logic jump sources.",
        )

    later_question = fetch_one(
        connection,
        """
        SELECT id FROM question
        WHERE form_id = ? AND order_index > ?
        LIMIT 1
        """,
        (form_id, source_question["order_index"]),
    )
    if later_question is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logic jumps require at least one later question to skip.",
        )


def ensure_logic_condition_matches_question(
    source_question: dict[str, Any],
    condition_value: str,
) -> None:
    question_type = source_question["type"]

    if question_type in {"multiple_choice", "dropdown"}:
        options = parse_json_array(source_question.get("options"))
        if condition_value not in options:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logic condition must match one of the source question options.",
            )
    elif question_type == "yes_no":
        if condition_value not in {"Yes", "No"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logic condition for yes/no questions must be Yes or No.",
            )
    elif question_type == "rating":
        settings = parse_json_object(source_question.get("settings"))
        max_rating = settings.get("max", settings.get("scale_max", 5))
        try:
            rating_value = int(condition_value)
            rating_max = int(max_rating)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logic condition for rating questions must be a valid rating.",
            ) from exc
        if rating_value < 1 or rating_value > rating_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Logic condition rating must be between 1 and {rating_max}.",
            )
