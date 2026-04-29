from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class GradingJobStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class GradingJob(Base):

    __tablename__ = "grading_jobs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(GradingJobStatus), default=GradingJobStatus.PENDING, nullable=False, index=True)

    total_submissions = Column(Integer, default=0, nullable=False)
    processed_submissions = Column(Integer, default=0, nullable=False)
    successful_evaluations = Column(Integer, default=0, nullable=False)
    failed_evaluations = Column(Integer, default=0, nullable=False)

    error_message = Column(Text, nullable=True)

    celery_task_id = Column(String(255), nullable=True, index=True)

    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    task = relationship("Task", lazy="selectin")
    teacher = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<GradingJob(id={self.id}, task_id={self.task_id}, status={self.status}, progress={self.progress_percent}%)>"

    @property
    def progress_percent(self) -> float:
        if self.total_submissions == 0:
            return 0.0
        return (self.processed_submissions / self.total_submissions) * 100

    @property
    def is_running(self) -> bool:
        return self.status == GradingJobStatus.RUNNING

    @property
    def is_completed(self) -> bool:
        return self.status in (GradingJobStatus.COMPLETED, GradingJobStatus.FAILED)

    @property
    def duration_seconds(self) -> Optional[float]:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        elif self.started_at:
            return (datetime.now(self.started_at.tzinfo) - self.started_at).total_seconds()
        return None

    def mark_started(self):
        self.status = GradingJobStatus.RUNNING
        self.started_at = datetime.utcnow()

    def mark_completed(self):
        self.status = GradingJobStatus.COMPLETED
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error: str):
        self.status = GradingJobStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.utcnow()

    def increment_progress(self, success: bool = True):
        self.processed_submissions += 1
        if success:
            self.successful_evaluations += 1
        else:
            self.failed_evaluations += 1
