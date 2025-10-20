"""
EduCode Backend - Lesson Schemas

Pydantic schemas for Lesson model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LessonBase(BaseModel):
    """Base Lesson schema with common fields."""
    title: str = Field(..., min_length=1, max_length=255, description="Lesson title")
    description: Optional[str] = Field(None, description="Lesson description")
    subject_id: int = Field(..., description="Subject ID")
    teacher_id: int = Field(..., description="Teacher ID")


class LessonCreate(LessonBase):
    """Schema for creating a new lesson."""
    pass


class LessonRead(LessonBase):
    """
    Schema for reading lesson data.

    IMPORTANT: task_count removed to prevent MissingGreenlet errors.
    Compute task_count at route level using SQL aggregation.
    """
    id: int = Field(..., description="Lesson ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # REMOVED: task_count field (caused greenlet errors when accessing lesson.tasks relationship)
    # Routes should compute this using: select(func.count(Task.id)).where(Task.lesson_id == lesson.id)

    class Config:
        from_attributes = True


class LessonUpdate(BaseModel):
    """Schema for updating lesson data."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    subject_id: Optional[int] = Field(None)


class LessonList(BaseModel):
    """Schema for paginated lesson list response."""
    lessons: List[LessonRead]
    total: int
    page: int
    size: int


class LessonWithTasks(LessonRead):
    """Schema for lesson with task details."""
    tasks: List['TaskRead'] = Field(default_factory=list, description="Tasks in this lesson")


class LessonWithRelations(LessonRead):
    """Schema for lesson with related entities."""
    subject: Optional['SubjectRead'] = Field(None, description="Subject details")
    teacher: Optional['UserRead'] = Field(None, description="Teacher details")
    tasks: List['TaskRead'] = Field(default_factory=list, description="Tasks in this lesson")

# Resolve forward references
try:
    from app.schemas.subject import SubjectRead
    from app.schemas.user import UserRead
    from app.schemas.task import TaskRead
except Exception:
    SubjectRead = UserRead = TaskRead = None

try:
    LessonWithTasks.model_rebuild()
    LessonWithRelations.model_rebuild()
except Exception:
    pass