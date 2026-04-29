
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, noload

from app.core.database import get_db
from app.core.auth import admin_required, teacher_required, get_current_user
from app.models.group import Group
from app.models.user import User, UserRole
from app.models.teacher_subject_group import TeacherSubjectGroup
from app.schemas.group import GroupCreate, GroupRead, GroupUpdate, GroupList, GroupWithUsers

router = APIRouter()


@router.post("", response_model=dict)
async def create_group(
    group_data: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create groups")
    try:
        existing_group = await db.execute(
            select(Group).where(Group.name == group_data.name)
        )
        if existing_group.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Group name already exists"
            )

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


@router.get("", response_model=dict)
async def get_groups(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    all_groups: bool = Query(False, description="Get all groups (for teachers creating courses)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role == UserRole.ADMIN:
            count_query = select(func.count(Group.id))
            groups_query = select(Group).offset((page - 1) * size).limit(size).order_by(Group.created_at.desc())
        elif current_user.role == UserRole.TEACHER:
            all_groups_value = all_groups if isinstance(all_groups, bool) else str(all_groups).lower() == 'true'
            if all_groups_value:
                count_query = select(func.count(Group.id))
                groups_query = select(Group).offset((page - 1) * size).limit(size).order_by(Group.created_at.desc())
            else:
                count_query = (
                    select(func.count(func.distinct(Group.id)))
                    .join(TeacherSubjectGroup, Group.id == TeacherSubjectGroup.group_id)
                    .where(TeacherSubjectGroup.teacher_id == current_user.id)
                )
                groups_query = (
                    select(Group)
                    .join(TeacherSubjectGroup, Group.id == TeacherSubjectGroup.group_id)
                    .where(TeacherSubjectGroup.teacher_id == current_user.id)
                    .distinct()
                    .offset((page - 1) * size)
                    .limit(size)
                    .order_by(Group.created_at.desc())
                )
        else:
            raise HTTPException(status_code=403, detail="Access denied")

        count_result = await db.execute(count_query)
        total = count_result.scalar()

        result = await db.execute(groups_query)
        groups = result.scalars().all()

        groups_with_counts = []
        for group in groups:
            student_count_result = await db.execute(
                select(func.count(User.id)).where(
                    User.group_id == group.id,
                    User.role == UserRole.STUDENT
                )
            )
            student_count = student_count_result.scalar() or 0

            groups_with_counts.append(
                GroupRead(
                    id=group.id,
                    name=group.name,
                    created_at=group.created_at,
                    updated_at=group.updated_at,
                    student_count=student_count
                )
            )

        return {
            "data": GroupList(
                groups=groups_with_counts,
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }

    except HTTPException:
        raise
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
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role == UserRole.TEACHER:
            assignment_check = await db.execute(
                select(TeacherSubjectGroup).where(
                    TeacherSubjectGroup.group_id == group_id,
                    TeacherSubjectGroup.teacher_id == current_user.id
                )
            )
            assignment = assignment_check.scalars().first()
            if not assignment:
                raise HTTPException(status_code=403, detail="Access denied: You don't teach in this group")
        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        group_query = select(Group).where(Group.id == group_id)
        group_result = await db.execute(group_query)
        group = group_result.scalars().first()

        if not group:
            raise HTTPException(
                status_code=404,
                detail="Group not found"
            )

        if include_users:
            users_query = select(User).where(User.group_id == group_id)
            users_result = await db.execute(users_query)
            users = users_result.scalars().all()

            group_data = {
                "id": group.id,
                "name": group.name,
                "created_at": group.created_at,
                "updated_at": group.updated_at,
                "student_count": len([u for u in users if u.role == UserRole.STUDENT]),
                "users": [
                    {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                        "group_id": user.group_id,
                        "created_at": user.created_at,
                        "updated_at": user.updated_at
                    }
                    for user in users
                ]
            }

            return {
                "data": group_data,
                "status": "success"
            }
        else:
            student_count_result = await db.execute(
                select(func.count(User.id)).where(
                    User.group_id == group_id,
                    User.role == UserRole.STUDENT
                )
            )
            student_count = student_count_result.scalar() or 0

            group_data = {
                "id": group.id,
                "name": group.name,
                "created_at": group.created_at,
                "updated_at": group.updated_at,
                "student_count": student_count
            }

            return {
                "data": group_data,
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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update groups")
    try:
        result = await db.execute(select(Group).where(Group.id == group_id))
        group = result.scalar_one_or_none()

        if not group:
            raise HTTPException(
                status_code=404,
                detail="Group not found"
            )

        if group_data.name and group_data.name != group.name:
            existing_group = await db.execute(
                select(Group).where(Group.name == group_data.name)
            )
            if existing_group.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Group name already exists"
                )

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
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete groups")
    try:
        users_result = await db.execute(
            select(func.count(User.id)).where(User.group_id == group_id)
        )
        user_count = users_result.scalar()

        if user_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete group with {user_count} users. Remove users first."
            )

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