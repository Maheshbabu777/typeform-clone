import sqlite3

conn = sqlite3.connect('typeform_clone.db')
c = conn.cursor()

# Make sure creator exists
c.execute("INSERT OR IGNORE INTO creator (id, name) VALUES (1, 'Default Creator')")

# Create a published form with a fixed slug
c.execute("INSERT INTO form (creator_id, title, status, public_slug, theme_colors, settings) VALUES (1, 'Demo Form', 'published', 'demo-slug', '{\"answer\":\"#a25fba\",\"background\":\"#f7f7f8\",\"button\":\"#3c323e\",\"question\":\"#3c323e\",\"button_content\":\"#ffffff\"}', '{\"theme_roundness\":\"small\",\"theme_font_size\":\"medium\"}')")
form_id = c.lastrowid

# Insert questions
c.execute("INSERT INTO question (form_id, type, title, description, required, order_index) VALUES (?, 'short_text', 'What is your name?', 'First name is fine', 1, 0)", (form_id,))
c.execute("INSERT INTO question (form_id, type, title, required, order_index, options) VALUES (?, 'multiple_choice', 'Favorite color?', 1, 1, '[\"Red\", \"Blue\", \"Green\"]')", (form_id,))
c.execute("INSERT INTO question (form_id, type, title, required, order_index, settings) VALUES (?, 'rating', 'How would you rate this form?', 1, 2, '{\"scale\": 5}')", (form_id,))

conn.commit()
conn.close()
print('Database seeded with demo-slug!')
