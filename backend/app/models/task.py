"""
EduCode Backend - Task Model

Defines the Task entity representing coding assignments.
Tasks have deadlines and trigger AI evaluation when submissions are made.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProgrammingLanguage(str, Enum):
    """Supported programming languages for tasks."""
    PYTHON = "python"
    JAVA = "java"
    JAVASCRIPT = "javascript"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"


class Task(Base):
    """
    Task model representing coding assignments.
    
    Tasks are created by teachers within lessons and have deadlines.
    Student submissions are evaluated against AI-generated solutions.
    
    Attributes:
        id: Primary key
        lesson_id: Foreign key to Lesson
        title: Task title
        body: Task description and requirements
        language: Programming language for the task
        deadline_at: Submission deadline
        created_at: Timestamp when task was created
        updated_at: Timestamp when task was last updated
    """
    
    __tablename__ = "tasks"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Task information
    title = Column(String(255), nullable=False, index=True)
    body = Column(Text, nullable=False)
    language = Column(SQLEnum(ProgrammingLanguage), nullable=False, index=True)
    
    # Foreign keys
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)
    
    # Deadline
    deadline_at = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    lesson = relationship("Lesson", back_populates="tasks", lazy="selectin")
    submissions = relationship("Submission", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    ai_solutions = relationship("AISolution", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    tests = relationship("TaskTest", back_populates="task", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', language='{self.language}')>"

    # SAFE PROPERTIES: These don't access relationships, only direct attributes
    @property
    def is_expired(self) -> bool:
        """Check if the task deadline has passed."""
        return datetime.now(timezone.utc) > self.deadline_at

    @property
    def is_active(self) -> bool:
        """Check if the task is still accepting submissions."""
        return not self.is_expired

    @property
    def time_remaining(self) -> Optional[str]:
        """Get human-readable time remaining until deadline."""
        if self.is_expired:
            return None

        delta = self.deadline_at - datetime.now(timezone.utc)
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)

        if days > 0:
            return f"{days} days, {hours} hours"
        elif hours > 0:
            return f"{hours} hours, {minutes} minutes"
        else:
            return f"{minutes} minutes"

    # REMOVED: Properties that access lazy-loaded relationships
    # - submission_count: Use select(func.count(Submission.id)).where(Submission.task_id == task.id)
    # - has_ai_solutions: Use exists(select(AISolution.id).where(AISolution.task_id == task.id))