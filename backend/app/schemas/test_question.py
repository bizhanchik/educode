
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TestQuestionBase(BaseModel):
    question: str = Field(..., description="Question text")
    options: List[str] = Field(..., min_items=2, description="Answer options")
    correct_answer: int = Field(..., ge=0, description="Index of correct answer (0-based)")
    explanation: Optional[str] = Field(None, description="Explanation shown after test")
    topic: Optional[str] = Field(None, description="Topic/tag for spaced repetition")
    difficulty: Optional[str] = Field("medium", description="Question difficulty")


class TestQuestionCreate(TestQuestionBase):
    pass


class TestQuestionRead(BaseModel):
    id: int
    question: str
    options: List[str]
    explanation: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None

    class Config:
        from_attributes = True


class TestQuestionWithAnswer(TestQuestionRead):
    correct_answer: int

    class Config:
        from_attributes = True


class TestQuestionList(BaseModel):
    questions: List[TestQuestionRead]
    total: int

