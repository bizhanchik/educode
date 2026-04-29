
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, admin_required, teacher_or_admin_required
from app.models.teacher_subject_group import TeacherSubjectGroup
from app.models.user import User, UserRole
from app.models.subject import Subject
from app.models.group import Group
from app.schemas.teacher_subject_group import (
    TeacherSubjectGroupCreate,
    TeacherSubjectGroupRead,
    TeacherSubjectGroupWithDetails,
    TeacherSubjectGroupList,
    TeacherSubjectsResponse,
    TeacherGroupsResponse
)

router = APIRouter(tags=["teacher-assignments"])


@router.post("", response_model=dict)
async def create_teacher_assignment(
    assignment_data: TeacherSubjectGroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    try:
        teacher_result = await db.execute(
            select(User).where(
                and_(
                    User.id == assignment_data.teacher_id,
                    User.role == UserRole.TEACHER
                )
            )
        )
        teacher = teacher_result.scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=404,
                detail="Teacher not found or user is not a teacher"
            )

        subject_result = await db.execute(
            select(Subject).where(Subject.id == assignment_data.subject_id)
        )
        subject = subject_result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        group_result = await db.execute(
            select(Group).where(Group.id == assignment_data.group_id)
        )
        group = group_result.scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        existing = await db.execute(
            select(TeacherSubjectGroup).where(
                and_(
                    TeacherSubjectGroup.teacher_id == assignment_data.teacher_id,
                    TeacherSubjectGroup.subject_id == assignment_data.subject_id,
                    TeacherSubjectGroup.group_id == assignment_data.group_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="This teacher-subject-group assignment already exists"
            )

        assignment = TeacherSubjectGroup(**assignment_data.model_dump())
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)

        return {
            "data": TeacherSubjectGroupRead.model_validate(assignment),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create teacher assignment: {str(e)}"
        )


@router.get("", response_model=dict)
async def get_teacher_assignments(
    teacher_id: Optional[int] = Query(None, description="Filter by teacher ID"),
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    group_id: Optional[int] = Query(None, description="Filter by group ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        conditions = []
        # Teachers can only see their own assignments
        if current_user.role == UserRole.TEACHER:
            conditions.append(TeacherSubjectGroup.teacher_id == current_user.id)
        if teacher_id:
            conditions.append(TeacherSubjectGroup.teacher_id == teacher_id)
        if subject_id:
            conditions.append(TeacherSubjectGroup.subject_id == subject_id)
        if group_id:
            conditions.append(TeacherSubjectGroup.group_id == group_id)

        count_query = select(func.count(TeacherSubjectGroup.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        count_result = await db.execute(count_query)
        total = count_result.scalar()

        offset = (page - 1) * size
        query = (
            select(
                TeacherSubjectGroup,
                User.name.label("teacher_name"),
                Subject.name.label("subject_name"),
                Group.name.label("group_name")
            )
            .join(User, TeacherSubjectGroup.teacher_id == User.id)
            .join(Subject, TeacherSubjectGroup.subject_id == Subject.id)
            .join(Group, TeacherSubjectGroup.group_id == Group.id)
            .offset(offset)
            .limit(size)
            .order_by(TeacherSubjectGroup.created_at.desc())
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await db.execute(query)
        rows = result.all()

        assignments_with_details = [
            TeacherSubjectGroupWithDetails(
                id=row.TeacherSubjectGroup.id,
                teacher_id=row.TeacherSubjectGroup.teacher_id,
                subject_id=row.TeacherSubjectGroup.subject_id,
                group_id=row.TeacherSubjectGroup.group_id,
                created_at=row.TeacherSubjectGroup.created_at,
                updated_at=row.TeacherSubjectGroup.updated_at,
                teacher_name=row.teacher_name,
                subject_name=row.subject_name,
                group_name=row.group_name
            )
            for row in rows
        ]

        return {
            "data": TeacherSubjectGroupList(
                assignments=assignments_with_details,
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch teacher assignments: {str(e)}"
        )


@router.get("/teacher/{teacher_id}/subjects", response_model=dict)
async def get_teacher_subjects_by_group(
    teacher_id: int,
    group_id: int = Query(..., description="Group ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        teacher_result = await db.execute(
            select(User).where(
                and_(User.id == teacher_id, User.role == UserRole.TEACHER)
            )
        )
        if not teacher_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Teachers can only access their own data
        if current_user.role == UserRole.TEACHER and current_user.id != teacher_id:
            raise HTTPException(status_code=403, detail="Access denied: You can only view your own subjects")

        query = (
            select(TeacherSubjectGroup, Subject)
            .join(Subject, TeacherSubjectGroup.subject_id == Subject.id)
            .where(
                and_(
                    TeacherSubjectGroup.teacher_id == teacher_id,
                    TeacherSubjectGroup.group_id == group_id
                )
            )
        )

        result = await db.execute(query)
        rows = result.all()

        subjects = [
            {
                "subject_id": row.Subject.id,
                "subject_name": row.Subject.name,
                "assignment_id": row.TeacherSubjectGroup.id
            }
            for row in rows
        ]

        return {
            "data": TeacherSubjectsResponse(
                teacher_id=teacher_id,
                group_id=group_id,
                subjects=subjects
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch teacher subjects: {str(e)}"
        )


@router.get("/teacher/{teacher_id}/groups", response_model=dict)
async def get_teacher_groups_by_subject(
    teacher_id: int,
    subject_id: int = Query(..., description="Subject ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        teacher_result = await db.execute(
            select(User).where(
                and_(User.id == teacher_id, User.role == UserRole.TEACHER)
            )
        )
        if not teacher_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Teachers can only access their own data
        if current_user.role == UserRole.TEACHER and current_user.id != teacher_id:
            raise HTTPException(status_code=403, detail="Access denied: You can only view your own groups")

        query = (
            select(TeacherSubjectGroup, Group)
            .join(Group, TeacherSubjectGroup.group_id == Group.id)
            .where(
                and_(
                    TeacherSubjectGroup.teacher_id == teacher_id,
                    TeacherSubjectGroup.subject_id == subject_id
                )
            )
        )

        result = await db.execute(query)
        rows = result.all()

        groups = [
            {
                "group_id": row.Group.id,
                "group_name": row.Group.name,
                "assignment_id": row.TeacherSubjectGroup.id
            }
            for row in rows
        ]

        return {
            "data": TeacherGroupsResponse(
                teacher_id=teacher_id,
                subject_id=subject_id,
                groups=groups
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch teacher groups: {str(e)}"
        )


@router.delete("/{assignment_id}", response_model=dict)
async def delete_teacher_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    try:
        result = await db.execute(
            select(TeacherSubjectGroup).where(TeacherSubjectGroup.id == assignment_id)
        )
        assignment = result.scalar_one_or_none()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found"
            )

        await db.delete(assignment)
        await db.commit()

        return {
            "data": {"message": f"Assignment {assignment_id} deleted successfully"},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete assignment: {str(e)}"
        )


@router.delete("/teacher/{teacher_id}/bulk", response_model=dict)
async def delete_teacher_assignments_bulk(
    teacher_id: int,
    subject_id: Optional[int] = Query(None, description="Optional subject ID filter"),
    group_id: Optional[int] = Query(None, description="Optional group ID filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    try:
        conditions = [TeacherSubjectGroup.teacher_id == teacher_id]
        if subject_id:
            conditions.append(TeacherSubjectGroup.subject_id == subject_id)
        if group_id:
            conditions.append(TeacherSubjectGroup.group_id == group_id)

        stmt = delete(TeacherSubjectGroup).where(and_(*conditions))
        result = await db.execute(stmt)
        await db.commit()

        deleted_count = result.rowcount

        return {
            "data": {
                "message": f"Deleted {deleted_count} assignments",
                "count": deleted_count
            },
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk delete assignments: {str(e)}"
        )
