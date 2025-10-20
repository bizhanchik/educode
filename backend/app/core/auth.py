"""
EduCode Backend - Authentication Module

This module handles authentication for all user roles (admin, teacher, student)
with JWT token generation/validation and role-based access control.
"""

from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hmac
import bcrypt

from app.core.database import get_db
from app.models.user import User, UserRole

# Hardcoded admin credentials (legacy support)
ADMIN_USERNAME = "admin_bro"
ADMIN_PASSWORD = "2rA238t8I$&}"

# JWT Configuration
JWT_SECRET_KEY = "educode_super_secret_key_for_admin_auth_2024"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 4

# Security scheme for FastAPI
security = HTTPBearer()


def verify_admin_credentials(username: str, password: str) -> bool:
    """
    Verify admin credentials against hardcoded values (legacy support).
    
    Args:
        username: The provided username
        password: The provided password
        
    Returns:
        bool: True if credentials are valid, False otherwise
    """
    return (
        hmac.compare_digest(username, ADMIN_USERNAME) and 
        hmac.compare_digest(password, ADMIN_PASSWORD)
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password
        
    Returns:
        str: The hashed password
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.

    Args:
        db: Database session
        email: User email
        password: User password

    Returns:
        User: The authenticated user or None if authentication fails
    """
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None

    # Verify password using bcrypt
    if not verify_password(password, user.password_hash):
        return None

    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with custom data and expiration.
    
    Args:
        data: Dictionary containing token data (user_id, role, etc.)
        expires_delta: Custom expiration time delta
        
    Returns:
        str: JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access_token"
    })
    
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        dict: Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Check if token has expired
        if payload.get("exp") and datetime.now(timezone.utc).timestamp() > payload["exp"]:
            return None
            
        # Verify token type
        if payload.get("type") != "access_token":
            return None
            
        return payload
        
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Args:
        credentials: HTTP Bearer token credentials
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Handle legacy admin token
    if user_id == ADMIN_USERNAME and payload.get("role") == "admin":
        # Create a virtual admin user for legacy support
        admin_user = User()
        admin_user.id = 0
        admin_user.name = "Admin"
        admin_user.email = "admin@educode.com"
        admin_user.role = UserRole.ADMIN
        return admin_user
    
    # Get user from database
    try:
        user_id_int = int(user_id)
        result = await db.execute(select(User).filter(User.id == user_id_int))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(allowed_roles: List[UserRole]):
    """
    Create a dependency that requires specific user roles.
    
    Args:
        allowed_roles: List of allowed user roles
        
    Returns:
        Dependency function
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        return current_user
    
    return role_checker


# Role-specific dependencies
admin_required = require_roles([UserRole.ADMIN])
teacher_required = require_roles([UserRole.TEACHER])
student_required = require_roles([UserRole.STUDENT])
teacher_or_admin_required = require_roles([UserRole.TEACHER, UserRole.ADMIN])
any_authenticated_user = Depends(get_current_user)


# Legacy admin support
async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Legacy dependency to get the current authenticated admin user.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        str: Admin username
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    username = payload.get("sub")
    role = payload.get("role")
    
    if username != ADMIN_USERNAME or role != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return username