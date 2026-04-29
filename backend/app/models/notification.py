from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Notification(Base):

    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False, index=True)

    related_id = Column(Integer, nullable=True)
    related_type = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.type}', read={self.read})>"

    @property
    def is_recent(self) -> bool:
        if not self.created_at:
            return False

        from datetime import datetime, timedelta
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        return self.created_at >= one_day_ago

    @property
    def age_in_hours(self) -> float:
        if not self.created_at:
            return 0.0

        from datetime import datetime
        age = datetime.utcnow() - self.created_at.replace(tzinfo=None)
        return age.total_seconds() / 3600.0
