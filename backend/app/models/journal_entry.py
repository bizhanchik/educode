from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class JournalEntry(Base):

    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)

    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    test_score = Column(Integer, nullable=True)
    practice_score = Column(Integer, nullable=True)
    average_score = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)


    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", lazy="selectin")
    lesson = relationship("Lesson", lazy="selectin")

    def __repr__(self) -> str:
        return f"<JournalEntry(id={self.id}, user_id={self.user_id}, lesson_id={self.lesson_id}, avg_score={self.average_score})>"

    @property
    def is_completed(self) -> bool:
        return self.completed_at is not None

    @property
    def time_spent_seconds(self) -> Optional[int]:
        if not self.completed_at or not self.started_at:
            return None

        delta = self.completed_at - self.started_at
        return int(delta.total_seconds())

    @property
    def time_spent_minutes(self) -> Optional[float]:
        seconds = self.time_spent_seconds
        if seconds is None:
            return None
        return seconds / 60.0

    @property
    def has_scores(self) -> bool:
        return self.test_score is not None or self.practice_score is not None

    @property
    def passed(self) -> bool:
        if self.average_score is None:
            return False
        return self.average_score >= 70
