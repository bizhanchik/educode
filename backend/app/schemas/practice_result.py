
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CodeExecuteRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=500000, description="Code to execute")
    language: str = Field("python", description="Programming language")


class CodeExecuteResponse(BaseModel):
    stdout: str = Field(default="", description="Standard output")
    stderr: str = Field(default="", description="Standard error")
    exit_code: int = Field(default=0, description="Exit code")
    time: Optional[float] = Field(None, description="Execution time (seconds)")
    memory: Optional[int] = Field(None, description="Memory usage (KB)")


class CodeTestCase(BaseModel):
    input: str = Field(..., description="Test input data")
    output: str = Field(..., description="Expected output")
    is_public: bool = Field(True, description="Public/hidden test flag")


class CodeEvaluateRequest(BaseModel):
    language: str = Field(..., description="Language: python, javascript, java, cpp, csharp, dart")
    student_code: str = Field(..., min_length=1, max_length=100000, description="Source code")
    tests: List[CodeTestCase] = Field(..., min_length=1, max_length=50, description="Test cases")


class TestResultDetail(BaseModel):
    test_number: int = Field(..., description="Test number (1-indexed)")
    input: str = Field(..., description="Test input")
    expected_output: str = Field(..., description="Expected output")
    actual_output: str = Field(..., description="Actual output")
    passed: bool = Field(..., description="Pass/fail status")
    time: Optional[float] = Field(None, description="Execution time (seconds)")
    memory: Optional[int] = Field(None, description="Memory usage (KB)")
    stderr: Optional[str] = Field(None, description="Standard error")
    is_public: bool = Field(..., description="Public/hidden flag")


class CodeEvaluateResponse(BaseModel):
    language: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    success_rate: float = Field(..., description="Percentage 0-100")
    execution_time_ms: float
    results: List[TestResultDetail]


class AIFeedbackItem(BaseModel):
    model: str = Field(..., description="AI model name (gpt-4, claude, gemini, etc.)")
    correctness: bool = Field(..., description="Whether code is correct")
    similarity: float = Field(..., ge=0, le=100, description="Similarity score 0-100")
    explanation: str = Field(..., description="AI explanation")


class PracticeResultCreate(BaseModel):
    lesson_id: int = Field(..., description="Lesson ID")
    task_id: int = Field(..., description="Task ID")
    code: str = Field(..., description="Submitted code")
    execution_result: Optional[Dict[str, Any]] = Field(None, description="Code execution result")


class PracticeResultRead(BaseModel):
    id: int
    lesson_id: int
    student_id: int
    task_id: int
    code: str
    execution_result: Optional[Dict[str, Any]] = None
    ai_feedback: Optional[List[Dict[str, Any]]] = None
    similarity_score: Optional[float] = None
    correctness_score: Optional[float] = None
    practice_score: float
    is_plagiarized: bool
    created_at: datetime
    updated_at: datetime
    passed: bool

    class Config:
        from_attributes = True



class TaskTestRunRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=100000, description="Student code to test")
    language: str = Field("python", description="Programming language")


class SingleTestResult(BaseModel):
    test_id: int = Field(..., description="Test case ID")
    test_name: str = Field(..., description="Test case name")
    passed: bool = Field(..., description="Whether test passed")
    is_public: bool = Field(..., description="Whether test is public (visible to student)")
    input: Optional[str] = Field(None, description="Test input (only for public tests)")
    expected_output: Optional[str] = Field(None, description="Expected output (only for public tests)")
    actual_output: Optional[str] = Field(None, description="Actual output (only for public tests)")
    execution_time_ms: Optional[float] = Field(None, description="Execution time in milliseconds")
    memory_kb: Optional[int] = Field(None, description="Memory usage in KB")
    error: Optional[str] = Field(None, description="Error message if any")


class TaskTestRunResponse(BaseModel):
    task_id: int = Field(..., description="Task ID")
    total_tests: int = Field(..., description="Total number of test cases")
    passed_tests: int = Field(..., description="Number of passed tests")
    failed_tests: int = Field(..., description="Number of failed tests")
    score: float = Field(..., ge=0, le=100, description="Score based on test weights (0-100)")
    verdict: str = Field(..., description="Overall verdict: Accepted, Wrong Answer, Runtime Error, etc.")
    results: List[SingleTestResult] = Field(..., description="Individual test results")
    execution_time_total_ms: float = Field(..., description="Total execution time in milliseconds")

