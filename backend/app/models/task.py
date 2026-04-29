from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProgrammingLanguage(str, Enum):
    PYTHON = "python"
    JAVA = "java"
    JAVASCRIPT = "javascript"
    CPP = "cpp"
    C = "c"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"


class Task(Base):

    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False, index=True)
    body = Column(Text, nullable=False)
    language = Column(SQLEnum(ProgrammingLanguage), nullable=False, index=True)

    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)

    deadline_at = Column(DateTime(timezone=True), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    lesson = relationship("Lesson", back_populates="tasks", lazy="selectin")
    submissions = relationship("Submission", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    ai_solutions = relationship("AISolution", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    tests = relationship("TaskTest", back_populates="task", cascade="all, delete-orphan", lazy="selectin")
    practice_results = relationship("PracticeResult", back_populates="task", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title}', language='{self.language}')>"

    @property
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.deadline_at

    @property
    def is_active(self) -> bool:
        return not self.is_expired

    @property
    def time_remaining(self) -> Optional[str]:
        if self.is_expired:
            return None

        delta = self.deadline_at - datetime.now(timezone.utc)
        days = delta.days
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)

        if days > 0:
            return f"{days} days, {hours} hours"
        elif hours > 0:
            return f"{hours} hours, {minutes} minutes"
        else:
            return f"{minutes} minutes"
