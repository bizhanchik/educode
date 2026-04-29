
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.lesson_material import MaterialType


class LessonMaterialBase(BaseModel):
    lesson_id: int = Field(..., description="Lesson ID")
    type: MaterialType = Field(..., description="Material type (text, file, pdf, docx, pptx, txt, or youtube)")
    title: str = Field(..., min_length=1, max_length=255, description="Material title")
    content: Optional[str] = Field(None, description="Text content (for type=text)")
    file_url: Optional[str] = Field(None, description="MinIO file path (for type=file/pdf/docx/pptx/txt)")
    youtube_url: Optional[str] = Field(None, description="YouTube video URL (for type=youtube)")


class LessonMaterialCreate(BaseModel):
    type: MaterialType = Field(..., description="Material type")
    title: str = Field(..., min_length=1, max_length=255, description="Material title")
    content: Optional[str] = Field(None, description="Text content (required for type=text)")
    youtube_url: Optional[str] = Field(None, description="YouTube URL (required for type=youtube)")

    @field_validator('youtube_url')
    @classmethod
    def validate_youtube_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not (
                v.startswith('https://www.youtube.com/') or
                v.startswith('https://youtu.be/') or
                v.startswith('http://www.youtube.com/') or
                v.startswith('http://youtu.be/')
            ):
                raise ValueError('Invalid YouTube URL. Must start with https://www.youtube.com/ or https://youtu.be/')
        return v

    @model_validator(mode='after')
    def validate_type_specific_fields(self):
        if self.type == MaterialType.TEXT:
            if not self.content or not self.content.strip():
                raise ValueError('Content is required for text materials')

        elif self.type == MaterialType.YOUTUBE:
            if not self.youtube_url:
                raise ValueError('YouTube URL is required for youtube materials')


        return self


class LessonMaterialRead(LessonMaterialBase):
    id: int = Field(..., description="Material ID")
    extracted_text: Optional[str] = Field(None, description="Text extracted from PDF/PPTX/DOCX")
    extracted_images: Optional[str] = Field(None, description="JSON array of extracted images")
    use_for_ai_generation: bool = Field(False, description="Use for AI generation")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class LessonMaterialList(BaseModel):
    materials: list[LessonMaterialRead]
    total: int
