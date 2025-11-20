# EduCode API Routes Package

"""
EduCode Backend - Routes Package

This package contains all FastAPI route modules for the EduCode application.
Each module handles CRUD operations for specific entities with proper error handling.
"""

from .users import router as users_router
from .groups import router as groups_router
from .subjects import router as subjects_router
from .lessons import router as lessons_router
from .tasks import router as tasks_router
from .submissions import router as submissions_router
from .evaluations import router as evaluations_router
from .ai_solutions import router as ai_solutions_router
from .teacher_assignments import router as teacher_assignments_router
from .lesson_assignments import router as lesson_assignments_router
from .ai_generation import router as ai_generation_router

__all__ = [
    "users_router",
    "groups_router",
    "subjects_router",
    "lessons_router",
    "tasks_router",
    "submissions_router",
    "evaluations_router",
    "ai_solutions_router",
    "teacher_assignments_router",
    "lesson_assignments_router",
    "ai_generation_router"
]