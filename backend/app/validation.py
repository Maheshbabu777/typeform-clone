from typing import Any

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.logic import compute_visited_question_ids
from app.schemas import EmailCheck, PublicAnswer


def validate_public_answers(
    questions: list[dict[str, Any]],
    logic_rules: list[dict[str, Any]],
    answers: list[PublicAnswer],
) -> list[PublicAnswer]:
    question_by_id = {int(question["id"]): question for question in questions}
    answers_by_question = {answer.question_id: answer.value.strip() for answer in answers}

    unknown_ids = set(answers_by_question) - set(question_by_id)
    if unknown_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown question IDs: {sorted(unknown_ids)}",
        )

    visited_ids = set(compute_visited_question_ids(questions, logic_rules, answers_by_question))
    for question_id in visited_ids:
        question = question_by_id[question_id]
        raw_value = answers_by_question.get(question_id, "")
        if question["required"] and not raw_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question_id} is required.",
            )
        if raw_value:
            validate_answer_value(question, raw_value)

    return [
        PublicAnswer(question_id=question_id, value=value)
        for question_id, value in answers_by_question.items()
        if question_id in visited_ids and value
    ]


def validate_answer_value(question: dict[str, Any], value: str) -> None:
    question_type = question["type"]
    if question_type == "email":
        try:
            EmailCheck(email=value)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a valid email.",
            ) from exc
    elif question_type == "number":
        try:
            float(value)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a number.",
            ) from exc

