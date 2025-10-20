"""
EduCode Backend - Group Schemas

Pydantic schemas for Group model validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class GroupBase(BaseModel):
    """Base Group schema with common fields."""
    name: str = Field(..., min_length=1, max_length=255, description="Group name")


class GroupCreate(GroupBase):
    """Schema for creating a new group."""
    pass


class GroupRead(GroupBase):
    """Schema for reading group data."""
    id: int = Field(..., description="Group ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    # Computed properties (optional to avoid MissingGreenlet errors)
    student_count: Optional[int] = Field(default=0, description="Number of students in group")
    
    class Config:
        from_attributes = True


class GroupUpdate(BaseModel):
    """Schema for updating group data."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class GroupList(BaseModel):
    """Schema for paginated group list response."""
    groups: List[GroupRead]
    total: int
    page: int
    size: int


class GroupWithUsers(GroupRead):
    """Schema for group with user details."""
    users: List['UserRead'] = Field(default_factory=list, description="Users in this group")

# Resolve forward references
try:
    from app.schemas.user import UserRead  # only for type resolution
except Exception:
    UserRead = None

try:
    GroupWithUsers.model_rebuild()
except Exception:
    pass