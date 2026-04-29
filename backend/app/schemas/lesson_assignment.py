
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LessonAssignmentBase(BaseModel):
    lesson_id: int = Field(..., description="Lesson ID")
    group_id: int = Field(..., description="Group ID")
    deadline_at: datetime = Field(..., description="Assignment deadline")


class LessonAssignmentCreate(LessonAssignmentBase):
    pass


class LessonAssignmentRead(LessonAssignmentBase):
    id: int = Field(..., description="Assignment ID")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class LessonAssignmentWithDetails(LessonAssignmentRead):
    lesson_title: Optional[str] = Field(None, description="Lesson title")
    group_name: Optional[str] = Field(None, description="Group name")
    subject_name: Optional[str] = Field(None, description="Subject name")
    teacher_name: Optional[str] = Field(None, description="Teacher name")


class LessonAssignmentList(BaseModel):
    assignments: List[LessonAssignmentWithDetails]
    total: int
    page: int
    size: int


class LessonAssignmentBulkCreate(BaseModel):
    lesson_id: int = Field(..., description="Lesson ID")
    assignments: List[dict] = Field(
        ...,
        description="List of {group_id, deadline_at} assignments"
    )
