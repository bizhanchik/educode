"""
EduCode Backend - Evaluation Schemas

Pydantic schemas for Evaluation model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class EvaluationBase(BaseModel):
    """Base Evaluation schema with common fields."""
    submission_id: int = Field(..., description="Submission ID")
    ai_similarity: float = Field(..., ge=0.0, le=1.0, description="AI similarity score (0.0-1.0)")
    intra_group_similarity: float = Field(..., ge=0.0, le=1.0, description="Group similarity score (0.0-1.0)")
    final_score: int = Field(..., ge=1, le=100, description="Final grade (1-100)")
    rationale: str = Field(..., min_length=1, description="AI-generated grading rationale")


class EvaluationCreate(EvaluationBase):
    """Schema for creating a new evaluation."""
    pass


class EvaluationRead(EvaluationBase):
    """Schema for reading evaluation data."""
    id: int = Field(..., description="Evaluation ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Computed properties
    grade_letter: str = Field(..., description="Letter grade (A-F)")
    is_high_ai_similarity: bool = Field(..., description="Whether AI similarity is suspiciously high")
    is_high_group_similarity: bool = Field(..., description="Whether group similarity is suspiciously high")
    is_suspicious: bool = Field(..., description="Whether submission shows signs of dishonesty")
    originality_score: float = Field(..., description="Originality score (inverse of similarity)")
    
    class Config:
        from_attributes = True


class EvaluationUpdate(BaseModel):
    """Schema for updating evaluation data."""
    ai_similarity: Optional[float] = Field(None, ge=0.0, le=1.0)
    intra_group_similarity: Optional[float] = Field(None, ge=0.0, le=1.0)
    final_score: Optional[int] = Field(None, ge=1, le=100)
    rationale: Optional[str] = Field(None, min_length=1)


class EvaluationList(BaseModel):
    """Schema for paginated evaluation list response."""
    evaluations: List[EvaluationRead]
    total: int
    page: int
    size: int


class EvaluationWithSubmission(EvaluationRead):
    """Schema for evaluation with submission details."""
    submission: Optional['SubmissionRead'] = Field(None, description="Submission details")

# Resolve forward references
try:
    from app.schemas.submission import SubmissionRead
except Exception:
    SubmissionRead = None

try:
    EvaluationWithSubmission.model_rebuild()
except Exception:
    pass


class EvaluationStats(BaseModel):
    """Global evaluation statistics."""
    total_evaluations: int
    average_score: float
    average_ai_similarity: float
    average_group_similarity: float
    high_ai_similarity_count: int
    high_group_similarity_count: int
    suspicious_evaluations: int
    grade_distribution: dict = Field(default_factory=dict, description="Distribution of letter grades")


class TaskEvaluationSummary(BaseModel):
    """Schema for task evaluation summary."""
    task_id: int
    task_title: str
    total_submissions: int
    evaluated_submissions: int
    average_score: Optional[float]
    highest_score: Optional[int]
    lowest_score: Optional[int]
    suspicious_submissions: int