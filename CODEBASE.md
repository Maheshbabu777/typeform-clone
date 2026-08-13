# Codebase Guide

This file explains the current Typeform clone codebase for the project owner and for future developers or agents. It describes the folder structure, request flow, and every current function/class/component.

Update this file whenever a function, class, route handler, or important component is added, removed, renamed, or materially changed.

## Project Shape

```text
Typeform/
  backend/   FastAPI + SQLite API
  frontend/  Next.js App Router UI
  docs/      Human-readable API and phase-plan docs
  AGENTS.md  Decision history and rationale
```

## Runtime Flow

The frontend calls the FastAPI backend over HTTP. The backend owns persistence, validation, publishing rules, response collection, logic-jump evaluation, stats, and CSV export.

The SQLite schema is fixed and lives in `backend/schema.sql`. Dynamic form shape is represented as rows in `question` and `answer`, not by creating new tables per form. JSON-like settings are stored as JSON strings in normal SQLite `TEXT` columns.

## Backend Overview

### `backend/app/main.py`

FastAPI application entry point. It creates the app, configures CORS, defines health checking, and mounts all routers.

| Function | Description |
|---|---|
| `health_check()` | Handles `GET /health`. Returns `{"status": "ok"}` so local tooling, deployment platforms, or humans can quickly confirm that the API process is alive. |

### `backend/app/config.py`

Central settings module. Reads environment variables once and exposes normalized settings to the rest of the backend.

| Class / Function | Description |
|---|---|
| `Settings` | Pydantic settings class. Stores `app_name`, `DATABASE_URL`, and `ALLOWED_ORIGINS`. Also exposes computed helpers for database path and CORS origins. |
| `Settings.database_path` | Converts `DATABASE_URL` into a filesystem path. Absolute paths are preserved; relative paths are resolved from the `backend` directory. |
| `Settings.cors_origins` | Splits the comma-separated `ALLOWED_ORIGINS` string into a clean list for FastAPI CORS middleware. |
| `get_settings()` | Cached settings factory. Keeps configuration access consistent and avoids reparsing environment variables on every request. Tests can clear its cache when swapping environment values. |

### `backend/app/constants.py`

Shared constants for app defaults and valid domain values.

| Constant | Description |
|---|---|
| `DEFAULT_CREATOR_ID` | The hardcoded creator ID, currently `1`, matching the assignment's simplified no-auth scope. |
| `QUESTION_TYPES` | Set of valid question type identifiers supported by the schema and API. |
| `DEFAULT_THEME_COLORS` | Default 5-color respondent theme: answer, background, button, question, and button content. |
| `DEFAULT_FORM_SETTINGS` | Default form settings stored in JSON, including description, thank-you text, roundness, and font-size preset. |

### `backend/app/database.py`

SQLite connection utilities. Every runtime connection enables foreign keys.

| Function | Description |
|---|---|
| `dict_factory(cursor, row)` | Converts SQLite result rows into dictionaries keyed by column name. This keeps route and serializer code readable. |
| `connect()` | Opens a SQLite connection to the configured database, creates the parent directory if needed, sets row output to dictionaries, and runs `PRAGMA foreign_keys = ON`. |
| `get_connection()` | Context manager for database work. Commits when the block succeeds, rolls back on exceptions, and always closes the connection. |

### `backend/app/db_init.py`

Database initialization entry point.

| Function | Description |
|---|---|
| `init_database()` | Reads `backend/schema.sql` and executes it against the configured SQLite database. Safe for local setup because tables and indexes use `IF NOT EXISTS`, and the default creator uses `INSERT OR IGNORE`. |

### `backend/app/json_fields.py`

Safe helpers for JSON-as-TEXT columns.

| Function | Description |
|---|---|
| `parse_json_object(raw, fallback=None)` | Parses a JSON string into a dictionary. If the string is empty, invalid, or not an object, returns a copy of the fallback or `{}`. |
| `parse_json_array(raw)` | Parses a JSON string into a list. If the string is empty, invalid, or not a list, returns `[]`. |
| `dump_json(value)` | Serializes a Python value to compact ASCII JSON for storage in SQLite `TEXT` columns. |

### `backend/app/repositories.py`

Small data-access helpers shared by route modules. These are intentionally thin so business behavior stays readable in routers and validation modules.

| Function | Description |
|---|---|
| `generate_slug(length=10)` | Generates a random public slug using letters and digits. Used for publish links. |
| `fetch_one(connection, query, params=())` | Runs a SQL query and returns one dictionary row or `None`. |
| `fetch_all(connection, query, params=())` | Runs a SQL query and returns all rows as a list of dictionaries. |
| `get_form_row(connection, form_id)` | Fetches one form owned by the default creator. Enforces the single-creator ownership rule for `/forms*` routes. |
| `get_public_form_row(connection, slug)` | Fetches one published form by public slug. Draft forms and missing slugs return `None`. |
| `list_questions(connection, form_id)` | Returns a form's questions ordered by `order_index`, then ID for stable ordering. |
| `list_logic_rules(connection, form_id)` | Returns all logic rules for a form ordered by ID. |
| `create_unique_slug(connection)` | Tries up to 20 generated slugs and returns the first one not already used by a form. Raises if it cannot find one. |
| `build_form_settings(row, updates)` | Merges default form settings, existing settings JSON, and new updates, then returns JSON for storage. |
| `default_theme_colors_json()` | Returns the default respondent theme colors serialized as JSON. |

### `backend/app/schemas.py`

Pydantic request models. These validate incoming JSON before route handlers touch the database.

| Class / Function | Description |
|---|---|
| `FormCreate` | Request body for creating a form. Requires a non-empty title. |
| `FormUpdate` | Request body for partially updating a form's title, description, theme colors, roundness, font-size preset, or thank-you text. |
| `QuestionCreate` | Request body for creating a question. Validates type, title, description, required flag, options, and settings. |
| `QuestionCreate.clean_options()` | Field validator that trims option labels and removes blank options. |
| `QuestionUpdate` | Request body for partially updating a question's type, title, description, required flag, options, or settings. |
| `ReorderQuestions` | Request body for question reordering. Requires at least one ordered question ID. |
| `LogicRuleCreate` | Request body for adding a logic jump. Accepts both `question_id` and `source_question_id` as input names and stores the source question ID internally. |
| `PublicAnswer` | One submitted answer from a respondent: `question_id` plus string `value`. |
| `PublicSubmit` | Public submit payload. `response_id` is optional so submit still works if `/start` failed. |
| `EmailCheck` | Tiny validation model used to validate email answer values with Pydantic's email validator. |

### `backend/app/serializers.py`

Transforms database rows into API-friendly response objects.

| Function | Description |
|---|---|
| `serialize_question(row)` | Converts a `question` table row into API JSON, including parsed `options`, parsed `settings`, and boolean `required`. |
| `serialize_logic_rule(row)` | Converts a `logic_rule` row into API JSON using domain-friendly field names. |
| `serialize_form(row)` | Converts a `form` row into API JSON, merging default settings/theme colors with stored JSON settings. Exposes description, theme presets, and thank-you text as top-level fields. |

### `backend/app/logic.py`

Logic-jump path evaluator.

| Function | Description |
|---|---|
| `compute_visited_question_ids(questions, logic_rules, answers_by_question)` | Simulates the respondent's path through ordered questions. Applies `equals` logic rules when an answer matches `condition_value`. Returns the question IDs actually visited, which is critical because skipped required questions must not block submission. Stops on jump-to-end, invalid backward jumps, missing targets, or after a safety limit. |

### `backend/app/validation.py`

Server-side validation for public submissions.

| Function | Description |
|---|---|
| `validate_public_answers(questions, logic_rules, answers)` | Validates respondent answers against the form definition. Rejects unknown question IDs, computes the visited path, enforces required only for visited questions, validates answer types, drops answers for skipped questions, and returns cleaned answers. |
| `validate_answer_value(question, value)` | Validates a single non-empty answer based on question type. Currently checks email format for `email` questions and numeric parsing for `number` questions. |

## Backend Routers

### `backend/app/routers/forms.py`

Creator-facing form routes. All routes operate under the default creator ID.

| Function | Description |
|---|---|
| `create_form(payload)` | Handles `POST /forms`. Creates a draft form with default theme colors and settings. |
| `list_forms()` | Handles `GET /forms`. Lists forms for creator `id = 1`, including completed response count, newest updated first. |
| `get_form(form_id)` | Handles `GET /forms/{form_id}`. Returns one form plus its questions and logic rules. |
| `update_form(form_id, payload)` | Handles `PUT /forms/{form_id}`. Partially updates title, theme colors, and JSON-backed settings such as description and thank-you text. |
| `delete_form(form_id)` | Handles `DELETE /forms/{form_id}`. Deletes the form; SQLite cascades questions, logic rules, responses, and answers. |
| `publish_form(form_id)` | Handles `POST /forms/{form_id}/publish`. Publishes a form and creates a public slug only if one does not already exist, preserving old shared links. |
| `unpublish_form(form_id)` | Handles `POST /forms/{form_id}/unpublish`. Sets status back to draft but keeps the existing public slug. |
| `duplicate_form(form_id)` | Handles `POST /forms/{form_id}/duplicate`. Deep-copies form settings, questions, and logic rules. Logic rule source/target question IDs are remapped to the copied questions. |
| `ensure_form(connection, form_id)` | Internal guard that returns a form or raises `404` if it does not exist for the default creator. |
| `ensure_question_belongs_to_form(connection, form_id, question_id)` | Internal guard that confirms a question belongs to a form. Raises `400` for invalid cross-form references. |

### `backend/app/routers/questions.py`

Creator-facing question routes.

| Function | Description |
|---|---|
| `get_questions(form_id)` | Handles `GET /forms/{form_id}/questions`. Returns a form's ordered questions. |
| `create_question(form_id, payload)` | Handles `POST /forms/{form_id}/questions`. Appends a new question at the end of the form. |
| `update_question(question_id, payload)` | Handles `PUT /questions/{question_id}`. Partially updates editable question fields and touches the parent form timestamp. |
| `delete_question(question_id)` | Handles `DELETE /questions/{question_id}`. Deletes the question, lets foreign keys handle logic cleanup, reindexes remaining questions, and touches the form. |
| `reorder_questions(form_id, payload)` | Handles `PUT /forms/{form_id}/questions/reorder`. Requires exactly all question IDs for the form and rewrites `order_index`. |
| `ensure_question(connection, question_id)` | Internal guard that returns a question or raises `404`. |
| `reindex_questions(connection, form_id)` | Internal helper that rewrites order indexes from zero after a deletion. |
| `touch_form(connection, form_id)` | Internal helper that updates `form.updated_at` after question or logic changes. |

### `backend/app/routers/logic_rules.py`

Creator-facing logic-jump routes.

| Function | Description |
|---|---|
| `get_logic_rules(form_id)` | Handles `GET /forms/{form_id}/logic`. Returns all logic rules for a form. |
| `create_logic_rule(form_id, payload)` | Handles `POST /forms/{form_id}/logic`. Validates source and target questions belong to the form, then creates one `equals` logic rule. |
| `delete_logic_rule(logic_id)` | Handles `DELETE /logic/{logic_id}`. Deletes one logic rule and touches the parent form timestamp. |

### `backend/app/routers/public.py`

Public no-auth respondent routes.

| Function | Description |
|---|---|
| `get_public_form(slug)` | Handles `GET /public/{slug}`. Returns a published form plus questions, logic, and theme. Draft or missing forms return `404`. |
| `start_public_response(slug)` | Handles `POST /public/{slug}/start`. Creates a partial response row with server-generated `started_at` and returns `response_id`. |
| `submit_public_response(slug, payload)` | Handles `POST /public/{slug}/submit`. Validates answers, completes an existing started response if `response_id` is present, or creates and completes a response if absent. |
| `ensure_public_form(connection, slug)` | Internal guard that returns a published form or raises `404`. |

### `backend/app/routers/results.py`

Creator-facing results, stats, and export routes.

| Function | Description |
|---|---|
| `list_form_responses(form_id)` | Handles `GET /forms/{form_id}/responses`. Lists responses with answer count, including partial responses. |
| `get_response(response_id)` | Handles `GET /responses/{response_id}`. Returns one response plus joined answer/question details. |
| `get_form_stats(form_id)` | Handles `GET /forms/{form_id}/stats`. Returns per-question grouped answer counts. |
| `export_form_csv(form_id)` | Handles `GET /forms/{form_id}/export.csv`. Streams a CSV with one row per response and one column per question. |

## Backend Tests

### `backend/tests/test_api_smoke.py`

| Function | Description |
|---|---|
| `test_form_lifecycle_smoke(tmp_path, monkeypatch)` | End-to-end API smoke test using FastAPI's `TestClient` and a temporary SQLite database. Covers form creation, question creation, publish slug stability, public load, `/start`, `/submit`, stats, CSV export, and duplication. |

## Frontend Overview

The frontend has a working respondent flow at `/f/[slug]`. Dashboard, builder, and results screens are still placeholders for later phases.

### `frontend/src/app/layout.tsx`

| Component | Description |
|---|---|
| `RootLayout({ children })` | Next.js root layout. Sets the HTML language, imports global CSS, and renders all route content inside `<body>`. |

### `frontend/src/app/page.tsx`

| Component | Description |
|---|---|
| `DashboardPage()` | Current placeholder dashboard route for `/`. Establishes the app-shell look and confirms the frontend scaffold is rendering. |

### `frontend/src/app/forms/[id]/edit/page.tsx`

| Component | Description |
|---|---|
| `BuilderPage()` | Main client orchestrator for the Creator Form Builder. Fetches the form, manages local state, and renders the three-pane layout (Question List, Editor, and Live Preview). |

### `frontend/src/app/f/[slug]/page.tsx`

| Component | Description |
|---|---|
| `PublicFormPage({ params })` | Server route for the public respondent flow. Loads a published form via `GET /public/{slug}` and renders `RespondentFlow`. Calls `notFound()` when the form is missing or unpublished. |

### `frontend/src/app/f/[slug]/not-found.tsx`

| Component | Description |
|---|---|
| `PublicFormNotFound()` | Static 404 UI for invalid or unpublished public form links. |

### `frontend/src/app/f/[slug]/layout.tsx`

| Component | Description |
|---|---|
| `PublicFormLayout({ children })` | Pass-through layout for the respondent route so the public flow can stay isolated from the app shell. |

### `frontend/src/lib/utils.ts`

| Function | Description |
|---|---|
| `cn(...inputs)` | Utility that combines `clsx` and `tailwind-merge`. Use it for conditional Tailwind class composition without duplicate/conflicting classes. |

### `frontend/src/lib/types.ts`

Shared frontend TypeScript types for public form payloads, questions, logic rules, theme presets, and submit requests.

| Type | Description |
|---|---|
| `QuestionType` | Union of the supported question type identifiers (e.g., short_text, multiple_choice, phone_number, etc.). |
| `ThemeRoundness` | Respondent roundness preset: `none`, `small`, or `large`. |
| `ThemeFontSize` | Respondent font-size preset: `small`, `medium`, or `large`. |
| `ThemeColors` | Five-color respondent theme object returned by the API. |
| `Question` | Serialized question shape from the backend. |
| `LogicRule` | Serialized logic-jump rule shape from the backend. |
| `PublicForm` | Full published form payload including questions and logic. |
| `PublicAnswerPayload` | One answer sent to `/public/{slug}/submit`. |
| `PublicSubmitPayload` | Submit payload with optional `response_id` and answer list. |

### `frontend/src/lib/api.ts`

HTTP helpers for the public respondent endpoints.

| Function / Class | Description |
|---|---|
| `ApiError` | Typed fetch error carrying HTTP status and message. |
| `getPublicForm(slug)` | Calls `GET /public/{slug}` and returns the published form payload. |
| `startPublicResponse(slug)` | Calls `POST /public/{slug}/start` and returns `{response_id}`. |
| `submitPublicResponse(slug, payload)` | Calls `POST /public/{slug}/submit` and returns completion metadata. |

### `frontend/src/lib/api-creator.ts`

| Function | Description |
|---|---|
| `createForm`, `getForm`, `updateForm`, `deleteForm` | Wrappers for standard Form CRUD operations. |
| `duplicateForm`, `publishForm`, `unpublishForm` | Wrappers for Form life-cycle actions. |
| `createQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions` | Wrappers for Question CRUD and reordering. |
| `createLogicRule`, `deleteLogicRule` | Wrappers for Logic Jump CRUD. |

### `frontend/src/lib/theme.ts`

Respondent-theme helpers derived from the build spec's RX token model.

| Constant / Function | Description |
|---|---|
| `ROUNDNESS_PX` | Maps roundness presets to pixel radii. |
| `FONT_SCALE` | Maps font-size presets to desktop/mobile typography sizes. |
| `withOpacity(hex, opacity)` | Converts a hex color to an rgba string at the requested opacity. |
| `isLightBackground(hex)` | HSV-based helper for light/dark background detection. |
| `buildThemeStyle(colors, roundness, fontSize)` | Builds CSS custom properties and base inline styles for the respondent theme wrapper. |

### `frontend/src/lib/logic.ts`

Client-side logic-jump path evaluation, mirrored from the backend.

| Function | Description |
|---|---|
| `computeVisitedQuestionIds(questions, logicRules, answersByQuestion)` | Simulates the respondent path through ordered questions, applying `equals` logic rules. |
| `getNextQuestionId(currentQuestionId, questions, logicRules, answersByQuestion)` | Returns the next visited question ID after the current one, or `null` at the end of the path. |
| `getProgressValue(currentQuestionId, questions, logicRules, answersByQuestion)` | Computes progress-bar fill based on position within the visited path. |

### `frontend/src/lib/validation.ts`

| Function | Description |
|---|---|
| `validateAnswer(question, rawValue)` | Client-side validation for required fields, email format, and numeric answers before advancing or submitting. |

### `frontend/src/components/respondent/theme-provider.tsx`

| Component | Description |
|---|---|
| `ThemeProvider({ form, children })` | Wraps the respondent flow with per-form CSS variables for colors, radius, and typography. |

### `frontend/src/components/respondent/progress-bar.tsx`

| Component | Description |
|---|---|
| `ProgressBar({ value })` | Fixed top progress bar for the respondent flow. Uses the form button color and animates width changes. |

### `frontend/src/components/respondent/answer-input.tsx`

| Component | Description |
|---|---|
| `AnswerInput({ question, value, onChange, onSubmit, autoFocus })` | Renders the input UI for all eight question types. Choice-based types auto-advance after selection. |
| `ChoiceButton({ label, selected, onClick })` | Internal choice-row button used by multiple-choice and yes/no questions. |

### `frontend/src/components/respondent/question-renderer.tsx`

| Component | Description |
|---|---|
| `QuestionRenderer({ question, questionNumber, value, error, onChange, onSubmit, showOkButton, isSubmitting })` | Full-screen question card with title, description, answer input, inline validation, and OK/Enter affordance. |

### `frontend/src/components/respondent/respondent-flow.tsx`

| Component | Description |
|---|---|
| `RespondentFlow({ form, slug })` | Main client orchestrator for landing → one-question-at-a-time flow → thank-you. Calls `/start` on begin, tracks answers locally, evaluates logic jumps client-side for navigation/progress, and submits on completion. |

### `frontend/src/components/builder/question-list.tsx`

| Component | Description |
|---|---|
| `QuestionList({ questions, ... })` | Renders the Left Rail using `@dnd-kit` for sortable drag-and-drop question reordering, and a Plus menu to add new questions. |

### `frontend/src/components/builder/add-content-modal.tsx`

| Component | Description |
|---|---|
| `AddContentModal({ isOpen, onClose, onSelectType })` | Full-screen modal that displays all available question types in categorized grids, including placeholders for "Coming Soon" elements. |

### `frontend/src/components/builder/question-editor.tsx`

| Component | Description |
|---|---|
| `QuestionEditor({ question, onChange })` | Renders the Center Pane. Exposes inputs for title, description, and required toggle. Conditionally renders option editors for choice types and max-scale for ratings. Uses a 500ms debounce to trigger `onChange`. |

### `frontend/src/components/builder/theme-settings.tsx`

| Component | Description |
|---|---|
| `ThemeSettings({ form, onClose, onUpdate })` | Renders a modal/side-panel to edit the 5 theme colors, roundness, font size, and thank-you text. |

## Frontend Configuration Files

These are not runtime functions, but they shape how the frontend is built.

| File | Description |
|---|---|
| `frontend/package.json` | Defines Next.js scripts and frontend dependencies. |
| `frontend/next.config.ts` | Next.js configuration. Currently enables React strict mode. |
| `frontend/tailwind.config.ts` | Tailwind config, app-shell theme tokens, shadcn-compatible CSS variable colors, and content globs. |
| `frontend/postcss.config.mjs` | PostCSS config used by Tailwind. |
| `frontend/components.json` | shadcn/ui configuration. Components should be generated into the repo instead of runtime-imported as a component library. |
| `frontend/tsconfig.json` | TypeScript config. Next 16 updated JSX/runtime-related settings during build validation. |
| `frontend/src/app/globals.css` | Global Tailwind layers, light/dark app-shell CSS variables, base styles, Inter-first font stack, and respondent-flow focus styles for `.rx-theme`. |
| `frontend/.env.local.example` | Example frontend environment variables for API and app URL configuration. |

## Docs

| File | Description |
|---|---|
| `docs/api-contract.md` | Human-readable API contract, including the added `/public/{slug}/start` endpoint. |
| `docs/phase-plan.md` | Compact phase plan copied from the approved build direction. |

## Important Implementation Notes

- The backend currently stores form-level `description`, `thank_you_text`, `theme_roundness`, and `theme_font_size` in `form.settings` JSON because the final schema has no `form.description` column.
- The backend always enables `PRAGMA foreign_keys = ON` per connection through `connect()`.
- Public form submission does not require `/start` to succeed first. If `response_id` is absent, `/submit` creates and completes a response in one request.
- Logic rules are evaluated server-side during public submission so skipped required questions do not block valid submissions.
- `AGENTS.md` is the decision log; this file is the code-reading guide.
