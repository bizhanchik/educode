from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LessonProgress(Base):

    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)

    completed = Column(Boolean, default=False, nullable=False)
    sections_completed = Column(JSON, default={"video": False, "theory": False, "practice": False}, nullable=False)

    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
    lesson = relationship("Lesson", lazy="selectin")

    def __repr__(self) -> str:
        return f"<LessonProgress(id={self.id}, user_id={self.user_id}, lesson_id={self.lesson_id}, completed={self.completed})>"

    @property
    def completion_percentage(self) -> float:
        if not self.sections_completed:
            return 0.0

        sections = self.sections_completed
        total_sections = len(sections)
        if total_sections == 0:
            return 0.0

        completed_sections = sum(1 for completed in sections.values() if completed)
        return (completed_sections / total_sections) * 100.0

    @property
    def all_sections_completed(self) -> bool:
        if not self.sections_completed:
            return False
        return all(self.sections_completed.values())
