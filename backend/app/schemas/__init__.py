"""
EduCode Backend - Schemas Package

This package contains all Pydantic schemas for request/response validation.
Schemas are organized by domain with Base, Create, and Read variants.
"""

from app.schemas.user import UserBase, UserCreate, UserRead
from app.schemas.group import GroupBase, GroupCreate, GroupRead
from app.schemas.subject import SubjectBase, SubjectCreate, SubjectRead
from app.schemas.lesson import LessonBase, LessonCreate, LessonRead
from app.schemas.task import TaskBase, TaskCreate, TaskRead
from app.schemas.submission import SubmissionBase, SubmissionCreate, SubmissionRead
from app.schemas.evaluation import EvaluationBase, EvaluationCreate, EvaluationRead
from app.schemas.ai_solution import AISolutionBase, AISolutionCreate, AISolutionRead

__all__ = [
    # User schemas
    "UserBase", "UserCreate", "UserRead",
    # Group schemas
    "GroupBase", "GroupCreate", "GroupRead",
    # Subject schemas
    "SubjectBase", "SubjectCreate", "SubjectRead",
    # Lesson schemas
    "LessonBase", "LessonCreate", "LessonRead",
    # Task schemas
    "TaskBase", "TaskCreate", "TaskRead",
    # Submission schemas
    "SubmissionBase", "SubmissionCreate", "SubmissionRead",
    # Evaluation schemas
    "EvaluationBase", "EvaluationCreate", "EvaluationRead",
    # AISolution schemas
    "AISolutionBase", "AISolutionCreate", "AISolutionRead"
]