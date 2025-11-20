"""
EduCode Backend - TaskTest Model

Defines unit tests for tasks (for future implementation).
Tests will be used to automatically verify student code correctness.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TestType(str, enum.Enum):
    """Types of tests for task verification."""
    UNIT = "unit"  # Unit test with input/output
    INTEGRATION = "integration"  # Integration test
    CUSTOM = "custom"  # Custom test logic


class TaskTest(Base):
    """
    Task test model for automated code verification (future feature).

    Tests are used to verify student submissions automatically.
    Each test contains input data and expected output.

    Example:
        Task: "Write a function to add two numbers"
        Test 1: input={"a": 2, "b": 3}, expected_output=5
        Test 2: input={"a": -1, "b": 1}, expected_output=0

    Attributes:
        id: Primary key
        task_id: Foreign key to Task
        test_name: Name/description of the test
        test_input: JSON string with input data
        expected_output: JSON string with expected output
        test_type: Type of test (unit/integration/custom)
        weight: Weight of this test in overall score (0.0-1.0)
        timeout_seconds: Maximum execution time for this test
        created_at: Timestamp when test was created
        updated_at: Timestamp when test was last updated
    """

    __tablename__ = "task_tests"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    # Test information
    test_name = Column(String(255), nullable=False)
    test_input = Column(Text, nullable=False)  # JSON string
    expected_output = Column(Text, nullable=False)  # JSON string
    test_type = Column(SQLEnum(TestType), default=TestType.UNIT, nullable=False)

    # Test configuration
    weight = Column(Integer, default=1, nullable=False)  # Weight in points (all weights summed = 100)
    timeout_seconds = Column(Integer, default=5, nullable=False)  # Max execution time

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    task = relationship("Task", back_populates="tests", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TaskTest(id={self.id}, task_id={self.task_id}, name='{self.test_name}', type={self.test_type})>"
