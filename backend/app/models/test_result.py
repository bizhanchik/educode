from datetime import datetime
from typing import List, Optional
import json

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)

    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)
    incorrect_question_ids = Column(JSON, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    lesson = relationship("Lesson", back_populates="test_results", lazy="selectin")
    student = relationship("User", back_populates="test_results", lazy="selectin")
    attempts = relationship("TestAttempt", back_populates="test_result", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TestResult(id={self.id}, lesson_id={self.lesson_id}, student_id={self.student_id}, score={self.score})>"

    @property
    def passed(self) -> bool:
        return self.score >= 50.0

