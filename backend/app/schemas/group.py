
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Group name")


class GroupCreate(GroupBase):
    pass


class GroupRead(GroupBase):
    id: int = Field(..., description="Group ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    student_count: Optional[int] = Field(default=0, description="Number of students in group")

    class Config:
        from_attributes = True


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class GroupList(BaseModel):
    groups: List[GroupRead]
    total: int
    page: int
    size: int


class GroupWithUsers(GroupRead):
    users: List['UserRead'] = Field(default_factory=list, description="Users in this group")

try:
    from app.schemas.user import UserRead
except Exception:
    UserRead = None

try:
    GroupWithUsers.model_rebuild()
except Exception:
    pass