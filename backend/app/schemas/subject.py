
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, computed_field


class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Subject name")
    code: Optional[str] = Field(None, max_length=100, description="Subject code (e.g., 'CS-101', 'MATH-201')")
    status: Optional[str] = Field(None, max_length=50, description="Subject status: 'Активен' or 'Архив'")
    color: Optional[str] = Field(None, max_length=7, description="Hex color code (e.g., '#FF5733')")
    image: Optional[str] = Field(None, max_length=500, description="Image URL or path")


class SubjectCreate(SubjectBase):
    pass


class SubjectRead(SubjectBase):
    id: int = Field(..., description="Subject ID")
    status: Optional[str] = Field(None, max_length=50, description="Subject status: 'Активен' or 'Архив'")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    lesson_count: Optional[int] = Field(default=0, description="Number of lessons in subject")
    task_count: Optional[int] = Field(default=0, description="Total number of tasks in subject")

    @computed_field
    def header_color(self) -> Optional[str]:
        return self.color

    @computed_field
    def image_url(self) -> Optional[str]:
        return self.image

    class Config:
        from_attributes = True


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=100, description="Subject code")
    status: Optional[str] = Field(None, max_length=50, description="Subject status: 'Активен' or 'Архив'")
    color: Optional[str] = Field(None, max_length=7, description="Hex color code (e.g., '#FF5733')")
    image: Optional[str] = Field(None, max_length=500, description="Image URL or path")
    header_color: Optional[str] = Field(None, max_length=7, description="Hex color code (alias for color)")
    image_url: Optional[str] = Field(None, max_length=500, description="Image URL or path (alias for image)")


class SubjectList(BaseModel):
    subjects: List[SubjectRead]
    total: int
    page: int
    size: int


class SubjectWithLessons(SubjectRead):
    lessons: List['LessonRead'] = Field(default_factory=list, description="Lessons in this subject")

try:
    from app.schemas.lesson import LessonRead
except Exception:
    LessonRead = None

try:
    SubjectWithLessons.model_rebuild()
except Exception:
    pass