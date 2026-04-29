
from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    role: str = Field(..., description="User role (admin/teacher/student)")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class UserInfo(BaseModel):
    id: int = Field(..., description="User ID")
    name: str = Field(..., description="User full name")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role")
    group_id: Optional[int] = Field(None, description="Group ID (for students/teachers)")


class TokenData(BaseModel):
    sub: str = Field(..., description="Subject (user ID)")
    role: str = Field(..., description="User role")
    type: str = Field(default="access_token", description="Token type")


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class AdminLoginResponse(BaseModel):
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class AdminInfo(BaseModel):
    username: str = Field(..., description="Admin username")
    role: str = Field(default="admin", description="User role")