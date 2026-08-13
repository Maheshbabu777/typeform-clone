import json
from typing import Any


def parse_json_object(raw: str | None, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    if not raw:
        return fallback.copy() if fallback else {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return fallback.copy() if fallback else {}
    return value if isinstance(value, dict) else fallback.copy() if fallback else {}


def parse_json_array(raw: str | None) -> list[Any]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return value if isinstance(value, list) else []


def dump_json(value: Any) -> str:
    return json.dumps(value, separators=(",", ":"), ensure_ascii=True)

