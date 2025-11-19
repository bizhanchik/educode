"""
EduCode Backend - Authentication Routes

FastAPI routes for authentication and token management for all user roles.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.schemas.auth import (
    LoginRequest, LoginResponse, UserInfo, TokenData,
    AdminLoginRequest, AdminLoginResponse, AdminInfo  # Legacy support
)
from app.core.auth import (
    verify_admin_credentials, create_access_token, admin_required, 
    authenticate_user, get_current_user, JWT_EXPIRATION_HOURS
)
from app.core.database import get_db
from app.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
async def unified_login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Unified login endpoint for all user roles.
    
    Authenticates users with email and password and returns JWT token.
    """
    # Try to authenticate user from database
    user = await authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        if (login_data.email == "admin_bro" and 
            verify_admin_credentials(login_data.email, login_data.password)):
            
            access_token = create_access_token(
                data={"sub": "admin_bro", "role": "admin"},
                expires_delta=timedelta(hours=JWT_EXPIRATION_HOURS)
            )
            
            return LoginResponse(
                access_token=access_token,
                token_type="bearer",
                role="admin",
                expires_in=JWT_EXPIRATION_HOURS * 3600
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token for authenticated user
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(hours=JWT_EXPIRATION_HOURS)
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role.value,
        expires_in=JWT_EXPIRATION_HOURS * 3600
    )


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    
    Returns information about the currently authenticated user.
    """
    return UserInfo(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
        group_id=current_user.group_id
    )


@router.post("/verify")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
    """
    Verify JWT token endpoint.
    
    Returns success if the provided token is valid.
    """
    return {
        "status": "success",
        "message": "Token is valid",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role.value
        }
    }


# Legacy admin endpoints for backward compatibility
@router.post("/admin/login", response_model=AdminLoginResponse, deprecated=True)
async def admin_login(login_data: AdminLoginRequest):
    """
    Legacy admin login endpoint (deprecated).
    
    Use /auth/login instead with email and password.
    """
    if not verify_admin_credentials(login_data.username, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": login_data.username, "role": "admin"},
        expires_delta=timedelta(hours=JWT_EXPIRATION_HOURS)
    )
    
    return AdminLoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=JWT_EXPIRATION_HOURS * 3600
    )


@router.get("/admin/me", response_model=AdminInfo, deprecated=True)
async def get_current_admin_info(current_admin: str = Depends(admin_required)):
    """
    Legacy get current admin information (deprecated).
    
    Use /auth/me instead.
    """
    return AdminInfo(
        username=current_admin,
        role="admin"
    )