from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Subject(Base):

    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), unique=True, nullable=False, index=True)
    code = Column(String(100), nullable=True, index=True)
    status = Column(String(50), nullable=True, default="Активен", index=True)
    color = Column(String(7), nullable=True)
    image = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    lessons = relationship("Lesson", back_populates="subject", lazy="selectin")
    teacher_assignments = relationship("TeacherSubjectGroup", back_populates="subject", lazy="selectin")

    def __repr__(self) -> str:
        code_str = f", code='{self.code}'" if self.code else ""
        return f"<Subject(id={self.id}, name='{self.name}'{code_str})>"

