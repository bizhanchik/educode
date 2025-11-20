"""
EduCode Backend - TeacherSubjectGroup Model

Defines the relationship between teachers, subjects, and groups.
This allows admin to assign teachers to teach specific subjects in specific groups.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TeacherSubjectGroup(Base):
    """
    Teacher-Subject-Group assignment model.

    This model represents which teacher teaches which subject in which group.
    Assignments are created by admins to organize the teaching structure.

    Example:
        Teacher Nikolay teaches Python in Groups 1, 2, 3
        → 3 TeacherSubjectGroup records (one for each group)

    Attributes:
        id: Primary key
        teacher_id: Foreign key to User (must be a teacher)
        subject_id: Foreign key to Subject
        group_id: Foreign key to Group
        created_at: Timestamp when assignment was created
        updated_at: Timestamp when assignment was last updated
    """

    __tablename__ = "teacher_subject_groups"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign keys
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Unique constraint: one teacher can't be assigned to the same subject-group combo twice
    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject_id', 'group_id', name='unique_teacher_subject_group'),
    )

    # Relationships
    teacher = relationship("User", back_populates="teaching_assignments", lazy="selectin")
    subject = relationship("Subject", back_populates="teacher_assignments", lazy="selectin")
    group = relationship("Group", back_populates="teacher_assignments", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TeacherSubjectGroup(id={self.id}, teacher_id={self.teacher_id}, subject_id={self.subject_id}, group_id={self.group_id})>"
