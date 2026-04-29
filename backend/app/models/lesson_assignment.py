from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LessonAssignment(Base):

    __tablename__ = "lesson_assignments"

    id = Column(Integer, primary_key=True, index=True)

    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)

    deadline_at = Column(DateTime(timezone=True), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('lesson_id', 'group_id', name='unique_lesson_group_assignment'),
    )

    lesson = relationship("Lesson", back_populates="assignments", lazy="selectin")
    group = relationship("Group", back_populates="lesson_assignments", lazy="selectin")

    def __repr__(self) -> str:
        return f"<LessonAssignment(id={self.id}, lesson_id={self.lesson_id}, group_id={self.group_id}, deadline={self.deadline_at})>"

    @property
    def is_expired(self) -> bool:
        return datetime.now(self.deadline_at.tzinfo) > self.deadline_at

    @property
    def is_active(self) -> bool:
        return not self.is_expired
