from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from pydantic import BaseModel, Field

from app.schemas.auth import (
    LoginRequest, LoginResponse, UserInfo, TokenData,
    AdminLoginRequest, AdminLoginResponse, AdminInfo
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
    return UserInfo(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value,
        group_id=current_user.group_id
    )


@router.post("/verify")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
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


class PasswordVerifyRequest(BaseModel):
    password: str = Field(..., description="Password to verify")


@router.post("/verify-password")
async def verify_password_endpoint(
    request: PasswordVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.auth import verify_password

    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    return {
        "status": "success",
        "message": "Password verified"
    }

