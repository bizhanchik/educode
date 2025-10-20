# ============================================================
# 🧠 PROJECT RULES: EduCode - AI-Powered Education Platform
# ============================================================

## 1. PROJECT OVERVIEW
EduCode is an AI-powered platform for IT college teachers to create programming lessons and tasks, 
where students upload their code solutions, and the system automatically evaluates them using AI-based similarity 
analysis and grading logic. The project must support three user roles (Admin, Teacher, Student) and implement full 
AI-assisted evaluation logic within one sprint (hackathon-scale MVP).

The platform’s main goal is to detect algorithmic originality among students and provide automated, fair scoring 
based on similarity to AI-generated code and peers’ submissions.

---

## 2. CORE OBJECTIVE
Develop a **working MVP** of EduCode that allows:
- Teachers to create lessons and coding tasks.
- Students to upload solutions before deadlines.
- The system to automatically:
  1. Generate AI reference solutions (3 via ChatGPT thread, 1 via Anthropic Claude).
  2. Compare each student submission to:
     - AI-generated solutions (AI similarity)
     - Other students in the same group (intra-group similarity)
  3. Send these metrics to ChatGPT to generate the final grade (1–100).
  4. Auto-grade all tasks at the deadline if the teacher does not trigger it manually.
- Admins to manage users, groups, and view system statistics.

All AI actions (generation, comparison, evaluation) must be traceable, reproducible, and explainable.

---

## 3. ROLES AND ACCESS
### Admin
- Can create Teachers and Students.
- Assigns Teachers to Groups and Subjects.
- Views stats: total users, task activity, suspicious similarity patterns.

### Teacher
- Creates Lessons and Tasks with deadlines.
- Triggers AI solution generation.
- Reviews results and triggers grading (or waits for auto-grade).

### Student
- Views assigned tasks and deadlines.
- Uploads code solutions.
- Sees their “AI similarity” score immediately after submission.
- Sees final grade and feedback once grading is complete.

---

## 4. AI PIPELINE SPECIFICATIONS

### 4.1 AI Solution Generation
- For each task, EduCode must generate **4 AI reference solutions**:
  - 3 via **OpenAI (ChatGPT)** in a single thread:
    1. “Solve the problem as described.”
    2. “Solve it differently using another approach.”
    3. “Solve it in yet another distinct way.”
  - 1 via **Anthropic Claude** using the same problem description.
- All 4 results are stored as `AISolution` entries with metadata (model, prompt, timestamp).

### 4.2 Similarity Evaluation
After a student submits code:
- Normalize and tokenize both student and AI codes.
- Compute **AI similarity** using cosine similarity on embeddings (e.g., OpenAI embeddings or SentenceTransformers).
- Store the result as `ai_similarity` (0–1 float).

When grading:
- Compute **intra-group similarity** among student submissions.
- Both metrics are passed to ChatGPT for final grade reasoning.

### 4.3 Final Grade Calculation
Prompt to ChatGPT:
System: You are a strict but fair teacher grading student code originality.
User:
Task description: {text}
Correctness score: {correctness_score}/100
AI similarity: {ai_similarity}
Group similarity: {intra_group_similarity}
Generate a JSON response:
{"score": <int 1..100>, "rationale": "<brief explanation>"}

sql
Copy code
ChatGPT returns a final numeric grade (1–100) and a rationale string.

If AI services are unavailable, fallback logic applies:
final_score = clamp(correctness - penalty_ai - penalty_group, 1, 100)

yaml
Copy code

---

## 5. DATABASE MODEL (MVP)
| Entity | Description |
|---------|--------------|
| User | id, name, email, role (admin/teacher/student), group_id |
| Group | id, name |
| Subject | id, name |
| Lesson | id, teacher_id, subject_id, title, description |
| Task | id, lesson_id, title, body, language, deadline_at |
| AISolution | id, task_id, provider, variant_index, code, meta |
| Submission | id, task_id, student_id, code, created_at |
| Evaluation | id, submission_id, ai_similarity, intra_group_similarity, final_score, rationale |

---

## 6. BACKEND ARCHITECTURE
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL (SQLAlchemy + Alembic)
- **Queue:** Celery + Redis
- **Storage:** MinIO or S3
- **AI Integration:** OpenAI API + Anthropic API
- **Scheduler:** Celery Beat (auto-grading at deadline)
- **Similarity Engine:** cosine/jaccard metrics (Python or microservice)
- **Containerization:** Docker Compose

---

## 7. FRONTEND ARCHITECTURE
- **Framework:** React + Tailwind
- **Routing:** React Router
- **HTTP:** axios -> FastAPI REST endpoints
- **Roles:**
  - Admin Dashboard (user management, stats)
  - Teacher Dashboard (lessons, tasks, grading)
  - Student Dashboard (task list, upload, feedback)
- **Deployment:** Vercel or local dev server

---

## 8. WORKFLOW SUMMARY
1. Admin creates Teacher + Students and assigns Groups/Subjects.
2. Teacher creates a Lesson and adds Tasks (with deadline).
3. System generates AI solutions (4 per task).
4. Students upload code before the deadline.
5. On submission:
   - AI similarity is calculated immediately.
6. On deadline or teacher click:
   - Intra-group similarity + AI similarity are aggregated.
   - ChatGPT generates the final score.
7. Teacher views the graded table of results.

---

## 9. NON-FUNCTIONAL REQUIREMENTS
- Performance: Each task grading must complete within 1 minute for 10 students.
- Reliability: All Celery jobs must be idempotent and retry-safe.
- Explainability: Every AI decision (grade, similarity) must be logged and viewable.
- Security: No public sign-up. Admin-only account creation.
- Privacy: Student code stored securely in private buckets.
- Transparency: Each score must have a rationale.
- Deployability: Must run locally via `docker-compose up`.

---

## 10. SUCCESS CRITERIA (for Hackathon Demo)
✅ Admin can create Teacher and Students.  
✅ Teacher can create a Lesson and Task.  
✅ AI solutions are auto-generated.  
✅ Students upload code and see AI similarity %.  
✅ At deadline, system auto-grades all submissions.  
✅ Teacher sees final scores (1–100) with rationale.  
✅ Frontend and Backend communicate smoothly via REST.  
✅ Demo video shows full user flow end-to-end.

---

## 11. DEVELOPMENT RULES FOR AI ASSISTANTS
When generating or modifying code:
- Always follow **FastAPI + PostgreSQL + Celery + React** stack.
- Use async endpoints in FastAPI where applicable.
- All endpoints must return JSON in a consistent `{data, status}` schema.
- When uncertain about thresholds or formulas — prefer transparency and parameterization.
- Always include logging for AI API calls and similarity calculations.
- Prefer modular design: `services/ai.py`, `services/similarity.py`, `tasks/grading.py`, etc.
- Prioritize working MVP over perfect architecture.
- When simplifying, document your assumptions clearly in code comments.
- Never hardcode API keys or credentials; use environment variables.

---

## 12. ETHICAL GUIDELINES
EduCode does **not** punish or accuse students of cheating.
AI similarity scores are indicators of originality, not proof of misconduct.
Final grades combine correctness and originality, with AI assistance only.
All feedback to users must remain constructive and educational.

---

## 13. KEYWORDS FOR CONTEXT RETENTION
EduCode, AI similarity, exoplanet detection (ignore), FastAPI, PostgreSQL, Celery, Redis, ChatGPT, Anthropic, 
student originality, automatic grading, IT college, code comparison, teacher dashboard, student portal, 
docker-compose, AI evaluation, OpenAI embeddings, fairness, automated deadlines.

---

## 14. OUTPUT EXPECTATIONS
All generated code, prompts, or configurations by the AI must:
- Be **production-valid** (no pseudo code).
- Contain **comments explaining logic**.
- Include **realistic endpoint names** and JSON payloads.
- Use clear variable names and proper typing.
- Follow PEP8 / React best practices.
- Support easy extension for testing and scaling.

---

## 15. PRIMARY OBJECTIVE FOR THIS SESSION
> Build and optimize the EduCode MVP (backend + AI logic + basic frontend) 
> capable of automatically evaluating student submissions and generating fair, explainable grades using AI.

# ============================================================
# END OF PROJECT RULES
# ============================================================
"""