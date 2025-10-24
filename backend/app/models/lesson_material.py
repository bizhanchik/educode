"""
EduCode Backend - Lesson Material Model

Defines the LessonMaterial entity for attaching educational resources to lessons.
Teachers can attach text, files, or YouTube links as learning materials.
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MaterialType(str, enum.Enum):
    """Enum for lesson material types"""
    TEXT = "text"
    FILE = "file"
    YOUTUBE = "youtube"


class LessonMaterial(Base):
    """
    LessonMaterial model representing educational resources attached to lessons.

    Materials can be text content, uploaded files, or YouTube video links.
    Teachers can attach multiple materials to help students understand lesson concepts.

    Attributes:
        id: Primary key
        lesson_id: Foreign key to Lesson
        type: Material type (text, file, or youtube)
        title: Material title/name
        content: Text content (for type=text)
        file_url: MinIO file path (for type=file)
        youtube_url: YouTube video URL (for type=youtube)
        created_at: Timestamp when material was created
    """

    __tablename__ = "lesson_materials"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    lesson_id = Column(
        Integer,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Material information
    type = Column(
        Enum(MaterialType, name="materialtype", create_type=True),
        nullable=False,
        index=True
    )
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)  # For text materials
    file_url = Column(String(512), nullable=True)  # MinIO path for files
    youtube_url = Column(String(512), nullable=True)  # YouTube video URL

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    # Use lazy="selectin" to prevent greenlet errors in async context
    lesson = relationship(
        "Lesson",
        back_populates="materials",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<LessonMaterial(id={self.id}, type='{self.type.value}', title='{self.title}', lesson_id={self.lesson_id})>"
