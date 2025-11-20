"""
EduCode Backend - LessonAssignment Model

Defines the assignment of lessons to specific groups with deadlines.
A lesson is created once but can be assigned to multiple groups with different deadlines.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LessonAssignment(Base):
    """
    Lesson-Group assignment model with deadlines.

    This model represents which groups have access to a lesson and their submission deadlines.
    The same lesson can be assigned to multiple groups with different deadlines.

    Example:
        Lesson "Python Basics" assigned to:
        - Group 1: deadline 2025-01-20
        - Group 2: deadline 2025-01-25
        - Group 3: deadline 2025-01-30

    Attributes:
        id: Primary key
        lesson_id: Foreign key to Lesson
        group_id: Foreign key to Group
        deadline_at: Deadline for this group to complete lesson tasks
        created_at: Timestamp when assignment was created
    """

    __tablename__ = "lesson_assignments"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)

    # Deadline for this specific group
    deadline_at = Column(DateTime(timezone=True), nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Unique constraint: one lesson can only be assigned to a group once
    __table_args__ = (
        UniqueConstraint('lesson_id', 'group_id', name='unique_lesson_group_assignment'),
    )

    # Relationships
    lesson = relationship("Lesson", back_populates="assignments", lazy="selectin")
    group = relationship("Group", back_populates="lesson_assignments", lazy="selectin")

    def __repr__(self) -> str:
        return f"<LessonAssignment(id={self.id}, lesson_id={self.lesson_id}, group_id={self.group_id}, deadline={self.deadline_at})>"

    @property
    def is_expired(self) -> bool:
        """Check if the deadline has passed."""
        return datetime.now(self.deadline_at.tzinfo) > self.deadline_at

    @property
    def is_active(self) -> bool:
        """Check if the assignment is still active (deadline not passed)."""
        return not self.is_expired
