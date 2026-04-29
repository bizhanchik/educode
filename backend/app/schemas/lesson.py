
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class LessonBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Lesson title")
    description: Optional[str] = Field(None, description="Lesson description")
    subject_id: int = Field(..., description="Subject ID")
    teacher_id: Optional[int] = Field(None, description="Teacher ID (auto-set for teachers)")
    order: Optional[int] = Field(None, description="Order/sequence number for sorting lessons")


class LessonCreate(LessonBase):
    pass


class LessonRead(LessonBase):
    id: int = Field(..., description="Lesson ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


    class Config:
        from_attributes = True


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None)
    subject_id: Optional[int] = Field(None)
    order: Optional[int] = Field(None, description="Order/sequence number for sorting lessons")


class LessonList(BaseModel):
    lessons: List[LessonRead]
    total: int
    page: int
    size: int


class LessonWithTasks(LessonRead):
    tasks: List['TaskRead'] = Field(default_factory=list, description="Tasks in this lesson")


class LessonWithRelations(LessonRead):
    subject: Optional['SubjectRead'] = Field(None, description="Subject details")
    teacher: Optional['UserRead'] = Field(None, description="Teacher details")
    tasks: List['TaskRead'] = Field(default_factory=list, description="Tasks in this lesson")

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