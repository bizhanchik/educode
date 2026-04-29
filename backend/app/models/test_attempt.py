from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)

    student_answer = Column(Integer, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)

    test_result_id = Column(Integer, ForeignKey("test_results.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("test_questions.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    test_result = relationship("TestResult", back_populates="attempts", lazy="selectin")
    question = relationship("TestQuestion", back_populates="test_attempts", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TestAttempt(id={self.id}, test_result_id={self.test_result_id}, is_correct={self.is_correct})>"

