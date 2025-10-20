"""
EduCode Backend - Group Routes

FastAPI routes for Group CRUD operations.
Handles student group management for organizing classes.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import admin_required
from app.models.group import Group
from app.models.user import User
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate, GroupList, GroupWithUsers

router = APIRouter()


@router.post("/", response_model=dict)
async def create_group(
    group_data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Create a new group.
    
    - **name**: Group name (e.g., "CS-101-A", "Data Structures 2024")
    """
    try:
        # Check if group name already exists
        existing_group = await db.execute(
            select(Group).where(Group.name == group_data.name)
        )
        if existing_group.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Group name already exists"
            )
        
        # Create new group
        group = Group(**group_data.model_dump())
        db.add(group)
        await db.commit()
        await db.refresh(group)
        
        return {
            "data": GroupRead.model_validate(group),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create group: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_groups(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Get paginated list of groups.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of groups per page
    """
    try:
        # Get total count
        count_result = await db.execute(select(func.count(Group.id)))
        total = count_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = select(Group).offset(offset).limit(size).order_by(Group.created_at.desc())
        
        result = await db.execute(query)
        groups = result.scalars().all()
        
        return {
            "data": GroupList(
                groups=[
                    GroupRead(
                        id=group.id,
                        name=group.name,
                        created_at=group.created_at,
                        updated_at=group.updated_at,
                        student_count=0  # Temporary fix
                    ) for group in groups
                ],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch groups: {str(e)}"
        )


@router.get("/{group_id}", response_model=dict)
async def get_group(
    group_id: int,
    include_users: bool = Query(False, description="Include users in response"),
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Get a specific group by ID.
    
    - **group_id**: Group ID
    - **include_users**: Whether to include users in the response
    """
    try:
        if include_users:
            query = select(Group).options(selectinload(Group.users)).where(Group.id == group_id)
        else:
            query = select(Group).where(Group.id == group_id)
        
        result = await db.execute(query)
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(
                status_code=404,
                detail="Group not found"
            )
        
        if include_users:
            return {
                "data": GroupWithUsers.model_validate(group),
                "status": "success"
            }
        else:
            return {
                "data": GroupRead.model_validate(group),
                "status": "success"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch group: {str(e)}"
        )


@router.put("/{group_id}", response_model=dict)
async def update_group(
    group_id: int,
    group_data: GroupUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Update a group.
    
    - **group_id**: Group ID
    - **name**: Updated group name
    """
    try:
        # Get existing group
        result = await db.execute(select(Group).where(Group.id == group_id))
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(
                status_code=404,
                detail="Group not found"
            )
        
        # Check name uniqueness if name is being updated
        if group_data.name and group_data.name != group.name:
            existing_group = await db.execute(
                select(Group).where(Group.name == group_data.name)
            )
            if existing_group.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Group name already exists"
                )
        
        # Update group fields
        update_data = group_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(group, field, value)
        
        await db.commit()
        await db.refresh(group)
        
        return {
            "data": GroupRead.model_validate(group),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update group: {str(e)}"
        )


@router.delete("/{group_id}", response_model=dict)
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    """
    Delete a group.
    
    - **group_id**: Group ID
    """
    try:
        # Check if group has users
        users_result = await db.execute(
            select(func.count(User.id)).where(User.group_id == group_id)
        )
        user_count = users_result.scalar()
        
        if user_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete group with {user_count} users. Remove users first."
            )
        
        # Get existing group
        result = await db.execute(select(Group).where(Group.id == group_id))
        group = result.scalar_one_or_none()
        
        if not group:
            raise HTTPException(
                status_code=404,
                detail="Group not found"
            )
        
        await db.delete(group)
        await db.commit()
        
        return {
            "data": {"message": f"Group {group_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete group: {str(e)}"
        )