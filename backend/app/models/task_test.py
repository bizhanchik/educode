from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TestType(str, enum.Enum):
    UNIT = "unit"
    INTEGRATION = "integration"
    CUSTOM = "custom"


class TaskTest(Base):

    __tablename__ = "task_tests"
    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    test_name = Column(String(255), nullable=False)
    test_input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    test_type = Column(SQLEnum(TestType), default=TestType.UNIT, nullable=False)

    weight = Column(Integer, default=1, nullable=False)
    timeout_seconds = Column(Integer, default=5, nullable=False)

    is_public = Column(Boolean, default=True, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    task = relationship("Task", back_populates="tests", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TaskTest(id={self.id}, task_id={self.task_id}, name='{self.test_name}', type={self.test_type})>"
