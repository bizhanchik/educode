# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduCode is an AI-powered coding education platform with three clients sharing one backend:
- **Backend**: FastAPI + PostgreSQL + Celery + Redis + MinIO
- **Frontend**: React (Vite) + TailwindCSS
- **Mobile**: Flutter (Dart)

Three user roles: `admin`, `teacher`, `student` — enforced on both frontend and backend.

---

## Backend (FastAPI)

### Running the Backend

All backend operations run via Docker Compose from `backend/`:

```bash
cd backend

# Full setup from scratch (copies .env, builds, starts, runs migrations)
make setup

# Day-to-day
make up          # Start all services (detached)
make dev         # Start with live logs
make down        # Stop all services
make restart     # Restart services
make logs        # Follow all logs
make logs-backend
make logs-celery

# Database
make migrate             # Run pending Alembic migrations
make migrate-create      # Create new migration (prompts for description)
make migrate-rollback    # Roll back last migration

# Testing
make test                # Run pytest inside container
make test-cov            # Run with coverage report

# Shells
make shell       # bash in backend container
make db-shell    # psql
make redis-shell # redis-cli
```

### Environment Variables (backend/.env)

Required at startup (validated in `app/core/auth.py:validate_auth_env`):
- `JWT_SECRET_KEY`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `DATABASE_URL`, `REDIS_URL`, `MINIO_ENDPOINT`
- `SIMILARITY_SERVICE_URL`

### Architecture

Entry point: `app/main.py` — registers all routers under `/api/v1/`.

```
app/
  core/        # config, database, auth (JWT + bcrypt), rate_limit, storage (MinIO), logging
  models/      # SQLAlchemy ORM models (User, Task, Submission, Lesson, AISolution, etc.)
  routes/      # FastAPI routers — one file per domain
  schemas/     # Pydantic request/response schemas
  services/    # Business logic
    ai_service.py          # Generates AI reference solutions (3x OpenAI + 1x Anthropic)
    grading_service.py     # Grades submissions using AI
    similarity.py          # Local code similarity calculation (hybrid method)
    similarity_client.py   # Wrapper around similarity.py
    judge0_service.py      # Code execution via Judge0 API
    file_processor.py      # Extracts text from PDF/PPTX/DOCX for lesson materials
  tasks/       # Celery async tasks
    celery_app.py          # Celery config — routes to ai_queue / grading_queue
    ai_tasks.py            # AI solution generation tasks
    grading_tasks.py       # Automated grading after deadline
    ai_generation_tasks.py # AI content generation tasks
  utils/
    responses.py           # Standardized response helpers: success_response(), error_response(), paginated_response()
```

### Response Convention

All routes use helpers from `app/utils/responses.py`:
- `success_response(data, message?, metadata?)` → `{"status": "success", "data": ...}`
- `error_response(code, message, details?, status_code?)` → `{"status": "error", "error": {...}, "data": null}`
- `paginated_response(items, total, page, size)` → includes pagination metadata
- `created_response(data, message?, resource_id?)`, `deleted_response(resource_type, resource_id)`

### Auth

JWT-based (`python-jose`). `app/core/auth.py` provides:
- `get_current_user(credentials, db)` — extracts user from Bearer token
- `require_role(*roles)` — dependency that enforces role-based access
- Admin credentials (username/password) are separate from the JWT user system

### Celery Task Queues

Two queues configured:
- `ai_queue` — AI solution generation, AI content generation
- `grading_queue` — automated grading after task deadlines

---

## Frontend (React)

### Running the Frontend

```bash
cd frontend
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

Set `VITE_API_URL` env var to point to the backend (defaults to `http://localhost:8000`).

### Architecture

No React Router — the app uses a **custom page-state router** in `App.jsx` via `currentPage` state and a `ROUTE_RULES` map that enforces role access.

```
src/
  App.jsx            # Root — page routing, auth guard, ROUTE_RULES
  hooks/
    useAuth.jsx      # AuthProvider + useAuth hook (token storage, login/logout)
    useRole.jsx      # RoleProvider + useRole hook (role state)
  contexts/
    RoleContext.jsx  # Role context (also accessible via useRole hook)
  utils/
    apiClient.js     # Base API client — token management (localStorage), fetch wrapper
    auth.js          # Auth API calls
    tasksApi.js, usersApi.js, lessonAssignmentsApi.js, etc.  — domain API modules
    navigation.js    # getLandingPageForRole() helper
  pages/             # Full-page views per role
  components/        # Reusable UI (Navbar, AuthModal, Practice, Testing, etc.)
  i18n.jsx           # LanguageProvider (i18n support)
```

Key constants in `apiClient.js`: `ACCESS_TOKEN_KEY`, `USER_STORAGE_KEY` — tokens stored in `localStorage`.

`ProtectedRoute` component wraps role-gated pages.

---

## Mobile (Flutter)

Located in `educode-mobile/educode/`.

```
lib/
  main.dart
  screens/    # LoginScreen, CoursesScreen, LessonsScreen, LessonDetailScreen, etc.
  services/
    api_client.dart   # HTTP client — injects Bearer token, handles 401
    auth_service.dart # Token storage/retrieval, login, logout
    lesson_service.dart
    progress_service.dart
    subject_service.dart
```

The mobile app connects to the same `/api/v1/` backend. `AuthService.baseUrl` must be set to a reachable host (not `localhost` on a real device).

**Known gaps** (from `MOBILE_BACKEND_IMPLEMENTATION_PLAN.md`): Registration uses admin-only `POST /users`; some screens still use mock data.

---

## Key API Endpoints

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/auth/login` | Returns JWT |
| GET | `/api/v1/auth/me` | Current user |
| GET | `/api/v1/subjects` | Paginated, role-filtered |
| GET | `/api/v1/lessons` | Optional `subject_id` filter |
| GET | `/api/v1/lessons/{id}/status` | Test/practice scores, locked state |
| POST | `/api/v1/submissions` | Student code submission |
| POST | `/api/v1/ai-solutions/{task_id}/generate` | Trigger AI solution generation |
| GET | `/api/v1/code/execute` | Code execution via Judge0 |
| GET | `/api/v1/health` | Health check |

Full interactive docs: `http://localhost:8000/docs`

---

## Database Migrations

Alembic is used. Migration files are in `backend/alembic/versions/`. When modifying ORM models, create a new migration:

```bash
make migrate-create   # Runs alembic revision --autogenerate
make migrate          # Applies pending migrations
```

---

## Services & Ports

| Service | Port |
|---------|------|
| FastAPI backend | 8000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| Celery Flower | 5555 |
| Frontend dev | 5173 |
