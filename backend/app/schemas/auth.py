"""
EduCode Backend - Authentication Schemas

Pydantic models for authentication requests and responses.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Schema for unified login request (all user roles)."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class LoginResponse(BaseModel):
    """Schema for unified login response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    role: str = Field(..., description="User role (admin/teacher/student)")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class UserInfo(BaseModel):
    """Schema for authenticated user information."""
    id: int = Field(..., description="User ID")
    name: str = Field(..., description="User full name")
    email: str = Field(..., description="User email")
    role: str = Field(..., description="User role")
    group_id: Optional[int] = Field(None, description="Group ID (for students/teachers)")


class TokenData(BaseModel):
    """Schema for JWT token data."""
    sub: str = Field(..., description="Subject (user ID)")
    role: str = Field(..., description="User role")
    type: str = Field(default="access_token", description="Token type")


# Legacy schemas for backward compatibility
class AdminLoginRequest(BaseModel):
    """Schema for admin login request (legacy)."""
    username: str = Field(..., description="Admin username")
    password: str = Field(..., description="Admin password")


class AdminLoginResponse(BaseModel):
    """Schema for admin login response (legacy)."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class AdminInfo(BaseModel):
    """Schema for admin user information (legacy)."""
    username: str = Field(..., description="Admin username")
    role: str = Field(default="admin", description="User role")