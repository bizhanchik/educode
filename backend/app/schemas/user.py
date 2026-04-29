
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")
    email: EmailStr = Field(..., description="Unique email address")
    role: UserRole = Field(..., description="User role (admin/teacher/student)")
    group_id: Optional[int] = Field(None, description="Group ID (optional for admins/teachers)")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100, description="User password (min 8 characters)")


class UserRead(UserBase):
    id: int = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    is_admin: bool = Field(..., description="Whether user is an admin")
    is_teacher: bool = Field(..., description="Whether user is a teacher")
    is_student: bool = Field(..., description="Whether user is a student")

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = Field(None)
    password: Optional[str] = Field(None, min_length=8, max_length=100, description="New password (optional)")
    role: Optional[UserRole] = Field(None)
    group_id: Optional[int] = Field(None)


class UserList(BaseModel):
    users: List[UserRead]
    total: int
    page: int
    size: int