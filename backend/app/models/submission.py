"""
EduCode Backend - Submission Model

Defines the Submission entity representing student code submissions.
Submissions are evaluated for AI similarity and graded automatically.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Submission(Base):
    """
    Submission model representing student code submissions.
    
    Students submit code solutions for tasks, which are then evaluated
    for similarity against AI solutions and other student submissions.
    
    Attributes:
        id: Primary key
        task_id: Foreign key to Task
        student_id: Foreign key to User (student)
        code: The submitted code
        created_at: Timestamp when submission was made
        updated_at: Timestamp when submission was last updated
    """
    
    __tablename__ = "submissions"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Submission content
    code = Column(Text, nullable=False)
    
    # Foreign keys
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    task = relationship("Task", back_populates="submissions", lazy="selectin")
    student = relationship("User", back_populates="submissions", foreign_keys=[student_id], lazy="selectin")
    evaluation = relationship("Evaluation", back_populates="submission", uselist=False, cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Submission(id={self.id}, task_id={self.task_id}, student_id={self.student_id})>"

    # SAFE PROPERTIES: These don't access relationships, only direct attributes
    @property
    def code_length(self) -> int:
        """Get the length of the submitted code."""
        return len(self.code)

    @property
    def code_lines(self) -> int:
        """Get the number of lines in the submitted code."""
        return len(self.code.splitlines())

    # REMOVED: Properties that access lazy-loaded relationships
    # - is_late: Compare submission.created_at with preloaded task.deadline_at at route level
    # - has_evaluation: Check if evaluation is not None after explicit loading
    # - final_score: Access evaluation.final_score after explicit loading
    # - ai_similarity: Access evaluation.ai_similarity after explicit loading
    # Use selectinload(Submission.evaluation) in queries to preload evaluation