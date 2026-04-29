from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Submission(Base):

    __tablename__ = "submissions"

    MAX_ATTEMPTS = 3

    id = Column(Integer, primary_key=True, index=True)

    code = Column(Text, nullable=False)

    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    attempt_number = Column(Integer, default=1, nullable=False)

    test_passed_count = Column(Integer, nullable=True)
    test_total_count = Column(Integer, nullable=True)
    test_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    task = relationship("Task", back_populates="submissions", lazy="selectin")
    student = relationship("User", back_populates="submissions", foreign_keys=[student_id], lazy="selectin")
    evaluation = relationship("Evaluation", back_populates="submission", uselist=False, cascade="all, delete-orphan", lazy="selectin")

    __table_args__ = (
        UniqueConstraint('student_id', 'task_id', 'attempt_number', name='uq_student_task_attempt'),
    )

    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, task_id={self.task_id}, student_id={self.student_id}, attempt={self.attempt_number})>"

    @property
    def code_length(self) -> int:
        return len(self.code)

    @property
    def code_lines(self) -> int:
        return len(self.code.splitlines())

    @property
    def test_pass_rate(self) -> Optional[float]:
        if self.test_total_count and self.test_total_count > 0:
            return (self.test_passed_count or 0) / self.test_total_count * 100
        return None

    @property
    def has_remaining_attempts(self) -> bool:
        return self.attempt_number < self.MAX_ATTEMPTS
