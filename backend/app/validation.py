from datetime import date
from typing import Any
from urllib.parse import urlparse

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.json_fields import parse_json_array, parse_json_object
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
        if question["type"] == "statement":
            continue
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
    elif question_type == "website":
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a valid website URL.",
            )
    elif question_type == "date":
        try:
            date.fromisoformat(value)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a valid date.",
            ) from exc
    elif question_type == "phone_number":
        normalized = value.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        normalized = normalized.replace(".", "")
        if normalized.startswith("+"):
            normalized = normalized[1:]
        if not normalized.isdigit() or len(normalized) < 7:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a valid phone number.",
            )
    elif question_type in {"multiple_choice", "dropdown"}:
        options = parse_json_array(question.get("options"))
        if value not in options:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires one of its configured options.",
            )
    elif question_type == "yes_no":
        if value not in {"Yes", "No"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires Yes or No.",
            )
    elif question_type == "rating":
        settings = parse_json_object(question.get("settings"))
        max_rating = settings.get("max", settings.get("scale_max", 5))
        try:
            rating_value = int(value)
            rating_max = int(max_rating)
        except (TypeError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} requires a valid rating.",
            ) from exc
        if rating_value < 1 or rating_value > rating_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question['id']} rating must be between 1 and {rating_max}.",
            )
