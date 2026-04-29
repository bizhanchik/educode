from datetime import datetime
from enum import Enum
from typing import Optional, List

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)

    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    group = relationship("Group", back_populates="users", lazy="selectin")

    lessons = relationship("Lesson", back_populates="teacher", foreign_keys="Lesson.teacher_id", lazy="selectin")
    teaching_assignments = relationship("TeacherSubjectGroup", back_populates="teacher", lazy="selectin")

    submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_id", lazy="selectin")
    test_results = relationship("TestResult", back_populates="student", foreign_keys="TestResult.student_id", lazy="selectin")
    practice_results = relationship("PracticeResult", back_populates="student", foreign_keys="PracticeResult.student_id", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', role='{self.role}')>"

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    @property
    def is_teacher(self) -> bool:
        return self.role == UserRole.TEACHER

    @property
    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT