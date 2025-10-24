"""
EduCode Backend - Models Package

This package contains all SQLAlchemy ORM models for the EduCode platform.
Models are organized by domain and include proper relationships and constraints.
"""

from app.models.user import User
from app.models.group import Group
from app.models.subject import Subject
from app.models.lesson import Lesson
from app.models.lesson_material import LessonMaterial
from app.models.task import Task
from app.models.submission import Submission
from app.models.evaluation import Evaluation
from app.models.ai_solution import AISolution

__all__ = [
    "User",
    "Group",
    "Subject",
    "Lesson",
    "LessonMaterial",
    "Task",
    "Submission",
    "Evaluation",
    "AISolution"
]