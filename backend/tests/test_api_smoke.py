
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db_init import init_database
from app.main import app


def test_form_lifecycle_smoke(tmp_path, monkeypatch):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", str(database_path))
    get_settings.cache_clear()
    init_database()

    client = TestClient(app)

    form = client.post("/forms", json={"title": "Customer feedback"}).json()
    assert form["status"] == "draft"

    question = client.post(
        f"/forms/{form['id']}/questions",
        json={
            "type": "email",
            "title": "What is your email?",
            "required": True,
        },
    ).json()
    assert question["order_index"] == 0

    published = client.post(f"/forms/{form['id']}/publish").json()
    slug = published["public_slug"]
    republished = client.post(f"/forms/{form['id']}/publish").json()
    assert republished["public_slug"] == slug

    public_form = client.get(f"/public/{slug}").json()
    assert public_form["questions"][0]["id"] == question["id"]

    started = client.post(f"/public/{slug}/start").json()
    submitted = client.post(
        f"/public/{slug}/submit",
        json={
            "response_id": started["response_id"],
            "answers": [{"question_id": question["id"], "value": "person@example.com"}],
        },
    ).json()
    assert submitted["completed"] is True

    stats = client.get(f"/forms/{form['id']}/stats").json()
    assert stats[0]["counts"][0] == {"value": "person@example.com", "count": 1}

    csv_response = client.get(f"/forms/{form['id']}/export.csv")
    assert csv_response.status_code == 200
    assert "person@example.com" in csv_response.text

    duplicate = client.post(f"/forms/{form['id']}/duplicate").json()
    assert duplicate["status"] == "draft"
    assert duplicate["public_slug"] is None
    assert duplicate["questions"][0]["id"] != question["id"]

