
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TestAttemptCreate(BaseModel):
    question_id: int = Field(..., description="Question ID")
    student_answer: int = Field(..., ge=0, description="Index of student's selected answer")


class TestResultCreate(BaseModel):
    lesson_id: int = Field(..., description="Lesson ID")
    attempts: List[TestAttemptCreate] = Field(..., description="List of student answers")
    time_taken_seconds: int = Field(..., ge=0, description="Time taken in seconds")
    started_at: datetime = Field(..., description="When test was started")


class TestAttemptRead(BaseModel):
    id: int
    question_id: int
    student_answer: int
    is_correct: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TestResultRead(BaseModel):
    id: int
    lesson_id: int
    student_id: int
    score: float
    total_questions: int
    correct_answers: int
    incorrect_question_ids: Optional[List[int]] = None
    time_taken_seconds: Optional[int] = None
    started_at: datetime
    completed_at: datetime
    created_at: datetime
    passed: bool

    class Config:
        from_attributes = True


class TestResultWithAttempts(TestResultRead):
    attempts: List[TestAttemptRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

