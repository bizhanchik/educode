
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import admin_required, get_password_hash, get_current_user, teacher_required
from app.models.user import User, UserRole
from app.models.teacher_subject_group import TeacherSubjectGroup
from app.schemas.user import UserCreate, UserRead, UserUpdate, UserList
from app.schemas.group import GroupRead

router = APIRouter(tags=["users"])


@router.post("", response_model=dict)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: str = Depends(admin_required)
):
    try:
        existing_user = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if existing_user.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        user_dict = user_data.model_dump(exclude={'password'})
        user_dict['password_hash'] = get_password_hash(user_data.password)

        print(f"🔍 DEBUG: Creating user with data: {user_dict}")
        print(f"🔍 DEBUG: Role type: {type(user_dict.get('role'))}, Role value: {user_dict.get('role')}")

        user = User(**user_dict)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        print(f"✅ DEBUG: User created with role: {user.role}, type: {type(user.role)}")

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


@router.get("", response_model=dict)
async def get_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    role: Optional[str] = Query(None, description="Filter by role"),
    group_id: Optional[int] = Query(None, description="Filter by group"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(User).options(selectinload(User.group))

        if current_user.role == UserRole.TEACHER:
            teacher_groups_query = select(TeacherSubjectGroup.group_id).where(
                TeacherSubjectGroup.teacher_id == current_user.id
            ).distinct()
            teacher_groups_result = await db.execute(teacher_groups_query)
            teacher_group_ids = [row[0] for row in teacher_groups_result.all()]

            if not teacher_group_ids:
                return {
                    "data": UserList(
                        users=[],
                        total=0,
                        page=page,
                        size=size
                    ),
                    "status": "success"
                }

            query = query.where(
                User.group_id.in_(teacher_group_ids),
                User.role == UserRole.STUDENT
            )
        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        if role:
            try:
                role_enum = UserRole(role.lower())
                query = query.where(User.role == role_enum)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid role: {role}. Must be one of: admin, teacher, student"
                )
        if group_id:
            query = query.where(User.group_id == group_id)

        count_query = select(func.count(User.id))

        if current_user.role == UserRole.TEACHER:
            teacher_groups_query = select(TeacherSubjectGroup.group_id).where(
                TeacherSubjectGroup.teacher_id == current_user.id
            ).distinct()
            teacher_groups_result = await db.execute(teacher_groups_query)
            teacher_group_ids = [row[0] for row in teacher_groups_result.all()]

            if teacher_group_ids:
                count_query = count_query.where(
                    User.group_id.in_(teacher_group_ids),
                    User.role == UserRole.STUDENT
                )
            else:
                count_query = count_query.where(User.id == -1)

        if role:
            try:
                role_enum = UserRole(role.lower())
                count_query = count_query.where(User.role == role_enum)
            except ValueError:
                pass
        if group_id:
            count_query = count_query.where(User.group_id == group_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

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
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        if user_data.email and user_data.email != user.email:
            existing_user = await db.execute(
                select(User).where(User.email == user_data.email)
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )

        update_data = user_data.model_dump(exclude_unset=True, exclude={'password'})
        for field, value in update_data.items():
            setattr(user, field, value)

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
    try:
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