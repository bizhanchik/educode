"""
EduCode Backend - User Routes

FastAPI routes for User CRUD operations.
Handles user management for admins, teachers, and students.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import admin_required, get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserList
from app.schemas.group import GroupRead

router = APIRouter(tags=["users"])


@router.post("/", response_model=dict)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Create a new user.
    
    - **name**: Full name of the user
    - **email**: Unique email address
    - **role**: User role (admin/teacher/student)
    - **group_id**: Group ID (optional for admins/teachers)
    """
    try:
        # Check if email already exists
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        # Create new user with hashed password
        user_dict = user_data.model_dump(exclude={'password'})
        user_dict['password_hash'] = get_password_hash(user_data.password)
        user = User(**user_dict)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return {
            "data": UserRead.model_validate(user),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    role: Optional[str] = Query(None, description="Filter by role"),
    group_id: Optional[int] = Query(None, description="Filter by group"),
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Get paginated list of users with optional filtering.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of users per page
    - **role**: Filter by user role
    - **group_id**: Filter by group ID
    """
    try:
        # Build query with filters
        query = select(User).options(selectinload(User.group))
        
        if role:
            query = query.where(User.role == role)
        if group_id:
            query = query.where(User.group_id == group_id)
        
        # Get total count
        count_query = select(func.count(User.id))
        if role:
            count_query = count_query.where(User.role == role)
        if group_id:
            count_query = count_query.where(User.group_id == group_id)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(User.created_at.desc())
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        return {
            "data": UserList(
                users=[UserRead.model_validate(user) for user in users],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Get a specific user by ID.
    
    - **user_id**: User ID
    """
    try:
        query = select(User).options(selectinload(User.group)).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return {
            "data": UserRead.model_validate(user),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user: {str(e)}"
        )


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Update a user.
    
    - **user_id**: User ID
    - **name**: Updated name (optional)
    - **email**: Updated email (optional)
    - **role**: Updated role (optional)
    - **group_id**: Updated group ID (optional)
    """
    try:
        # Get existing user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Check email uniqueness if email is being updated
        if user_data.email and user_data.email != user.email:
            existing_user = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
        
        # Update user fields
        update_data = user_data.model_dump(exclude_unset=True, exclude={'password'})
        for field, value in update_data.items():
            setattr(user, field, value)

        # Hash password if it's being updated
        if user_data.password is not None:
            user.password_hash = get_password_hash(user_data.password)

        await db.commit()
        await db.refresh(user)
        
        return {
            "data": UserRead.model_validate(user),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Delete a user.
    
    - **user_id**: User ID
    """
    try:
        # Get existing user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        await db.delete(user)
        await db.commit()
        
        return {
            "data": {"message": f"User {user_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete user: {str(e)}"
        )