
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
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

# Setup structured logging
setup_logging(log_level=getattr(settings, 'LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("🚀 Starting EduCode Backend...")
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

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


# Add middleware (order matters - last added is executed first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestIDMiddleware)
# Enhanced CORS configuration with ngrok support
def get_allowed_origins():
    """Get allowed origins including ngrok domains in development."""
    origins = list(settings.ALLOWED_ORIGINS)

    # In development, allow all ngrok domains
    if settings.DEBUG:
        # Add wildcard pattern - we'll handle this in middleware
        origins.append("*")  # Allow all origins in development for easier testing

    return origins if "*" not in origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(groups_router, prefix="/api/v1/groups", tags=["groups"])
app.include_router(subjects_router, prefix="/api/v1/subjects", tags=["subjects"])
app.include_router(lessons_router, prefix="/api/v1", tags=["lessons"])
app.include_router(lesson_materials_router, tags=["lesson-materials"])
app.include_router(tasks_router, prefix="/api/v1", tags=["tasks"])
app.include_router(submissions_router, prefix="/api/v1", tags=["submissions"])
app.include_router(evaluations_router, prefix="/api/v1", tags=["evaluations"])
app.include_router(ai_solutions_router, prefix="/api/v1", tags=["ai-solutions"])
app.include_router(similarity_router, prefix="/api/v1", tags=["similarity"])
app.include_router(teacher_assignments_router, prefix="/api/v1/teacher-assignments", tags=["teacher-assignments"])
app.include_router(lesson_assignments_router, prefix="/api/v1/lesson-assignments", tags=["lesson-assignments"])
app.include_router(ai_generation_router, prefix="/api/v1/ai-generation", tags=["ai-generation"])

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
