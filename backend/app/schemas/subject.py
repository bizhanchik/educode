"""
EduCode Backend - Subject Schemas

Pydantic schemas for Subject model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SubjectBase(BaseModel):
    """Base Subject schema with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="Subject name")


class SubjectCreate(SubjectBase):
    """Schema for creating a new subject."""
    pass


class SubjectRead(SubjectBase):
    """Schema for reading subject data."""
    id: int = Field(..., description="Subject ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Computed properties (optional to avoid MissingGreenlet errors)
    lesson_count: Optional[int] = Field(default=0, description="Number of lessons in subject")
    task_count: Optional[int] = Field(default=0, description="Total number of tasks in subject")
    
    class Config:
        from_attributes = True


class SubjectUpdate(BaseModel):
    """Schema for updating subject data."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class SubjectList(BaseModel):
    """Schema for paginated subject list response."""
    subjects: List[SubjectRead]
    total: int
    page: int
    size: int


class SubjectWithLessons(SubjectRead):
    """Schema for subject with lesson details."""
    lessons: List['LessonRead'] = Field(default_factory=list, description="Lessons in this subject")

# Resolve forward references
try:
    from app.schemas.lesson import LessonRead
except Exception:
    LessonRead = None

try:
    SubjectWithLessons.model_rebuild()
except Exception:
    pass