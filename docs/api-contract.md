# API Contract

The backend is environment-agnostic. It returns `public_slug` values, and the frontend constructs public URLs as `{NEXT_PUBLIC_APP_URL}/f/{slug}`.

## Forms

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/forms` | `{title}` | Creates a draft for creator `id = 1`. |
| GET | `/forms` | - | Lists forms with status and response count. |
| GET | `/forms/{id}` | - | Returns full form including questions, logic, and theme. |
| PUT | `/forms/{id}` | `{title?, description?, theme_colors?, theme_roundness?, theme_font_size?, thank_you_text?}` | Partial update. |
| DELETE | `/forms/{id}` | - | Cascades form data. |
| POST | `/forms/{id}/duplicate` | - | Deep-copies form, questions, and remapped logic rules. |
| POST | `/forms/{id}/publish` | - | Generates `public_slug` only if absent. |
| POST | `/forms/{id}/unpublish` | - | Keeps slug but flips status to draft. |

## Questions And Logic

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/forms/{id}/questions` | - | Ordered by `order_index`. |
| POST | `/forms/{id}/questions` | `{type, title, description?, required, options?}` | Appends at end. |
| PUT | `/questions/{id}` | Any editable field | Edits in place. |
| DELETE | `/questions/{id}` | - | Deletes source rules and nulls target rules via FK behavior. |
| PUT | `/forms/{id}/questions/reorder` | `{ordered_ids: [int]}` | Rewrites order indexes. |
| GET | `/forms/{id}/logic` | - | Lists rules for the form. |
| POST | `/forms/{id}/logic` | `{question_id, condition_value, target_question_id}` | One equals-condition rule. Backend also accepts `source_question_id` to match the database name. |
| DELETE | `/logic/{id}` | - | Deletes a logic rule. |

## Public Respondent Flow

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/public/{slug}` | - | No auth; only published forms. |
| POST | `/public/{slug}/start` | - | Creates a partial response and returns `{response_id}`. |
| POST | `/public/{slug}/submit` | `{response_id?, answers: [{question_id, value}]}` | Completes an existing response or creates-and-completes one if `response_id` is absent. |

Server-side validation remains required for public submission, including required visited questions, email format, numeric parsing, and logic-path validation.

## Results

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/forms/{id}/responses` | - | Paginated response list. |
| GET | `/responses/{id}` | - | One response with answers. |
| GET | `/forms/{id}/stats` | - | Per-question answer counts. |
| GET | `/forms/{id}/export.csv` | - | CSV stream. |
