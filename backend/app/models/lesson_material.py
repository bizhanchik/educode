"""
EduCode Backend - Lesson Material Model

Defines the LessonMaterial entity for attaching educational resources to lessons.
Teachers can attach text, files, or YouTube links as learning materials.
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MaterialType(str, enum.Enum):
    """Enum for lesson material types"""
    TEXT = "text"
    FILE = "file"  # Generic file (image, archive, etc.)
    PDF = "pdf"  # PDF document (text can be extracted)
    PPTX = "pptx"  # PowerPoint presentation (text can be extracted)
    DOCX = "docx"  # Word document (text can be extracted)
    YOUTUBE = "youtube"


class LessonMaterial(Base):
    """
    LessonMaterial model representing educational resources attached to lessons.

    Materials can be text content, uploaded files (PDF, PPTX, DOCX, etc.), or YouTube video links.
    Teachers can attach multiple materials to help students understand lesson concepts.

    For AI task generation, text can be extracted from PDF/PPTX/DOCX files automatically.

    Attributes:
        id: Primary key
        lesson_id: Foreign key to Lesson
        type: Material type (text, file, pdf, pptx, docx, youtube)
        title: Material title/name
        content: Text content (for type=text)
        file_url: MinIO file path (for type=file/pdf/pptx/docx)
        youtube_url: YouTube video URL (for type=youtube)
        extracted_text: Text extracted from PDF/PPTX/DOCX files
        use_for_ai_generation: Whether to use this material for AI task generation
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

    # AI generation fields
    extracted_text = Column(Text, nullable=True)  # Text extracted from PDF/PPTX/DOCX
    use_for_ai_generation = Column(Boolean, default=False, nullable=False)  # Use for AI task generation

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
