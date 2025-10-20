"""
EduCode Backend - Subject Model

Defines the Subject entity for categorizing lessons by academic subject.
Examples: "Algorithms", "Object-Oriented Programming", "Data Structures".
"""

from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Subject(Base):
    """
    Subject model representing academic subjects/courses.
    
    Used to categorize lessons and provide context for AI grading.
    
    Attributes:
        id: Primary key
        name: Subject name (e.g., "Algorithms", "OOP", "Data Structures")
        created_at: Timestamp when subject was created
        updated_at: Timestamp when subject was last updated
    """
    
    __tablename__ = "subjects"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Subject information
    name = Column(String(255), unique=True, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    lessons = relationship("Lesson", back_populates="subject", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Subject(id={self.id}, name='{self.name}')>"

    # REMOVED: Properties that access lazy-loaded relationships
    # - lesson_count: Use select(func.count(Lesson.id)).where(Lesson.subject_id == subject.id)
    # - task_count: Use join query with func.count(Task.id) grouped by subject_id