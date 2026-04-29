from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TeacherSubjectGroup(Base):
    __tablename__ = "teacher_subject_groups"

    id = Column(Integer, primary_key=True, index=True)

    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('teacher_id', 'subject_id', 'group_id', name='unique_teacher_subject_group'),
    )

    teacher = relationship("User", back_populates="teaching_assignments", lazy="selectin")
    subject = relationship("Subject", back_populates="teacher_assignments", lazy="selectin")
    group = relationship("Group", back_populates="teacher_assignments", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TeacherSubjectGroup(id={self.id}, teacher_id={self.teacher_id}, subject_id={self.subject_id}, group_id={self.group_id})>"
