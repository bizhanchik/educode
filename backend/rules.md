## ABOUT THE PROJECT — EduCode

### Name
EduCode — AI-powered education platform for programming lessons and automated code evaluation.

### One-liner
A role-based platform for IT colleges where teachers create lessons and coding tasks, students submit solutions, and the system scores originality and correctness using AI and code-similarity analysis.

### Problem Statement
Manual checking of programming assignments is slow, inconsistent, and vulnerable to copy/paste or AI-generated code. Teachers need a trustworthy way to assess both correctness and originality at scale, with clear evidence and minimal overhead.

### Target Users
- **Admin**: manages users, groups, subjects; governs platform configuration and visibility.
- **Teacher**: creates lessons and tasks with deadlines; triggers AI reference solutions; reviews results and final grades.
- **Student**: views assigned tasks, submits code (file or text), receives AI similarity feedback and final grades.

### Primary Outcomes
1. **Faster grading** with reproducible, explainable results.
2. **Originality insights** via similarity vs AI baselines and peers.
3. **Operational reliability**: deadlines auto-trigger grading; jobs are idempotent and observable.

### MVP Scope
- Role-based auth (Admin/Teacher/Student) with JWT (access + refresh).
- CRUD for Users, Groups, Subjects, Lessons, Tasks.
- Student submissions (file or code text) with MinIO storage.
- Automatic generation of **4 AI reference solutions** per task:
  - 3 variants via ChatGPT (one thread: normal, different, another approach).
  - 1 variant via Anthropic Claude.
- **AI similarity**: student vs AI solutions.
- **Intra-group similarity**: student vs peers within the same group.
- **Final grade (1–100)**: produced by ChatGPT using the collected metrics (with fallback formula).
- **Auto-grading** on deadline via scheduler, or manual grading by teacher.
- Health checks, logging, rate limiting, and consistent JSON responses.

### Non-Goals (MVP)
- Full LMS replacement (attendance, curriculum planning, exams).
- Plagiarism police or legal adjudication; EduCode provides indicators, not accusations.
- Rich unit test autograding for arbitrary languages (basic correctness optional).
- Complex rubric editors; a simple, transparent grading prompt is sufficient.

### Key User Flows
1. **Admin onboarding** → create teachers & students, assign to groups/subjects.
2. **Teacher flow** → create lesson → create task with deadline → generate AI solutions → grade (manual or automatic).
3. **Student flow** → view task → submit code → instant AI-similarity feedback → see final grade after grading job.
4. **Jobs/Scheduler** → background tasks for AI generation, similarity computation, and deadline-triggered grading.

### Data Model (Essentials)
- **User**(id, name, email, password_hash, role, group_id?, created_at)
- **Group**(id, name)
- **Subject**(id, name)
- **Lesson**(id, subject_id, teacher_id, title, description, created_at)
- **Task**(id, lesson_id, teacher_id, title, body, language, deadline_at, created_at)
- **Submission**(id, task_id, student_id, code|file_path, language, created_at)
- **AISolution**(id, task_id, provider[openai|anthropic], variant_index, code, meta, created_at)
- **Evaluation**(id, submission_id, ai_similarity, intra_group_similarity, correctness_score, final_score, rationale, created_at)

### Quality Attributes
- **Reliability**: idempotent Celery tasks; retries & timeouts on external APIs.
- **Security**: RBAC, JWT, hashed passwords, CORS, security headers, size/type limits for uploads.
- **Explainability**: store metrics and short rationale with each grade.
- **Observability**: structured logs with request IDs; health endpoints (live/ready/detailed).
- **Performance**: target <1 min grading for ~10 students per task on hackathon infra.
- **Privacy**: student code kept in private buckets; access strictly role-scoped.

### Success Metrics (MVP)
- E2E demo: Admin → Teacher → Student → AI grading visible in UI/Swagger.
- < 5 clicks for a teacher to create a task and generate AI solutions.
- ≥ 90% tasks graded automatically on deadline without manual intervention.
- Clear audit trail for each final score (metrics + rationale present).

### Risks & Mitigations
- **AI outages / rate limits** → retry with exponential backoff, cached results, fallback formula.
- **False positives** in similarity → communicate “similarity indicator,” not cheating verdicts; allow manual override later.
- **Time constraints** → prioritize a working pipeline over advanced features; ship a robust MVP.

### External Dependencies
- OpenAI API (ChatGPT) for reference solutions and final scoring prompt.
- Anthropic API (Claude) for the 4th reference solution.
- MinIO/S3 for file storage.
- Redis + Celery for async processing.
- Sentence-transformers or TF-IDF for similarity (service can switch by config).

### Ethical Position
EduCode does not accuse or penalize; it **informs**. Similarity scores are indicators to aid teaching. Final grades are transparent, adjustable, and designed to encourage learning and originality.
