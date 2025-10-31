"""
EduCode Backend - Lesson Model

Defines the Lesson entity containing educational content and associated tasks.
Lessons are created by teachers and belong to specific subjects.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Lesson(Base):
    """
    Lesson model representing educational content containers.
    
    Lessons contain multiple tasks and are associated with subjects and teachers.
    
    Attributes:
        id: Primary key
        title: Lesson title
        description: Detailed lesson description/content
        subject_id: Foreign key to Subject
        teacher_id: Foreign key to User (teacher who created the lesson)
        created_at: Timestamp when lesson was created
        updated_at: Timestamp when lesson was last updated
    """
    
    __tablename__ = "lessons"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Lesson information
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Foreign keys
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    subject = relationship("Subject", back_populates="lessons", lazy="selectin")
    teacher = relationship("User", back_populates="lessons", foreign_keys=[teacher_id], lazy="selectin")
    tasks = relationship("Task", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    materials = relationship("LessonMaterial", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Lesson(id={self.id}, title='{self.title}', subject_id={self.subject_id})>"

    # REMOVED: Properties that access lazy-loaded relationships
    # These caused MissingGreenlet errors in async contexts
    # Counts and filtering should be done at the query level using:
    # - func.count() for task_count
    # - query filters for active/expired tasks
    # Example: select(func.count(Task.id)).where(Task.lesson_id == lesson.id)