
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.auth import validate_auth_env
from app.core.database import init_db, close_db
from app.core.rate_limit import limiter
from app.core.logging import setup_logging, RequestIDMiddleware
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.groups import router as groups_router
from app.routes.subjects import router as subjects_router
from app.routes.lessons import router as lessons_router
from app.routes.lesson_materials import router as lesson_materials_router
from app.routes.tasks import router as tasks_router
from app.routes.submissions import router as submissions_router
from app.routes.evaluations import router as evaluations_router
from app.routes.ai_solutions import router as ai_solutions_router
from app.routes.similarity import router as similarity_router
from app.routes.teacher_assignments import router as teacher_assignments_router
from app.routes.lesson_assignments import router as lesson_assignments_router
from app.routes.ai_generation import router as ai_generation_router
from app.routes.progress import router as progress_router
from app.routes.notifications import router as notifications_router
from app.routes.journal import router as journal_router
from app.routes.tests import router as tests_router
from app.routes.code_execution import router as code_execution_router
from app.routes.lesson_progress import router as lesson_progress_router

setup_logging(log_level=getattr(settings, 'LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("🚀 Starting EduCode Backend...")
    try:
        validate_auth_env()
        logger.info("✅ Auth env validated")
    except RuntimeError as e:
        logger.error(f"❌ Auth configuration failed: {e}")
        raise
    try:
        await init_db()
        logger.info("✅ DB connected")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise

    yield

    logger.info("🛑 Shutting down EduCode Backend...")
    await close_db()
    logger.info("✅ DB connection closed")


app = FastAPI(
    title="EduCode API",
    description="AI-powered education platform for programming lessons and automated code evaluation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Sanitize 500 error details in production to avoid leaking internal info."""
    if exc.status_code == 500 and not getattr(settings, "DEBUG", False):
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please contact support or check server logs."},
        )
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


def get_allowed_origins():
    origins = set(settings.ALLOWED_ORIGINS)
    https_variants = {
        origin.replace("http://", "https://")
        for origin in origins
        if origin.startswith("http://")
    }
    origins.update(https_variants)

    return sorted(origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:3000",
        "https://educode.bizhan.dev",
        "https://educode-eta.vercel.app",
    ],
    allow_origin_regex=r"https://(educode\.bizhan\.dev|.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)

app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(groups_router, prefix="/api/v1/groups", tags=["groups"])
app.include_router(subjects_router, prefix="/api/v1/subjects", tags=["subjects"])
app.include_router(lessons_router, prefix="/api/v1/lessons", tags=["lessons"])
app.include_router(lesson_materials_router, tags=["lesson-materials"])
app.include_router(tasks_router, prefix="/api/v1", tags=["tasks"])
app.include_router(submissions_router, prefix="/api/v1", tags=["submissions"])
app.include_router(evaluations_router, prefix="/api/v1", tags=["evaluations"])
app.include_router(ai_solutions_router, prefix="/api/v1", tags=["ai-solutions"])
app.include_router(similarity_router, prefix="/api/v1", tags=["similarity"])
app.include_router(teacher_assignments_router, prefix="/api/v1/teacher-assignments", tags=["teacher-assignments"])
app.include_router(lesson_assignments_router, prefix="/api/v1/lesson-assignments", tags=["lesson-assignments"])
app.include_router(ai_generation_router, prefix="/api/v1/ai-generation", tags=["ai-generation"])
app.include_router(progress_router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(journal_router, prefix="/api/v1/journal", tags=["journal"])
app.include_router(tests_router, prefix="/api/v1/tests", tags=["tests"])
app.include_router(code_execution_router, prefix="/api/v1/code", tags=["code-execution"])
app.include_router(lesson_progress_router, prefix="/api/v1", tags=["lesson-progress"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to EduCode API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(f"🌟 Starting EduCode API server on {settings.HOST}:{settings.PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
