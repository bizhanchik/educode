
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TeacherSubjectGroupBase(BaseModel):
    teacher_id: int = Field(..., description="Teacher user ID")
    subject_id: int = Field(..., description="Subject ID")
    group_id: int = Field(..., description="Group ID")


class TeacherSubjectGroupCreate(TeacherSubjectGroupBase):
    pass


class TeacherSubjectGroupRead(TeacherSubjectGroupBase):
    id: int = Field(..., description="Assignment ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


class TeacherSubjectGroupWithDetails(TeacherSubjectGroupRead):
    teacher_name: Optional[str] = Field(None, description="Teacher's full name")
    subject_name: Optional[str] = Field(None, description="Subject name")
    group_name: Optional[str] = Field(None, description="Group name")


class TeacherSubjectGroupList(BaseModel):
    assignments: List[TeacherSubjectGroupWithDetails]
    total: int
    page: int
    size: int


class TeacherSubjectsResponse(BaseModel):
    teacher_id: int
    group_id: int
    subjects: List[dict] = Field(default_factory=list, description="List of subjects with details")


class TeacherGroupsResponse(BaseModel):
    teacher_id: int
    subject_id: int
    groups: List[dict] = Field(default_factory=list, description="List of groups with details")
