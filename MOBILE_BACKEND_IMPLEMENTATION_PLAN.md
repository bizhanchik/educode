# EduCode: Backend-to-Mobile Implementation Plan

**Timeline:** 2 weeks  
**Goal:** Connect the Flutter mobile app to the FastAPI backend with basic, working functionality.  
**Current state:** Auth (login) partially works; Courses, Lessons, Progress use mock data; `LessonService` is empty; Register is a stub.

---

## Current Architecture Summary

### Backend (FastAPI)

| Route | Purpose |
|-------|---------|
| `POST /api/v1/auth/login` | Login (email + password) → JWT |
| `GET /api/v1/auth/me` | Current user info (requires Bearer token) |
| `POST /api/v1/auth/verify` | Validate token |
| `GET /api/v1/subjects` | List subjects (paginated, role-filtered) |
| `GET /api/v1/subjects/{id}` | Subject detail (optional `include_lessons`) |
| `GET /api/v1/lessons` | List lessons (optional `subject_id`) |
| `GET /api/v1/lessons/{id}` | Lesson detail |
| `GET /api/v1/progress` | Progress records |
| `GET /api/v1/progress/user/{user_id}/summary` | User progress summary |
| `GET /api/v1/lessons/{id}/status` | Lesson status (test/practice scores, locked) |
| `GET /api/v1/tests/lessons/{id}/questions` | Test questions |
| `POST /api/v1/users` | Create user (**admin only**) |

### Mobile (Flutter)

| Screen | Status |
|--------|--------|
| LoginScreen | ✅ Calls backend; saves token; no Bearer on subsequent calls |
| RegisterScreen | ❌ Stub – no API call |
| MainScreen | ✅ Tab nav (Progress, Courses, Profile) |
| CoursesScreen | ❌ Hardcoded courses |
| LessonsScreen | ❌ Hardcoded; no subject passed |
| LessonDetailScreen | ❓ Needs verification |
| ProgressScreen | ❌ Hardcoded 65% |
| ProfileScreen | ❓ Needs verification |
| AuthService | Partial – login OK; no Bearer injection |
| LessonService | ❌ Empty |

### Known Gaps

1. **Auth**: Token not sent as `Authorization: Bearer <token>` on API calls.
2. **baseUrl**: `localhost:8000` fails on real device/emulator; needs env/config.
3. **Register**: Backend has no public registration; `POST /users` is admin-only.
4. **Courses**: Use `GET /subjects` instead of mock data.
5. **Lessons**: Use `GET /lessons` with `subject_id`.
6. **Progress**: Use `GET /progress/user/{id}/summary`.
7. **Profile**: Use `GET /auth/me`.
8. **401 handling**: Logout on expired/invalid token.
9. **Startup auth**: Redirect to Login if no token.

---

## Stage 1: Foundation (Days 1–2)

**Goal:** Reliable auth flow and environment configuration.

### 1.1 Environment & Base URL

- [ ] Add `flutter_dotenv` or a simple `config.dart` for `baseUrl`.
- [ ] Support dev/emulator (`http://10.0.2.2:8000` for Android, `http://localhost:8000` for iOS simulator).
- [ ] Move `baseUrl` out of `AuthService` into shared config.

### 1.2 Shared HTTP Client with Auth

- [ ] Create `api_client.dart` (or extend `AuthService`) that:
  - Injects `Authorization: Bearer <token>` on every request.
  - Reads token via `AuthService.getToken()`.
  - Handles 401 by clearing token and triggering logout (e.g. via callback or navigator key).
- [ ] Refactor `AuthService.login` to use this client (or keep login as special case without token).
- [ ] Add `getWithAuth()` / `postWithAuth()` helpers for authenticated calls.

### 1.3 Auth Guard & Persistence

- [ ] On app start (`main.dart`), check `AuthService.isLoggedIn()`.
  - If logged in: optional `GET /auth/me` to validate token; if 401 → go to Login.
  - If not logged in: show Login.
- [ ] After successful login: store token and role; navigate to `MainScreen`.
- [ ] Add logout in Profile (or menu); clear token/role and go to Login.

### 1.4 Register (Decision)

- **Option A (recommended for MVP):** Disable or hide Register; users created by admin.
- **Option B:** Add backend `POST /api/v1/auth/register` (or equivalent) for self-registration.
- [ ] Chose and implement one option.

**Deliverables:** Auth flow works end-to-end; token sent on all authenticated requests; correct base URL for dev/emulator.

---

## Stage 2: Subjects & Lessons (Days 3–5)

**Goal:** Courses and lessons load from backend.

### 2.1 Subject Service

- [ ] Create `subject_service.dart`:
  - `getSubjects(page, size)` → `GET /api/v1/subjects`.
  - Return list with `id`, `name`, `description` (or equivalent fields from `SubjectRead`).
  - Use shared `api_client` with auth.

### 2.2 Lesson Service

- [ ] Implement `lesson_service.dart`:
  - `getLessons({subjectId, page, size})` → `GET /api/v1/lessons`.
  - `getLesson(id)` → `GET /api/v1/lessons/{id}`.
  - Add `getLessonStatus(lessonId)` → `GET /api/v1/lessons/{id}/status` (for lesson_progress route; verify exact path).
  - Parse `{"data": {...}, "status": "success"}` response shape.

### 2.3 Wire CoursesScreen

- [ ] Replace `_allCourses` mock with `SubjectService.getSubjects()`.
- [ ] Show loading indicator and error states.
- [ ] Pass `subject_id` when navigating to `LessonsScreen`.

### 2.4 Wire LessonsScreen

- [ ] Accept `subject_id` (and optionally `subject_name`) as route args.
- [ ] Load lessons via `LessonService.getLessons(subjectId: subject_id)`.
- [ ] Replace mock list with real data; show loading/error.
- [ ] Navigate to `LessonDetailScreen` with `lesson_id`.

### 2.5 Wire LessonDetailScreen (basic)

- [ ] Load lesson via `LessonService.getLesson(id)`.
- [ ] Show title, description; placeholder for materials/tasks if not yet available.
- [ ] Ensure Back works and returns to Lessons.

**Deliverables:** Courses and lessons from backend; correct subject→lessons→detail flow.

---

## Stage 3: Progress & Profile (Days 6–7)

**Goal:** Progress and profile use backend.

### 3.1 Progress Service

- [ ] Create `progress_service.dart`:
  - `getUserProgressSummary(userId)` → `GET /api/v1/progress/user/{user_id}/summary`.
  - Map response to UI: completion percentage, completed lessons count, etc.

### 3.2 Wire ProgressScreen

- [ ] Get `user_id` from `AuthService` (store after login from `GET /auth/me` or login response if available).
- [ ] Load progress via `ProgressService.getUserProgressSummary(userId)`.
- [ ] Replace hardcoded 65% and “#2 в своем классе” with real data (or sensible fallbacks if API doesn’t provide ranking).

### 3.3 Profile Service & Screen

- [ ] `GET /api/v1/auth/me` for profile data (id, name, email, role).
- [ ] Wire ProfileScreen: name, email, role; logout button.
- [ ] Store `user_id` and basic user info after login for reuse (or fetch on MainScreen init).

**Deliverables:** Real progress data; profile from backend; logout working.

---

## Stage 4: Lesson Content & Practice (Days 8–10)

**Goal:** Basic lesson content and practice flow.

### 4.1 Lesson Materials

- [ ] Check backend routes for lesson materials (e.g. `/lesson-materials`, `/lessons/{id}/materials`).
- [ ] Add `LessonService.getMaterials(lessonId)` if available.
- [ ] Display materials (text, links) in `LessonDetailScreen`.

### 4.2 Tasks

- [ ] Add `TaskService` or extend `LessonService`:
  - `getTasks(lessonId)` → tasks endpoint.
- [ ] Show task list in lesson detail (or separate tab/section).

### 4.3 Practice (Basic)

- [ ] If practice involves code submission: identify `POST /api/v1/submissions` (or similar).
- [ ] Implement minimal “submit code” flow: text field + submit; show result/feedback.
- [ ] Defer full code editor to a later phase if needed.

### 4.4 Tests (Basic)

- [ ] `getTestQuestions(lessonId, count)` → tests endpoint.
- [ ] Simple quiz UI: show question, options, submit answer, show correct/incorrect.
- [ ] Submit test result if backend supports it.

**Deliverables:** Lesson materials visible; tasks listed; basic practice and test flows.

---

## Stage 5: Polish & Error Handling (Days 11–12)

**Goal:** Stable UX and error handling.

### 5.1 Error Handling

- [ ] Centralized error handling in `api_client` (network errors, 4xx, 5xx).
- [ ] User-friendly messages (e.g. “Check your connection”, “Session expired”).
- [ ] Retry or “Try again” for transient failures.

### 5.2 Loading & Empty States

- [ ] Consistent loading indicators (shimmer or spinner).
- [ ] Empty states: “No courses”, “No lessons”, “No progress yet”.
- [ ] Pull-to-refresh where appropriate (Courses, Lessons, Progress).

### 5.3 Offline / Connectivity

- [ ] Detect connectivity (e.g. `connectivity_plus`).
- [ ] Show “Offline” or disable actions when no network (optional for MVP).

### 5.4 Testing on Device

- [ ] Test on Android emulator and physical device (use LAN IP for backend).
- [ ] Test on iOS simulator (localhost) and device if possible.
- [ ] Ensure backend CORS/origin allows mobile if using web; for native HTTP, CORS does not apply.

**Deliverables:** Robust error handling; clear loading/empty states; basic device testing done.

---

## Stage 6: Buffer & Documentation (Days 13–14)

**Goal:** Catch-up, fixes, and handoff docs.

### 6.1 Bug Fixes & Edge Cases

- [ ] Fix any issues from Stages 1–5.
- [ ] Handle token expiry and 401 consistently.
- [ ] Verify role-based behavior (student vs teacher) if relevant for mobile.

### 6.2 Documentation

- [ ] `README` in `educode-mobile/` with:
  - How to set `baseUrl` for dev/staging.
  - How to run backend locally.
  - Basic architecture (screens, services).
- [ ] Short API summary (endpoints used, auth, response shapes) for future reference.

### 6.3 Optional Enhancements

- [ ] Token refresh if backend adds refresh endpoint.
- [ ] Notifications integration if `GET /notifications` exists.
- [ ] Deep links for specific lessons (future).

**Deliverables:** Polished MVP; README and API notes for maintainers.

---

## API Reference Quick Links

| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/api/v1/auth/login` | POST | No | Login |
| `/api/v1/auth/me` | GET | Bearer | Current user |
| `/api/v1/subjects` | GET | Bearer | List subjects |
| `/api/v1/subjects/{id}` | GET | Bearer | Subject detail |
| `/api/v1/lessons` | GET | Bearer | List lessons |
| `/api/v1/lessons/{id}` | GET | Bearer | Lesson detail |
| `/api/v1/progress/user/{user_id}/summary` | GET | Bearer | User progress |
| `/api/v1/lessons/{id}/status` | GET | Bearer | Lesson status |
| `/api/v1/tests/...` | GET/POST | Bearer | Tests |
| `/api/v1/...` (submissions, tasks) | Various | Bearer | Practice/tasks |

---

## Checklist Summary

- [ ] **Stage 1:** Shared API client, env config, auth guard, logout.
- [ ] **Stage 2:** Subject + Lesson services; Courses and Lessons screens wired.
- [ ] **Stage 3:** Progress + Profile from backend.
- [ ] **Stage 4:** Materials, tasks, basic practice & tests.
- [ ] **Stage 5:** Error handling, loading/empty states, device testing.
- [ ] **Stage 6:** Bug fixes, docs, optional enhancements.

---

*Last updated: Based on indexed educode local folder and codebase analysis.*
