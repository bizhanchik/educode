from datetime import datetime
from typing import List, Optional
import json

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TestQuestion(Base):

    __tablename__ = "test_questions"

    id = Column(Integer, primary_key=True, index=True)

    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_answer = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=True)
    topic = Column(String(255), nullable=True, index=True)
    difficulty = Column(String(50), nullable=True, default="medium")

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)


    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    lesson = relationship("Lesson", back_populates="test_questions", lazy="selectin")
    test_attempts = relationship("TestAttempt", back_populates="question", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TestQuestion(id={self.id}, lesson_id={self.lesson_id})>"

    def to_dict(self, include_correct_answer: bool = False) -> dict:
        data = {
            "id": self.id,
            "question": self.question,
            "options": self.options,
            "explanation": self.explanation,
            "topic": self.topic,
            "difficulty": self.difficulty,
        }
        if include_correct_answer:
            data["correct_answer"] = self.correct_answer
        return data

