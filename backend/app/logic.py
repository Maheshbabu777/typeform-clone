from typing import Any


def compute_visited_question_ids(
    questions: list[dict[str, Any]],
    logic_rules: list[dict[str, Any]],
    answers_by_question: dict[int, str],
) -> list[int]:
    if not questions:
        return []

    order = [int(question["id"]) for question in questions]
    index_by_id = {question_id: index for index, question_id in enumerate(order)}
    rules_by_source: dict[int, list[dict[str, Any]]] = {}
    for rule in logic_rules:
        rules_by_source.setdefault(int(rule["source_question_id"]), []).append(rule)

    visited: list[int] = []
    current_index = 0
    seen_steps = 0

    while 0 <= current_index < len(order) and seen_steps <= len(order):
        seen_steps += 1
        question_id = order[current_index]
        visited.append(question_id)

        answer_value = answers_by_question.get(question_id)
        matching_rule = next(
            (
                rule
                for rule in rules_by_source.get(question_id, [])
                if answer_value is not None and rule["condition_value"] == answer_value
            ),
            None,
        )

        if matching_rule:
            target_id = matching_rule.get("target_question_id")
            if target_id is None:
                break
            target_index = index_by_id.get(int(target_id))
            if target_index is None or target_index <= current_index:
                break
            current_index = target_index
            continue

        current_index += 1

    return visited

