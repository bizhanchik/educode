# 🎓 EduCode Backend

> AI-powered education platform for programming lessons and automated code evaluation

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 Overview

EduCode is a role-based platform designed for IT colleges where:
- **Teachers** create lessons and coding tasks with deadlines
- **Students** submit code solutions (file or text)
- **AI** evaluates originality and correctness using similarity analysis
- **Automated grading** happens on deadline or manually

### Key Features

- ✅ Role-based authentication (Admin, Teacher, Student)
- ✅ JWT tokens (access + refresh)
- ✅ Automated AI code generation (4 reference solutions: 3x OpenAI + 1x Anthropic)
- ✅ Code similarity analysis (AI-based + intra-group peer comparison)
- ✅ Automated grading on deadline via Celery scheduler
- ✅ MinIO file storage for code submissions
- ✅ RESTful API with OpenAPI/Swagger documentation
- ✅ Docker Compose for easy deployment
- ✅ Comprehensive test suite
- ✅ Production-ready security (CORS, rate limiting, security headers)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     EduCode Backend                      │
├─────────────────────────────────────────────────────────┤
│  FastAPI Application (Port 8000)                        │
│  ├── Auth (JWT)                                          │
│  ├── CRUD APIs (Users, Groups, Subjects, Lessons, Tasks)│
│  ├── Submissions & Evaluations                          │
│  └── AI Integration (OpenAI + Anthropic)                │
├─────────────────────────────────────────────────────────┤
│  Celery Worker & Beat Scheduler                         │
│  ├── Generate AI Solutions                               │
│  ├── Calculate Similarity                                │
│  ├── Auto-grade on Deadline                             │
│  └── Background Job Processing                           │
├─────────────────────────────────────────────────────────┤
│  Similarity Service (Port 8001)                         │
│  └── Code Similarity Analysis (TF-IDF + Embeddings)     │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                     │
│  Redis (Celery Broker)                                  │
│  MinIO (S3-compatible File Storage)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd educode/backend
```

### 2. Environment Setup

The `.env` file already contains working configuration with API keys. Review and modify if needed:

```bash
# .env is already configured - check the values
cat .env
```

### 3. Start Services

```bash
# Build and start all services
make setup

# Or manually:
docker compose build
docker compose up -d
docker compose exec api alembic upgrade head
docker compose exec api python scripts/seed.py
```

### 4. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)

### 5. Test Login

**Default credentials** (all passwords: `Passw0rd!`):
- Admin: `admin@educode.io`
- Teacher: `teacher@educode.io`
- Student: `student1@educode.io`, `student2@educode.io`, `student3@educode.io`

```bash
# Test admin login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@educode.io","password":"Passw0rd!"}'
```

---

## 📚 API Documentation

### Authentication

All endpoints (except health and login) require JWT authentication.

```bash
# Login
POST /api/v1/auth/login
{
  "email": "admin@educode.io",
  "password": "Passw0rd!"
}

# Response
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "role": "admin",
  "expires_in": 14400
}

# Use token in subsequent requests
Authorization: Bearer eyJ...
```

### Key Endpoints

| Endpoint | Method | Description | Role |
|----------|--------|-------------|------|
| `/api/v1/health` | GET | Health check | Public |
| `/api/v1/auth/login` | POST | User login | Public |
| `/api/v1/auth/me` | GET | Current user info | All |
| `/api/v1/users/` | POST | Create user | Admin |
| `/api/v1/users/` | GET | List users | Admin |
| `/api/v1/groups/` | POST | Create group | Admin |
| `/api/v1/subjects/` | POST | Create subject | Admin |
| `/api/lessons/` | POST | Create lesson | Teacher |
| `/api/tasks/` | POST | Create task | Teacher |
| `/api/tasks/{id}/prepare-ai` | POST | Generate AI solutions | Teacher |
| `/api/tasks/{id}/grade` | POST | Grade submissions | Teacher |
| `/api/submissions/` | POST | Submit code | Student |
| `/api/submissions/mine` | GET | My submissions | Student |
| `/api/evaluations/task/{id}/summary` | GET | Task grading summary | Teacher |

For complete API documentation, visit: **http://localhost:8000/docs**

---

## 🔄 User Flows

### Admin Flow

1. Login as admin
2. Create groups, subjects, teachers, and students
3. Manage system configuration

### Teacher Flow

1. Login as teacher
2. Create lesson under a subject
3. Create task with:
   - Title, description, programming language
   - Deadline (UTC timezone)
4. Generate AI reference solutions: `POST /api/tasks/{id}/prepare-ai`
5. Monitor submissions
6. Grade manually or wait for auto-grading on deadline

### Student Flow

1. Login as student
2. View available subjects and lessons
3. View tasks for a lesson
4. Submit code solution:
   - Upload file OR paste code text
5. Receive AI similarity feedback immediately
6. View final grade after deadline

---

## 🧪 Testing

### Run All Tests

```bash
make test

# Or manually:
docker compose exec api pytest -v --cov=app
```

### Run Smoke Tests

```bash
make smoke

# Or manually:
bash scripts/smoke.sh
```

### Test Categories

- **Unit Tests**: `tests/test_auth.py`, `tests/test_health.py`
- **Integration Tests**: `tests/test_crud.py`, `tests/test_submissions.py`
- **AI Pipeline Tests**: `tests/test_ai_pipeline.py` (with mocked APIs)

---

## 🛠️ Development

### Available Make Commands

```bash
make help           # Show all commands
make up             # Start services
make down           # Stop services
make logs           # View logs
make migrate        # Run migrations
make seed           # Seed database
make shell          # PostgreSQL shell
make test           # Run tests
make lint           # Run linters
make fmt            # Format code
make smoke          # Smoke tests
make health         # Check health
```

### Database Migrations

```bash
# Create new migration
make migrate-create

# Apply migrations
make migrate

# Rollback one migration
make migrate-down
```

### Code Quality

```bash
# Format code
make fmt

# Run linters
make lint

# Install pre-commit hooks (local)
pre-commit install
```

---

## 📊 Database Schema

### Key Models

- **User**: id, name, email, password_hash, role (admin/teacher/student), group_id
- **Group**: id, name
- **Subject**: id, name
- **Lesson**: id, subject_id, teacher_id, title, description
- **Task**: id, lesson_id, teacher_id, title, body, language, deadline_at
- **Submission**: id, task_id, student_id, code, language
- **AISolution**: id, task_id, provider (openai/anthropic), variant_index, code
- **Evaluation**: id, submission_id, ai_similarity, intra_group_similarity, final_score, rationale

---

## 🔐 Security Features

- ✅ **JWT Authentication** with access + refresh tokens
- ✅ **Password Hashing** using bcrypt
- ✅ **Role-Based Access Control** (RBAC)
- ✅ **Rate Limiting** (slowapi)
- ✅ **CORS Configuration**
- ✅ **Security Headers** (X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ **Request ID Tracking**
- ✅ **Structured Logging**
- ✅ **Input Validation** (Pydantic v2)

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check service status
make status

# View logs
make logs

# Restart services
make restart
```

### Database Issues

```bash
# Check database connection
docker compose exec postgres pg_isready -U educode_user

# Open database shell
make shell

# Reset database
make clean setup
```

### Migration Errors

```bash
# Check current migration version
docker compose exec api alembic current

# See migration history
docker compose exec api alembic history

# Force to latest (caution!)
docker compose exec api alembic upgrade head
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### API Not Responding

```bash
# Check API health
curl http://localhost:8000/api/v1/health

# Check logs
make logs-api

# Restart API
docker compose restart api
```

---

## 📝 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://...` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `SECRET_KEY` | JWT secret key | (set in .env) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | 30 |
| `OPENAI_API_KEY` | OpenAI API key | (set in .env) |
| `ANTHROPIC_API_KEY` | Anthropic API key | (set in .env) |
| `MINIO_ENDPOINT` | MinIO endpoint | `minio:9000` |
| `LOG_LEVEL` | Logging level | `INFO` |

---

## 🔄 Celery Tasks

### Scheduled Tasks (Celery Beat)

- **Auto-grade expired tasks**: Runs every 5 minutes
- **Cleanup old results**: Runs every hour

### Background Tasks

- `generate_ai_solutions_task(task_id)`: Generate 4 AI reference solutions
- `calc_ai_similarity_task(submission_id)`: Calculate similarity vs AI codes
- `grade_task(task_id)`: Grade all submissions for a task

---

## 📦 Tech Stack

| Technology | Purpose |
|------------|---------|
| FastAPI | Async web framework |
| PostgreSQL | Primary database |
| Redis | Celery broker + cache |
| Celery | Background jobs + scheduler |
| MinIO | S3-compatible file storage |
| OpenAI | AI code generation |
| Anthropic | AI code generation |
| SQLAlchemy 2.x | Async ORM |
| Alembic | Database migrations |
| Pydantic v2 | Data validation |
| JWT | Authentication |
| Docker | Containerization |
| Pytest | Testing framework |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Format code: `make fmt`
6. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Documentation**: http://localhost:8000/docs
- **Issues**: Create an issue on GitHub
- **Email**: support@educode.io (if configured)

---

## 🎯 Roadmap

- [ ] Frontend application (React/Vue)
- [ ] Rich unit test autograding
- [ ] Multi-language support beyond Python
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Integration with LMS platforms
- [ ] Mobile application

---

**Built with ❤️ for education**
