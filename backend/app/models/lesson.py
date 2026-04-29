from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Lesson(Base):

    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=True, index=True)

    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    subject = relationship("Subject", back_populates="lessons", lazy="selectin")
    teacher = relationship("User", back_populates="lessons", foreign_keys=[teacher_id], lazy="selectin")
    tasks = relationship("Task", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    materials = relationship("LessonMaterial", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    assignments = relationship("LessonAssignment", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    test_questions = relationship("TestQuestion", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    test_results = relationship("TestResult", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    practice_results = relationship("PracticeResult", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Lesson(id={self.id}, title='{self.title}', subject_id={self.subject_id})>"
