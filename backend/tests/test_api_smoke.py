
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


def test_form_settings_and_expanded_answer_validation(tmp_path, monkeypatch):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", str(database_path))
    get_settings.cache_clear()
    init_database()

    client = TestClient(app)

    form = client.post("/forms", json={"title": "Validation check"}).json()
    updated = client.put(
        f"/forms/{form['id']}",
        json={"settings": {"skip_welcome_screen": True}},
    ).json()
    assert updated["settings"]["skip_welcome_screen"] is True

    website = client.post(
        f"/forms/{form['id']}/questions",
        json={"type": "website", "title": "Website", "required": True},
    ).json()
    choice = client.post(
        f"/forms/{form['id']}/questions",
        json={
            "type": "multiple_choice",
            "title": "Pick one",
            "required": True,
            "options": ["Alpha", "Beta"],
        },
    ).json()
    rating = client.post(
        f"/forms/{form['id']}/questions",
        json={
            "type": "rating",
            "title": "Rate it",
            "required": True,
            "settings": {"max": 3},
        },
    ).json()

    slug = client.post(f"/forms/{form['id']}/publish").json()["public_slug"]
    invalid_response = client.post(
        f"/public/{slug}/submit",
        json={
            "answers": [
                {"question_id": website["id"], "value": "not-a-url"},
                {"question_id": choice["id"], "value": "Gamma"},
                {"question_id": rating["id"], "value": "5"},
            ]
        },
    )
    assert invalid_response.status_code == 400

    valid_response = client.post(
        f"/public/{slug}/submit",
        json={
            "answers": [
                {"question_id": website["id"], "value": "https://example.com"},
                {"question_id": choice["id"], "value": "Alpha"},
                {"question_id": rating["id"], "value": "3"},
            ]
        },
    )
    assert valid_response.status_code == 201
    assert valid_response.json()["completed"] is True


def test_logic_jumps_skip_unvisited_required_questions(tmp_path, monkeypatch):
    database_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", str(database_path))
    get_settings.cache_clear()
    init_database()

    client = TestClient(app)

    form = client.post("/forms", json={"title": "Logic check"}).json()
    consent = client.post(
        f"/forms/{form['id']}/questions",
        json={"type": "yes_no", "title": "Are you a customer?", "required": True},
    ).json()
    skipped_email = client.post(
        f"/forms/{form['id']}/questions",
        json={"type": "email", "title": "Work email", "required": True},
    ).json()
    destination = client.post(
        f"/forms/{form['id']}/questions",
        json={"type": "short_text", "title": "What can we improve?", "required": True},
    ).json()

    backward_rule = client.post(
        f"/forms/{form['id']}/logic",
        json={
            "question_id": skipped_email["id"],
            "condition_value": "person@example.com",
            "target_question_id": consent["id"],
        },
    )
    assert backward_rule.status_code == 400

    lowercase_yes_no_rule = client.post(
        f"/forms/{form['id']}/logic",
        json={
            "question_id": consent["id"],
            "condition_value": "yes",
            "target_question_id": destination["id"],
        },
    )
    assert lowercase_yes_no_rule.status_code == 400

    rule = client.post(
        f"/forms/{form['id']}/logic",
        json={
            "question_id": consent["id"],
            "condition_value": "Yes",
            "target_question_id": destination["id"],
        },
    ).json()

    backward_update = client.put(
        f"/logic/{rule['id']}",
        json={"target_question_id": consent["id"]},
    )
    assert backward_update.status_code == 400

    invalid_condition_update = client.put(
        f"/logic/{rule['id']}",
        json={"condition_value": "Maybe"},
    )
    assert invalid_condition_update.status_code == 400

    slug = client.post(f"/forms/{form['id']}/publish").json()["public_slug"]

    skipped_required_response = client.post(
        f"/public/{slug}/submit",
        json={
            "answers": [
                {"question_id": consent["id"], "value": "Yes"},
                {"question_id": destination["id"], "value": "Better onboarding"},
            ]
        },
    )
    assert skipped_required_response.status_code == 201

    missing_required_response = client.post(
        f"/public/{slug}/submit",
        json={
            "answers": [
                {"question_id": consent["id"], "value": "No"},
                {"question_id": destination["id"], "value": "Better onboarding"},
            ]
        },
    )
    assert missing_required_response.status_code == 400
    assert f"Question {skipped_email['id']} is required." in missing_required_response.text
