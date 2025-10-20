"""
EduCode Backend - Submission Schemas

Pydantic schemas for Submission model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SubmissionBase(BaseModel):
    """Base Submission schema with common fields."""
    code: str = Field(..., min_length=1, description="Submitted code")
    task_id: int = Field(..., description="Task ID")
    student_id: int = Field(..., description="Student ID")


class SubmissionCreate(BaseModel):
    """Schema for creating a new submission."""
    code: str = Field(..., min_length=1, description="Submitted code")
    task_id: int = Field(..., description="Task ID")
    # student_id will be extracted from authentication context


class SubmissionRead(SubmissionBase):
    """
    Schema for reading submission data.

    IMPORTANT: Removed fields that access relationships to prevent MissingGreenlet errors:
    - is_late: Compare submission.created_at with task.deadline_at at route level
    - has_evaluation: Check if evaluation exists using selectinload or SQL query
    - final_score: Access evaluation.final_score after explicit loading at route level
    - ai_similarity: Access evaluation.ai_similarity after explicit loading at route level
    """
    id: int = Field(..., description="Submission ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # SAFE computed properties (don't access relationships)
    code_length: int = Field(..., description="Length of submitted code")
    code_lines: int = Field(..., description="Number of lines in code")

    class Config:
        from_attributes = True


class SubmissionUpdate(BaseModel):
    """Schema for updating submission data."""
    code: Optional[str] = Field(None, min_length=1)


class SubmissionList(BaseModel):
    """Schema for paginated submission list response."""
    submissions: List[SubmissionRead]
    total: int
    page: int
    size: int


class SubmissionWithEvaluation(SubmissionRead):
    """Schema for submission with evaluation details."""
    evaluation: Optional['EvaluationRead'] = Field(None, description="Evaluation details")


class SubmissionWithRelations(SubmissionRead):
    """Schema for submission with related entities."""
    task: Optional['TaskRead'] = Field(None, description="Task details")
    student: Optional['UserRead'] = Field(None, description="Student details")
    evaluation: Optional['EvaluationRead'] = Field(None, description="Evaluation details")

# Resolve forward references
try:
    from app.schemas.task import TaskRead
    from app.schemas.user import UserRead
    from app.schemas.evaluation import EvaluationRead
except Exception:
    TaskRead = UserRead = EvaluationRead = None

try:
    SubmissionWithEvaluation.model_rebuild()
    SubmissionWithRelations.model_rebuild()
except Exception:
    pass


class SubmissionStats(BaseModel):
    """Schema for submission statistics."""
    total_submissions: int
    evaluated_submissions: int
    average_score: Optional[float]
    average_ai_similarity: Optional[float]
    average_group_similarity: Optional[float]