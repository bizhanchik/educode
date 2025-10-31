"""
EduCode Backend - User Model

Defines the User entity with role-based access control.
Supports three roles: admin, teacher, student.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, Enum):
    """User role enumeration for role-based access control."""
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class User(Base):
    """
    User model representing all system users (admins, teachers, students).
    
    Attributes:
        id: Primary key
        name: Full name of the user
        email: Unique email address for authentication
        role: User role (admin/teacher/student)
        group_id: Foreign key to Group (nullable for admins/teachers)
        created_at: Timestamp when user was created
        updated_at: Timestamp when user was last updated
    """
    
    __tablename__ = "users"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # User information
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    phone = Column(String(20), nullable=True)  # Contact phone for teachers
    
    # Group relationship (optional for admins/teachers)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    group = relationship("Group", back_populates="users", lazy="selectin")

    # Teacher relationships
    lessons = relationship("Lesson", back_populates="teacher", foreign_keys="Lesson.teacher_id", lazy="selectin")
    teaching_groups = relationship("Group", secondary="group_teachers", lazy="selectin", overlaps="teachers")

    # Student relationships
    submissions = relationship("Submission", back_populates="student", foreign_keys="Submission.student_id", lazy="selectin")
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}', role='{self.role}')>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_teacher(self) -> bool:
        """Check if user is a teacher."""
        return self.role == UserRole.TEACHER
    
    @property
    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == UserRole.STUDENT