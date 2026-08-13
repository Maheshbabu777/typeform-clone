-- ============================================================
-- Typeform Clone - Final SQLite Schema
-- ============================================================
-- Run this once per fresh database file. The PRAGMA below must
-- ALSO be set on every connection your app opens at runtime.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creator (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL DEFAULT 'Default Creator',
    email       TEXT UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS form (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id      INTEGER NOT NULL REFERENCES creator(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published')),
    public_slug     TEXT UNIQUE,
    theme_id        TEXT,
    theme_colors    TEXT,
    settings        TEXT DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_form_creator ON form(creator_id);
CREATE INDEX IF NOT EXISTS idx_form_status ON form(status);

CREATE TABLE IF NOT EXISTS question (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id         INTEGER NOT NULL REFERENCES form(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN
                        ('short_text', 'long_text', 'multiple_choice', 'dropdown',
                         'email', 'number', 'yes_no', 'rating')),
    title           TEXT NOT NULL,
    description     TEXT,
    required        INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
    order_index     INTEGER NOT NULL,
    options         TEXT,
    settings        TEXT DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_question_form ON question(form_id);
CREATE INDEX IF NOT EXISTS idx_question_form_order ON question(form_id, order_index);

CREATE TABLE IF NOT EXISTS logic_rule (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id             INTEGER NOT NULL REFERENCES form(id) ON DELETE CASCADE,
    source_question_id  INTEGER NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    operator            TEXT NOT NULL DEFAULT 'equals',
    condition_value     TEXT NOT NULL,
    target_question_id  INTEGER REFERENCES question(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logic_form ON logic_rule(form_id);
CREATE INDEX IF NOT EXISTS idx_logic_source ON logic_rule(source_question_id);

CREATE TABLE IF NOT EXISTS response (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id         INTEGER NOT NULL REFERENCES form(id) ON DELETE CASCADE,
    started_at      TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at    TEXT,
    metadata        TEXT DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_response_form ON response(form_id);
CREATE INDEX IF NOT EXISTS idx_response_completed ON response(form_id, completed_at);

CREATE TABLE IF NOT EXISTS answer (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    response_id   INTEGER NOT NULL REFERENCES response(id) ON DELETE CASCADE,
    question_id   INTEGER NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    value         TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answer_response ON answer(response_id);
CREATE INDEX IF NOT EXISTS idx_answer_question ON answer(question_id);

INSERT OR IGNORE INTO creator (id, name) VALUES (1, 'Default Creator');

