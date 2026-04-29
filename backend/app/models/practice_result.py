from datetime import datetime
from typing import List, Optional, Dict
import json

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PracticeResult(Base):
    __tablename__ = "practice_results"

    id = Column(Integer, primary_key=True, index=True)

    code = Column(Text, nullable=False)
    execution_result = Column(JSON, nullable=True)

    ai_feedback = Column(JSON, nullable=True)


    similarity_score = Column(Float, nullable=True)
    correctness_score = Column(Float, nullable=True)
    practice_score = Column(Float, nullable=False)
    is_plagiarized = Column(Boolean, nullable=False, default=False)

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    lesson = relationship("Lesson", back_populates="practice_results", lazy="selectin")
    student = relationship("User", back_populates="practice_results", lazy="selectin")
    task = relationship("Task", back_populates="practice_results", lazy="selectin")

    def __repr__(self) -> str:
        return f"<PracticeResult(id={self.id}, lesson_id={self.lesson_id}, student_id={self.student_id}, practice_score={self.practice_score})>"

    @property
    def passed(self) -> bool:
        return self.practice_score >= 50.0

