# Typeform Clone Backend

FastAPI + SQLite API for the Typeform clone.

## Local Setup

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m app.db_init
uvicorn app.main:app --reload
```

The SQLite file defaults to `backend/typeform_clone.db`. Override it with:

```bash
$env:DATABASE_URL = "C:\path\to\typeform_clone.db"
```

