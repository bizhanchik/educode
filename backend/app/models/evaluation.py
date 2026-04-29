from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Evaluation(Base):

    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)

    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True, nullable=False, index=True)

    test_score = Column(Float, nullable=True)
    test_passed = Column(Integer, nullable=True)
    test_total = Column(Integer, nullable=True)

    ai_similarity = Column(Float, nullable=False, index=True)
    intra_group_similarity = Column(Float, nullable=False, index=True)

    final_score = Column(Integer, nullable=False, index=True)
    rationale = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    submission = relationship("Submission", back_populates="evaluation", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Evaluation(id={self.id}, submission_id={self.submission_id}, final_score={self.final_score})>"

    @property
    def grade_letter(self) -> str:
        if self.final_score >= 90:
            return "A"
        elif self.final_score >= 80:
            return "B"
        elif self.final_score >= 70:
            return "C"
        elif self.final_score >= 60:
            return "D"
        else:
            return "F"

    @property
    def is_high_ai_similarity(self) -> bool:
        return self.ai_similarity > 0.8

    @property
    def is_high_group_similarity(self) -> bool:
        return self.intra_group_similarity > 0.8

    @property
    def is_suspicious(self) -> bool:
        return self.is_high_ai_similarity or self.is_high_group_similarity

    @property
    def originality_score(self) -> float:
        combined_similarity = (self.ai_similarity * 0.7) + (self.intra_group_similarity * 0.3)
        return max(0.0, 1.0 - combined_similarity)

    @property
    def test_pass_rate(self) -> Optional[float]:
        if self.test_total and self.test_total > 0:
            return (self.test_passed or 0) / self.test_total * 100
        return None