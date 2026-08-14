from csv import writer
from io import StringIO
from typing import Any

from fastapi import APIRouter, HTTPException, Response, status

from app.database import get_connection
from app.repositories import fetch_all, fetch_one, list_questions
from app.routers.forms import ensure_form

router = APIRouter(tags=["results"])

def sanitize_csv_cell(val: Any) -> str:
    s = str(val)
    if s and s[0] in ("=", "+", "-", "@"):
        return f"'{s}"
    return s


@router.get("/forms/{form_id}/responses")
def list_form_responses(form_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        return fetch_all(
            connection,
            """
            SELECT
                response.*,
                COUNT(answer.id) AS answer_count
            FROM response
            LEFT JOIN answer ON answer.response_id = response.id
            WHERE response.form_id = ?
            GROUP BY response.id
            ORDER BY response.started_at DESC, response.id DESC
            """,
            (form_id,),
        )


@router.get("/responses/{response_id}")
def get_response(response_id: int) -> dict[str, Any]:
    with get_connection() as connection:
        response = fetch_one(connection, "SELECT * FROM response WHERE id = ?", (response_id,))
        if response is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Response not found.")
        ensure_form(connection, response["form_id"])
        answers = fetch_all(
            connection,
            """
            SELECT answer.*, question.title, question.type
            FROM answer
            JOIN question ON question.id = answer.question_id
            WHERE answer.response_id = ?
            ORDER BY question.order_index ASC
            """,
            (response_id,),
        )
        return response | {"answers": answers}


@router.get("/forms/{form_id}/stats")
def get_form_stats(form_id: int) -> list[dict[str, Any]]:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        stats: list[dict[str, Any]] = []
        for question in list_questions(connection, form_id):
            counts = fetch_all(
                connection,
                """
                SELECT value, COUNT(*) AS count
                FROM answer
                WHERE question_id = ?
                GROUP BY value
                ORDER BY count DESC, value ASC
                """,
                (question["id"],),
            )
            stats.append(
                {
                    "question_id": question["id"],
                    "title": question["title"],
                    "counts": counts,
                }
            )
        return stats


@router.get("/forms/{form_id}/export.csv")
def export_form_csv(form_id: int) -> Response:
    with get_connection() as connection:
        ensure_form(connection, form_id)
        questions = list_questions(connection, form_id)
        responses = fetch_all(
            connection,
            "SELECT * FROM response WHERE form_id = ? ORDER BY started_at ASC, id ASC",
            (form_id,),
        )
        answers = fetch_all(
            connection,
            """
            SELECT answer.response_id, answer.question_id, answer.value
            FROM answer
            JOIN response ON response.id = answer.response_id
            WHERE response.form_id = ?
            """,
            (form_id,),
        )

    answers_by_response = {
        (int(answer["response_id"]), int(answer["question_id"])): answer["value"]
        for answer in answers
    }
    output = StringIO()
    csv_writer = writer(output)
    csv_writer.writerow(
        [
            "response_id",
            "started_at",
            "completed_at",
            *[question["title"] for question in questions],
        ]
    )
    for response in responses:
        csv_writer.writerow(
            [
                response["id"],
                response["started_at"],
                response["completed_at"],
                *[
                    sanitize_csv_cell(answers_by_response.get((int(response["id"]), int(question["id"])), ""))
                    for question in questions
                ],
            ]
        )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="form-{form_id}-responses.csv"'},
    )
