"""
EduCode Backend - Task Schemas

Pydantic schemas for Task model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.task import ProgrammingLanguage


class TaskBase(BaseModel):
    """Base Task schema with common fields."""
    title: str = Field(..., min_length=1, max_length=255, description="Task title")
    body: str = Field(..., min_length=1, description="Task description and requirements")
    language: ProgrammingLanguage = Field(..., description="Programming language")
    lesson_id: int = Field(..., description="Lesson ID")
    deadline_at: datetime = Field(..., description="Submission deadline")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    pass


class TaskRead(TaskBase):
    """
    Schema for reading task data.

    IMPORTANT: submission_count and has_ai_solutions removed to prevent MissingGreenlet errors.
    Compute these at route level using SQL aggregation or exists queries.
    """
    id: int = Field(..., description="Task ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # SAFE computed properties (don't access relationships)
    is_expired: bool = Field(..., description="Whether task deadline has passed")
    is_active: bool = Field(..., description="Whether task is still accepting submissions")
    time_remaining: Optional[str] = Field(None, description="Human-readable time remaining")

    # REMOVED: Fields that access lazy-loaded relationships (caused greenlet errors)
    # - submission_count: Use select(func.count(Submission.id)).where(Submission.task_id == task.id)
    # - has_ai_solutions: Use exists(select(AISolution.id).where(AISolution.task_id == task.id))

    class Config:
        from_attributes = True


class TaskUpdate(BaseModel):
    """Schema for updating task data."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    body: Optional[str] = Field(None, min_length=1)
    language: Optional[ProgrammingLanguage] = Field(None)
    deadline_at: Optional[datetime] = Field(None)


class TaskList(BaseModel):
    """Schema for paginated task list response."""
    tasks: List[TaskRead]
    total: int
    page: int
    size: int


class TaskWithSubmissions(TaskRead):
    """Schema for task with submission details."""
    submissions: List['SubmissionRead'] = Field(default_factory=list, description="Submissions for this task")


class TaskWithRelations(TaskRead):
    """Schema for task with related entities."""
    lesson: Optional['LessonRead'] = Field(None, description="Lesson details")
    submissions: List['SubmissionRead'] = Field(default_factory=list, description="Submissions")
    ai_solutions: List['AISolutionRead'] = Field(default_factory=list, description="AI solutions")

# Resolve forward references
try:
    from app.schemas.lesson import LessonRead
    from app.schemas.submission import SubmissionRead
    from app.schemas.ai_solution import AISolutionRead
except Exception:
    LessonRead = SubmissionRead = AISolutionRead = None

try:
    TaskWithSubmissions.model_rebuild()
    TaskWithRelations.model_rebuild()
except Exception:
    pass