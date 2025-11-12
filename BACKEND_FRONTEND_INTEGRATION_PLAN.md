# EduCode Backend → Frontend Integration Plan

This document analyzes the existing **EduCode backend** (`backend/app`) and outlines a phased plan to surface its capabilities in the React frontend. It is organized into:

1. Architecture & module overview  
2. Domain-by-domain API summary (models + routes)  
3. Relationship diagrams and data flow notes  
4. Integration roadmap with concrete frontend tasks, dependencies, and suggested UX entry points  

---

## 1. Backend Architecture Snapshot

| Layer | Purpose | Key Files |
| --- | --- | --- |
| **Entrypoint** | FastAPI app construction, middleware, router registration | `app/main.py`, root `backend/main.py` |
| **Core** | Cross-cutting concerns (config, DB, auth, logging, rate limiting, storage) | `core/config.py`, `core/database.py`, `core/auth.py`, `core/logging.py`, `core/rate_limit.py`, `core/storage.py` |
| **Models** | SQLAlchemy ORM definitions for every domain entity | `models/*.py` |
| **Schemas** | Pydantic request/response models (validation + serialization) | `schemas/*.py` |
| **Routes** | FastAPI routers grouped by feature | `routes/*.py` |
| **Services** | External service clients (AI providers, similarity) | `services/ai_service.py`, `services/similarity.py` |
| **Tasks** | Celery + background jobs (AI solution generation, grading) | `tasks/*.py` |
| **Utils** | Helper modules for normalized responses, code manipulation | `utils/*.py` |

**Key behaviors:**
- Async SQLAlchemy (`asyncpg` driver) with PostgreSQL.
- JWT authentication with role enforcement (admin, teacher, student) in `core/auth.py`.
- Extensive domain coverage: users, groups, subjects, lessons, lesson materials, tasks, submissions, evaluations, AI solutions, similarity checks.
- Background processing for AI workflows via Celery tasks triggered from API endpoints.
- Security middleware: request ID logging, security headers, CORS (allow list defined in `core/config.py`).

---

## 2. Domain Analysis & API Surface

Each subsection summarizes the model relationships, main endpoints, and notable response details that the frontend must honor.

### 2.1 Authentication (`routes/auth.py`, `schemas/auth.py`, `core/auth.py`)
- **Endpoints**
  - `POST /api/v1/auth/login`: unified JWT login for all roles; returns `{access_token, token_type, role, expires_in}`.
  - `GET /api/v1/auth/me`: resolve the current user via bearer token; returns `UserInfo` (id, name, email, role, group_id).
  - `POST /api/v1/auth/verify`: quick token validity check + short user payload.
  - Legacy admin endpoints exist but are deprecated.
- **Frontend requirements**
  - Persist JWT + role, refresh profile on app load.
  - Route guard hooks to inject `Authorization` header for every data call.
  - UI gating per role (admin dashboards vs teacher vs student).
  - Dedicated error handling for 401/403 with logout fallback.

### 2.2 Users (`routes/users.py`, `models/user.py`, `schemas/user.py`)
- **Capabilities**
  - Admin CRUD (`POST`, `GET` paginated with filters, `GET /{id}`, `PUT`, `DELETE`).
  - Stats helper (counts by role) returned in responses.
  - Relationships: users ↔ groups, teachers ↔ lessons, students ↔ submissions.
- **Frontend hook points**
  - Admin user management screen (table, pagination, filters by role/group).
  - Drawer or modal for create/update with validation mirroring Pydantic schema.
  - Use list response wrapper (`{"data": UserList, "status": "success"}`) – every data table should expect this pattern.

### 2.3 Groups (`routes/groups.py`, `models/group.py`, `schemas/group.py`)
- **Endpoints**
  - CRUD plus pagination and membership stats.
- **Frontend idea**
  - Admin “Groups” page with creation wizard, ability to assign teachers/students (when UI for user linking exists).

### 2.4 Subjects (`routes/subjects.py`, `models/subject.py`)
- **Endpoints**
  - CRUD with filtering, linking to lessons/tasks.
- **Frontend**
  - Subject catalog (for admins & teachers), subject selection filter for students’ dashboards.

### 2.5 Lessons & Lesson Materials (`routes/lessons.py`, `routes/lesson_materials.py`, `models/lesson*.py`)
- **Capabilities**
  - CRUD for lessons bound to subjects & teachers.
  - Materials API for slides/videos/resources under each lesson.
  - Lesson responses include teacher relationship, materials list, and optionally tasks.
- **Frontend**
  - Teacher builder UI to manage lessons + upload material metadata.
  - Student view that combines lesson theory, materials, and associated tasks (tie into existing `Lesson1`, etc.).

### 2.6 Tasks (`routes/tasks.py`, `models/task.py`, `schemas/task.py`)
- **Key operations**
  - Create/update tasks tied to lessons (teacher only).
  - List/filter tasks by lesson, language, active state, pagination.
  - Detailed fetch optionally including submissions and related lesson info.
  - Trigger background AI processing (`POST /api/tasks/{id}/prepare-ai`) and manual grading (`POST /api/tasks/{id}/grade`).
- **Important derived fields**
  - `is_expired`, `is_active`, `time_remaining`, `has_ai_solutions`, `submission_count`.
- **Frontend**
  - Teacher dashboard needs CRUD, AI trigger buttons with status indicators, view of pending submissions per task.
  - Student task list filtered by course/lesson; highlight deadline countdown.

### 2.7 Submissions (`routes/submissions.py`, `models/submission.py`, `schemas/submission.py`)
- **Features**
  - Students submit code (file or text).
  - Teachers/admins list submissions, update status/feedback.
  - Student-specific views (`/mine`) to show their own submissions and evaluation metadata.
- **Frontend**
  - Submission form tied to code editor / upload component.
  - Student “My submissions” timeline.
  - Teacher review panel with grade entry and status updates.

### 2.8 Evaluations (`routes/evaluations.py`, `models/evaluation.py`)
- **Purpose**
  - Aggregate grading results, similarity scores, AI judgments.
  - Provide summary endpoints (task-level, student-level) for dashboards.
- **Frontend**
  - Analytics widgets (per task summary, similarity heatmaps, grading breakdowns).
  - Should surface warnings when similarity threshold exceeded.

### 2.9 AI Solutions (`routes/ai_solutions.py`, `models/ai_solution.py`, `services/ai_service.py`, Celery tasks)
- **Flow**
  1. Teacher triggers AI solution generation for a task.
  2. Celery worker hits OpenAI/Anthropic via `services/ai_service.py`.
  3. Solutions stored in DB and retrievable via routes.
- **Frontend**
  - Button in task view to “Generate AI solutions” with progress indicator.
  - Display the generated reference solutions to teachers (maybe also students after release?).

### 2.10 Similarity (`routes/similarity.py`, `services/similarity.py`)
- **Endpoints**
  - Proxy to similarity service for ad-hoc comparisons and status checks.
- **Frontend**
  - Teacher view: show similarity metrics per submission.
  - Admin QA tools to debug similarity service health (UI for `/status`).

### 2.11 Health (`routes/health.py`)
- `GET /api/v1/health`: readiness info.
- Use for frontend service status indicator.

### 2.12 Background Tasks (`tasks/ai_tasks.py`, `tasks/grading_tasks.py`, `tasks/celery_app.py`)
- Celery worker orchestrates:
  - `generate_ai_solutions_task(task_id)`
  - `grade_task(task_id)` – triggers evaluation pipeline.
- Frontend should poll endpoints or use WebSocket/notifications (future) to reflect async progress.

---

## 3. Data Relationships & Flow Considerations

```
Subject ──< Lesson ──< Task ──< Submission ──< Evaluation
                        │             │
                        │             └─> Similarity scores / AI feedback
                        └─< AI Solutions

Group ──< User (teacher/student linkage)
User (teacher) ──< Lesson (teacher_id)
User (student) ──< Submission (student_id)
```

- **Authorization flow**: JWT token identifies user role; dependencies (`teacher_required`, `admin_required`, `require_roles`) enforce route access.
- **Response wrapper**: most routes return `{"data": <schema>, "status": "success"}` – frontend should consistently read from `.data`.
- **Timestamps**: stored in UTC; frontend should format in user locale and calculate countdowns.
- **Async jobs**: some actions return immediately but trigger Celery; UI must poll relevant endpoints to reflect completion.

---

## 4. Frontend Integration Roadmap

The roadmap is broken into phases. Later phases depend on earlier infrastructure (auth, global API client, state management).

### Phase 0 – Foundations
1. **API client** (done): configure base URL + auth header injection, unify error handling.
2. **Auth hook** (in progress): finalize login/logout, `useAuth` context, guard routes, persist token + user.
3. **Global loader + toast system**: consistent UX for async operations.

### Phase 1 – Role-aware navigation & layout
1. Update navbar/user menu to show role-specific links (admin/teacher/student).
2. Lazy-load dashboards based on role from `/auth/me`.
3. Protect teacher/admin pages from unauthenticated access (redirect to login modal).

### Phase 2 – Admin Console
1. **Users module**
   - Build paginated table using `/api/v1/users` (filters for role, group).
   - Modal forms for create/update using `UserCreate`/`UserUpdate` schema fields.
   - Delete flow with confirmation.
2. **Groups module**
   - Table + create form.
   - Show membership counts or link to user filter.
3. **Subjects module**
   - CRUD UI.
   - Associate lessons count (display).
4. **System health widget**
   - Hit `/api/v1/health` and similarity `/status`.

### Phase 3 – Teacher Dashboard
1. **Lessons management**
   - List lessons from `/api/v1/lessons?teacher_id=me`.
   - Detail drawer showing materials and tasks; allow editing metadata.
   - CRUD for lesson materials via `/lesson-materials`.
2. **Task builder**
   - Wizard to create/edit tasks with language, deadline, instructions.
   - Buttons for `prepare-ai` and `grade` endpoints with progress indicator.
3. **AI solutions viewer**
   - Fetch `/api/v1/ai-solutions?task_id=...` to render generated code.
4. **Submissions filter**
   - Table of submissions per task (pending/completed) with ability to update feedback/status.
5. **Notifications/Insights**
   - Use evaluations endpoints to show average score, similarity alerts.

### Phase 4 – Student Experience
1. **Course catalog / My Courses**
   - Replace local dummy data by fetching subjects/lessons/tasks.
   - Show progress (if backend exposes, otherwise derived from submissions).
2. **Lesson view**
   - Combine materials + tasks; include “Start task” CTA.
3. **Submission workflow**
   - Code editor/upload component that posts to `/api/v1/submissions`.
   - After submit, poll for evaluation status; display AI feedback, similarity score, grade.
4. **My submissions / Journal**
   - List results from `/api/v1/submissions/mine`.
   - Highlight warnings if similarity > threshold.

### Phase 5 – Advanced Analytics & Similarity
1. **Task analytics page**
   - Use `/api/v1/evaluations/task/{id}/summary` (adjust to actual endpoint) for charts.
   - Visualize similarity network (leverage `/api/v1/similarity` data).
2. **Admin auditing**
   - Provide filters to spot high-risk submissions, re-run similarity checks on demand.

### Phase 6 – Background task UX polish
1. Implement polling hooks for AI generation + grading job statuses.
2. Consider notifications (in-app) triggered by backend once APIs exist.
3. Provide logs/alerts if Celery queue is down (maybe from `/health` or custom endpoint).

### Supporting Tasks & Considerations
- **Validation parity**: mirror Pydantic constraints in forms (required fields, enums like roles/languages).
- **Error normalization**: backend often returns `detail` on errors; surface these directly in UI messaging.
- **Internationalization**: existing i18n layer should wrap new strings.
- **Testing**: integrate with Cypress/React Testing Library for key flows (login, CRUD, submission).
- **Env/config**: parameterize API base URL via Vite env (`VITE_API_BASE_URL`) for flexibility.

---

## 5. Suggested File & Component Mapping

| Backend Domain | Proposed Frontend Modules/Screens | Notes |
| --- | --- | --- |
| Auth | `hooks/useAuth`, `contexts/AuthContext`, route guards | Already partially implemented; extend to register admin restrictions |
| Users | `pages/admin/UsersPage`, `components/admin/UserForm` | Table + modal |
| Groups | `pages/admin/GroupsPage`, `components/admin/GroupForm` | Manage cohorts/classrooms |
| Subjects | `pages/admin/SubjectsPage` | Provide filters for dropdown usage elsewhere |
| Lessons | `pages/teacher/LessonsPage`, `components/lesson/LessonForm` | Manage attachments |
| Tasks | `pages/teacher/TasksPage`, `pages/student/TasksPage` | Teacher vs student views share card component |
| Submissions | `pages/student/SubmissionsPage`, `pages/teacher/ReviewQueue` | Student view uses “mine” endpoint |
| Evaluations | `components/analytics/TaskSummary`, `components/analytics/SimilarityChart` | Graphs/tables |
| AI Solutions | `components/task/AISolutionsPanel` | Syntax highlighting for code |
| Similarity | `components/analytics/SimilarityStatus` | Show service health + on-demand checks |
| Health | `components/status/SystemStatusBadge` | Use on admin dashboard |

---

## 6. Risks & Open Questions
1. **Role-based data filtering**: ensure teacher/student filtering logic matches UI expectations (e.g., student access to tasks is currently permissive).
2. **Enrollment data**: there is no explicit “student enrolled in lesson” relation yet; frontend might need temporary heuristics.
3. **Background task feedback**: no push notifications; polling cadence must balance timeliness vs load.
4. **File uploads**: submission endpoint likely expects multipart/form-data; confirm payload contract before implementing upload UI.
5. **Similarity service availability**: add UX fallback when `/api/v1/similarity/status` reports errors.

---

## 7. Next Steps Checklist

1. ✅ Re-enable CORS and finalize API base configuration.  
2. ☐ Finish auth hook upgrades (profile refresh, token expiry handling).  
3. ☐ Define shared API client utilities (pagination helpers, error objects).  
4. ☐ Prioritize Admin → Teacher → Student feature rollout per roadmap above.  
5. ☐ Coordinate with backend team on any missing endpoints or response tweaks before building UI.  

With this plan, the frontend can progressively replace placeholder/local data with live EduCode backend functionality while keeping the experience role-aware, secure, and aligned with the existing domain model.

