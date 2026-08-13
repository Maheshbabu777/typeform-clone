# Typeform Clone

A full-stack, from-scratch clone of the Typeform form builder and respondent experience. Built with a focus on polished UI, responsive design, and robust API-first architecture.

## Architecture

This project is separated into two distinct surfaces:

*   **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
*   **Backend**: FastAPI, Python 3, SQLite (with WAL mode enabled for high concurrency).

The design system is split between the Creator Experience (Dashboard and Builder) using shadcn/ui, and the Respondent Experience (the public form-fill flow) using a custom, theme-driven engine.

## Core Features

*   **Creator Dashboard**: Manage your workspace. Create, edit, duplicate, publish, unpublish, and delete forms. Features a toggleable list/grid view and persistent dark mode.
*   **Form Builder**: A three-pane architecture featuring a left rail for drag-and-drop question ordering, a center panel for detailed editing, and a right panel for live, real-time previewing.
*   **Theme Engine**: Creators can customize form colors, component roundness, and typography sizes. These changes are instantly reflected in both the live preview and the public form.
*   **Logic Jumps**: Conditional branching that allows creators to build dynamic forms. Respondents are routed to different questions based on their previous answers.
*   **Respondent Flow**: A distraction-free, one-question-at-a-time conversational interface. Fully responsive across all devices and accessible via keyboard navigation.
*   **Results & Analytics**: Track form performance with completion rates, question-by-question statistical breakdowns, individual response viewing, and CSV data export.

## Local Development Setup

### Prerequisites

*   Node.js (v18+)
*   Python (3.10+)

### 1. Backend Setup

Navigate to the backend directory and set up a virtual environment:

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
*   Windows: `venv\Scripts\activate`
*   macOS/Linux: `source venv/bin/activate`

Install dependencies and run the server:

```bash
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup

In a new terminal window, navigate to the frontend directory:

```bash
cd frontend
npm install
```

Start the Next.js development server:

```bash
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

## Environment Variables

### Frontend (`frontend/.env.local`)
*   `NEXT_PUBLIC_API_URL`: The URL of your FastAPI backend (defaults to `http://localhost:8000`).
*   `NEXT_PUBLIC_APP_URL`: The URL of your frontend application (defaults to `http://localhost:3000`). Used for generating shareable form links.

## Documentation Reference

For developers looking to understand the core decisions and codebase structure, refer to the following files:

*   `AGENTS.md`: The canonical log of all architectural, product, and implementation decisions made during development.
*   `CODEBASE.md`: A comprehensive, function-level guide to the entire codebase.
*   `docs/database-schema.md`: Complete database schema documentation and rationale.
*   `docs/api-contract.md`: The REST API specification.
