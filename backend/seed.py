import json
import sqlite3

from app.db_init import init_database


def main() -> None:
    init_database()

    connection = sqlite3.connect("typeform_clone.db")
    connection.execute("PRAGMA foreign_keys = ON")

    connection.execute("INSERT OR IGNORE INTO creator (id, name) VALUES (1, 'Default Creator')")
    connection.execute("DELETE FROM form WHERE public_slug = 'demo-slug'")

    theme_colors = {
        "answer": "#a25fba",
        "background": "#f7f7f8",
        "button": "#3c323e",
        "question": "#3c323e",
        "button_content": "#ffffff",
    }
    settings = {
        "theme_roundness": "small",
        "theme_font_size": "medium",
        "thank_you_text": "Thanks for completing this form.",
    }

    cursor = connection.execute(
        """
        INSERT INTO form (creator_id, title, status, public_slug, theme_colors, settings)
        VALUES (1, 'Demo Form', 'published', 'demo-slug', ?, ?)
        """,
        (json.dumps(theme_colors), json.dumps(settings)),
    )
    form_id = cursor.lastrowid

    connection.execute(
        """
        INSERT INTO question
            (form_id, type, title, description, required, order_index)
        VALUES (?, 'short_text', 'What is your name?', 'First name is fine', 1, 0)
        """,
        (form_id,),
    )
    connection.execute(
        """
        INSERT INTO question
            (form_id, type, title, required, order_index, options)
        VALUES (?, 'multiple_choice', 'Favorite color?', 1, 1, ?)
        """,
        (form_id, json.dumps(["Red", "Blue", "Green"])),
    )
    connection.execute(
        """
        INSERT INTO question
            (form_id, type, title, required, order_index, settings)
        VALUES (?, 'rating', 'How would you rate this form?', 1, 2, ?)
        """,
        (form_id, json.dumps({"max": 5})),
    )

    connection.commit()
    connection.close()
    print("Database seeded with demo-slug.")


if __name__ == "__main__":
    main()
