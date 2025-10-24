"""
EduCode Backend - Lesson Material Schemas

Pydantic schemas for LessonMaterial model validation and serialization.
Includes strict validation for type-specific required fields.
"""

from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator, model_validator


class MaterialType(str, Enum):
    """Enum for lesson material types."""
    TEXT = "text"
    FILE = "file"
    YOUTUBE = "youtube"


class LessonMaterialBase(BaseModel):
    """Base LessonMaterial schema with common fields."""
    lesson_id: int = Field(..., description="Lesson ID")
    type: MaterialType = Field(..., description="Material type (text, file, or youtube)")
    title: str = Field(..., min_length=1, max_length=255, description="Material title")
    content: Optional[str] = Field(None, description="Text content (for type=text)")
    file_url: Optional[str] = Field(None, description="MinIO file path (for type=file)")
    youtube_url: Optional[str] = Field(None, description="YouTube video URL (for type=youtube)")


class LessonMaterialCreate(BaseModel):
    """
    Schema for creating a new lesson material.

    Enforces strict validation:
    - type=text requires content
    - type=youtube requires youtube_url
    - type=file requires file upload (file_url will be set by route after upload)
    """
    type: MaterialType = Field(..., description="Material type")
    title: str = Field(..., min_length=1, max_length=255, description="Material title")
    content: Optional[str] = Field(None, description="Text content (required for type=text)")
    youtube_url: Optional[str] = Field(None, description="YouTube URL (required for type=youtube)")

    @field_validator('youtube_url')
    @classmethod
    def validate_youtube_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate YouTube URL format if provided."""
        if v is not None:
            # Basic YouTube URL validation
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
        """Validate that required fields are present based on material type."""
        if self.type == MaterialType.TEXT:
            if not self.content or not self.content.strip():
                raise ValueError('Content is required for text materials')

        elif self.type == MaterialType.YOUTUBE:
            if not self.youtube_url:
                raise ValueError('YouTube URL is required for youtube materials')

        # Note: For type=file, file upload validation is handled in the route
        # The route will ensure a file is uploaded before creating the material

        return self


class LessonMaterialRead(LessonMaterialBase):
    """
    Schema for reading lesson material data.
    Includes all fields including ID and timestamp.
    """
    id: int = Field(..., description="Material ID")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True


class LessonMaterialList(BaseModel):
    """Schema for list of lesson materials."""
    materials: list[LessonMaterialRead]
    total: int
