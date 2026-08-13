# Agent Decision Log

This file records important product, architecture, and implementation decisions for this Typeform clone. It is intended for any future agentic coding tool or developer who continues the project, so they can understand not only what was built, but why each decision was made.

## Project Intent

- Build a Typeform-style form builder and response collection product from scratch.
- The experience should feel like a genuine Typeform clone: polished, conversational, minimal, keyboard-friendly, and focused on one-question-at-a-time form completion.
- Work will proceed step by step from the user's build plan. Each major implementation step should add or update decisions here.

## How To Maintain This File

When making a meaningful decision, add an entry under `Decision History` with:

- Date
- Area
- Decision
- Rationale
- Tradeoffs or follow-up notes

Record decisions that affect:

- Product behavior and UX patterns
- Data models and API contracts
- Authentication and permissions
- Frontend architecture, routing, and state management
- Backend architecture, storage, validation, and security
- Styling conventions and component patterns
- Testing approach
- Deployment or environment assumptions

Do not record tiny mechanical edits unless they clarify a broader decision.

## Current Working Assumptions

- The project is a from-scratch Typeform clone, not a generic form app.
- The user will provide a build plan, and implementation should follow it step by step.
- Decisions should favor a polished clone experience over a bare CRUD implementation.
- Existing `backend` and `frontend` folders should be respected unless the build plan explicitly changes the structure.
- Default implementation path: FastAPI backend, Next.js App Router frontend, TypeScript, Tailwind, shadcn/ui, and SQLite.
- Code quality expectations apply throughout: modular design, clear boundaries, efficient algorithms, maintainable request/response flows, and no avoidable duplication.

## Decision History

### 2026-08-13 - Project process - Create a shared agent decision log

**Decision:** Add this root-level `AGENTS.md` file as the canonical place to track important decisions throughout the build.

**Rationale:** The user wants future agentic coding tools to understand why project decisions were made, especially if work moves between tools or agents. A root-level file is discoverable before entering either `backend` or `frontend`.

**Tradeoffs / Follow-up:** This file must be maintained continuously. Future implementation steps should append concise decision entries instead of relying only on chat history.

### 2026-08-13 - Stack - Use FastAPI, Next.js App Router, and SQLite

**Decision:** Implement the backend with FastAPI and SQLite, and the frontend with Next.js App Router, TypeScript, Tailwind, and shadcn/ui.

**Rationale:** This matches the final build plan, keeps the API-first architecture straightforward, and supports fast iteration for a 24-hour-style build. FastAPI maps cleanly to the specified REST contract, while Next.js App Router gives a modern frontend structure for dashboard, builder, respondent flow, and results routes.

**Tradeoffs / Follow-up:** Django would provide more built-in admin/auth machinery, but auth is intentionally simplified to a single seeded creator. If real multi-creator auth is added later, the existing `creator` table and `form.creator_id` relationship should be reused instead of replacing the schema.

### 2026-08-13 - Engineering standards - Keep code modular and request flows seamless

**Decision:** Code throughout the project should follow strong software design principles: modular structure, focused functions/components, clear ownership boundaries, efficient algorithms, consistent validation, and seamless request/response flow between frontend and backend.

**Rationale:** The project is intended to be continued step by step, possibly by other agentic coding tools. Clean boundaries and explicit contracts reduce confusion and make later implementation phases easier to reason about.

**Tradeoffs / Follow-up:** Avoid premature abstraction, but do extract shared behavior when it removes meaningful duplication or clarifies domain concepts such as forms, questions, responses, themes, and logic rules.

### 2026-08-13 - Responses API - Add partial-response start endpoint

**Decision:** Add `POST /public/{slug}/start` to create a `response` row when a respondent loads a published form. It returns `{response_id}` with `started_at` generated server-side and `completed_at = NULL`. Update `POST /public/{slug}/submit` to accept `{response_id?, answers: [{question_id, value}]}`. If `response_id` is provided, complete that existing row; if absent, create and complete a response row in the same request.

**Rationale:** The database schema already models partial responses through `response.started_at` and nullable `completed_at`. Without a start endpoint, every persisted response would only be created at submit time, making abandonment/completion-rate analytics impossible. Making `response_id` optional lets submission degrade gracefully if the start request fails.

**Tradeoffs / Follow-up:** `/start` supports analytics and partial-completion behavior but must never become a hard dependency for successful submission. The frontend should call it on public form load, store the returned ID in local component state, and still allow submit without it.

### 2026-08-13 - Phase 0 scaffold - Keep backend and frontend as separate apps

**Decision:** Keep the existing root shape with separate `backend` and `frontend` directories. Add FastAPI app files, SQLite schema/init code, Next.js App Router files, shadcn configuration, and docs for the API contract and phase plan.

**Rationale:** The project already had empty `backend` and `frontend` folders, and the final plan treats the API and UI as separate deployable surfaces. Separate apps keep responsibilities clear: FastAPI owns persistence/validation/API contracts, and Next.js owns dashboard, builder, respondent flow, and results UI.

**Tradeoffs / Follow-up:** This is not a monorepo package workspace yet. If shared generated API types become useful later, add them deliberately rather than coupling the apps early.

### 2026-08-13 - Frontend typography - Avoid build-time Google Fonts dependency

**Decision:** Use an Inter-first CSS font stack instead of `next/font/google`.

**Rationale:** The design plan assumes Inter, but `next/font/google` fetches font assets during production build. In this workspace that network request failed, blocking validation. A CSS stack preserves the intended Inter preference where available and falls back cleanly to system UI fonts.

**Tradeoffs / Follow-up:** If deployment requires guaranteed Inter rendering, add a local Inter font asset and use `next/font/local` rather than reintroducing a build-time external font fetch.

### 2026-08-13 - Frontend dependencies - Upgrade Next.js to clear audit findings

**Decision:** Upgrade `next` and `eslint-config-next` to `16.3.0` during scaffold setup.

**Rationale:** `npm audit` reported high-severity vulnerabilities in Next's transitive `postcss` and `sharp` dependency chain. Because the frontend scaffold is still minimal, accepting the breaking Next upgrade now is lower-risk than carrying known high-severity findings into the baseline.

**Tradeoffs / Follow-up:** Next 16 conventions should be respected going forward. If middleware is added later, use the current `proxy` convention instead of older `middleware` naming.

### 2026-08-13 - Documentation - Add function-level codebase guide

**Decision:** Add root-level `CODEBASE.md` to explain the full codebase, including every current function and class.

**Rationale:** The user wants a project-owner-friendly reference for understanding the whole codebase. Keeping this separate from `AGENTS.md` avoids mixing implementation explanation with decision history.

**Tradeoffs / Follow-up:** Future agents must update `CODEBASE.md` whenever they add, remove, or materially change functions/classes.

### 2026-08-13 - Branding - Use provided logo asset

**Decision:** Use the provided `frontend/Typeform-redesigned.png` asset as the application logo.

**Rationale:** The user confirmed this is the logo for the application. Using it consistently in the app shell and branded UI keeps the clone from feeling generic while still avoiding scraped Typeform assets.

**Tradeoffs / Follow-up:** The user is creating an animated version for the loading animation and will add it to the project files when complete. Until then, loading states should be designed so the static logo can be used or swapped cleanly for the future animation asset.

### 2026-08-13 - Phase 2 respondent flow - Build `/f/[slug]` as a themed one-question-at-a-time client flow

**Decision:** Implement the public respondent experience at `/f/[slug]` as a dedicated RX surface: server-load the published form, then run landing → question cards → thank-you entirely in a client orchestrator. Mirror backend logic-jump path evaluation on the client for navigation and progress, call `/start` on begin (optional if it fails), and submit all visited answers on completion.

**Rationale:** The respondent flow is the highest-weighted screen and the core Typeform feel. Keeping it separate from the app shell preserves the CX/RX split from the build spec. Client-side path evaluation matches server validation behavior so progress and skips feel immediate without extra round trips per question.

**Tradeoffs / Follow-up:** The builder preview in Phase 3 should reuse `QuestionRenderer` and `ThemeProvider` rather than duplicating question UI. Keyboard back-navigation and richer transition polish can be added later without changing the API contract.

### 2026-08-13 - Phase 3 Form Builder - UI Architecture

**Decision:** Built the Creator Form Builder (`/forms/[id]/edit`) using a three-pane architecture: a Left Rail for question sorting (`@dnd-kit`), a Center Pane for editing question details and options, and a Right Pane for a live preview.

**Rationale:** The 3-pane layout matches the UX specification and Typeform's actual CX. Using `@dnd-kit` provides accessible, standard drag-and-drop mechanics without complex custom cursor-tracking logic. The right pane heavily reuses the `QuestionRenderer` and `ThemeProvider` built in Phase 2, ensuring that the creator's live preview matches the respondent's exact experience.

**Tradeoffs / Follow-up:** Save operations on text fields (title/description) are currently implemented with a simple 500ms debounce to simulate auto-save and prevent API flooding. Logic Jumps are currently stubbed in the UI as per the 'bonus scope' deferral strategy.
