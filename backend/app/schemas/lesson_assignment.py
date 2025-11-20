"""
EduCode Backend - LessonAssignment Schemas

Pydantic schemas for LessonAssignment model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LessonAssignmentBase(BaseModel):
    """Base LessonAssignment schema with common fields."""
    lesson_id: int = Field(..., description="Lesson ID")
    group_id: int = Field(..., description="Group ID")
    deadline_at: datetime = Field(..., description="Assignment deadline")


class LessonAssignmentCreate(LessonAssignmentBase):
    """Schema for creating a new lesson assignment."""
    pass


class LessonAssignmentRead(LessonAssignmentBase):
    """Schema for reading lesson assignment data."""
    id: int = Field(..., description="Assignment ID")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class LessonAssignmentWithDetails(LessonAssignmentRead):
    """Schema for lesson assignment with related entity details."""
    lesson_title: Optional[str] = Field(None, description="Lesson title")
    group_name: Optional[str] = Field(None, description="Group name")
    subject_name: Optional[str] = Field(None, description="Subject name")
    teacher_name: Optional[str] = Field(None, description="Teacher name")


class LessonAssignmentList(BaseModel):
    """Schema for paginated lesson assignment list response."""
    assignments: List[LessonAssignmentWithDetails]
    total: int
    page: int
    size: int


class LessonAssignmentBulkCreate(BaseModel):
    """Schema for bulk creating lesson assignments to multiple groups."""
    lesson_id: int = Field(..., description="Lesson ID")
    assignments: List[dict] = Field(
        ...,
        description="List of {group_id, deadline_at} assignments"
    )
    # Example: assignments = [{"group_id": 1, "deadline_at": "2025-01-01T00:00:00Z"}]
