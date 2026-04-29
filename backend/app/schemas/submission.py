
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SubmissionBase(BaseModel):
    code: str = Field(..., min_length=1, description="Submitted code")
    task_id: int = Field(..., description="Task ID")
    student_id: int = Field(..., description="Student ID")


class SubmissionCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=500000, description="Submitted code")
    task_id: int = Field(..., description="Task ID")


class SubmissionRead(SubmissionBase):
    id: int = Field(..., description="Submission ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    code_length: int = Field(..., description="Length of submitted code")
    code_lines: int = Field(..., description="Number of lines in code")

    class Config:
        from_attributes = True


class SubmissionUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=1, max_length=500000)


class SubmissionList(BaseModel):
    submissions: List[SubmissionRead]
    total: int
    page: int
    size: int


class SubmissionWithEvaluation(SubmissionRead):
    evaluation: Optional['EvaluationRead'] = Field(None, description="Evaluation details")


class SubmissionWithRelations(SubmissionRead):
    task: Optional['TaskRead'] = Field(None, description="Task details")
    student: Optional['UserRead'] = Field(None, description="Student details")
    evaluation: Optional['EvaluationRead'] = Field(None, description="Evaluation details")

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
    task_id: int
    total_submissions: int
    evaluated_submissions: int
    pending_evaluations: int
    late_submissions: int
    on_time_submissions: int