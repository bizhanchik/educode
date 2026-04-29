from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Group(Base):

    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), unique=True, nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


    users = relationship("User", back_populates="group", lazy="selectin")
    teacher_assignments = relationship("TeacherSubjectGroup", back_populates="group", lazy="selectin")
    lesson_assignments = relationship("LessonAssignment", back_populates="group", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Group(id={self.id}, name='{self.name}')>"
