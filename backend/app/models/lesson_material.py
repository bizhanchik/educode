from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MaterialType(str, enum.Enum):
    TEXT = "text"
    FILE = "file"
    PDF = "pdf"
    PPTX = "pptx"
    DOCX = "docx"
    TXT = "txt"
    YOUTUBE = "youtube"


class LessonMaterial(Base):

    __tablename__ = "lesson_materials"

    id = Column(Integer, primary_key=True, index=True)

    lesson_id = Column(
        Integer,
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type = Column(
        Enum(MaterialType, name="materialtype", create_type=True),
        nullable=False,
        index=True
    )
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(512), nullable=True)
    youtube_url = Column(String(512), nullable=True)

    extracted_text = Column(Text, nullable=True)
    extracted_images = Column(Text, nullable=True)
    use_for_ai_generation = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    lesson = relationship(
        "Lesson",
        back_populates="materials",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<LessonMaterial(id={self.id}, type='{self.type.value}', title='{self.title}', lesson_id={self.lesson_id})>"
