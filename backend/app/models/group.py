"""
EduCode Backend - Group Model

Defines the Group entity for organizing students into classes or cohorts.
Groups are used for intra-group similarity analysis during grading.
"""

from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


# Association table for many-to-many relationship between groups and teachers
group_teachers = Table(
    'group_teachers',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('groups.id'), primary_key=True),
    Column('teacher_id', Integer, ForeignKey('users.id'), primary_key=True)
)


class Group(Base):
    """
    Group model representing student groups/classes.
    
    Used for organizing students and calculating intra-group similarity
    during the AI grading process.
    
    Attributes:
        id: Primary key
        name: Group name (e.g., "CS-2024-A", "Algorithms-Group-1")
        created_at: Timestamp when group was created
        updated_at: Timestamp when group was last updated
    """
    
    __tablename__ = "groups"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Group information
    name = Column(String(255), unique=True, nullable=False, index=True)
    course = Column(Integer, nullable=True)  # Course number (1, 2, 3, etc.)
    semester = Column(Integer, nullable=True)  # Semester number (1, 2, etc.)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    # FIXED: Use lazy="selectin" to prevent greenlet errors when accessing relationships in async context
    users = relationship("User", back_populates="group", lazy="selectin")
    teachers = relationship("User", secondary=group_teachers, lazy="selectin", overlaps="users")

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name='{self.name}')>"

    # REMOVED: Properties that access lazy-loaded relationships
    # - student_count: Use select(func.count(User.id)).where(User.group_id == group.id, User.role == 'student')
    # - students: Use select(User).where(User.group_id == group.id, User.role == 'student')