"""
EduCode Backend - Teacher Assignment Routes

FastAPI routes for managing teacher-subject-group assignments.
Admins use these endpoints to assign teachers to subjects in specific groups.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
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


@router.post("/", response_model=dict)
async def create_teacher_assignment(
    assignment_data: TeacherSubjectGroupCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new teacher-subject-group assignment.
    Admin only - assigns a teacher to teach a subject in a specific group.

    - **teacher_id**: User ID of the teacher
    - **subject_id**: Subject ID
    - **group_id**: Group ID
    """
    try:
        # Verify teacher exists and has teacher role
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

        # Verify subject exists
        subject_result = await db.execute(
            select(Subject).where(Subject.id == assignment_data.subject_id)
        )
        subject = subject_result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Verify group exists
        group_result = await db.execute(
            select(Group).where(Group.id == assignment_data.group_id)
        )
        group = group_result.scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Check if assignment already exists
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

        # Create assignment
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


@router.get("/", response_model=dict)
async def get_teacher_assignments(
    teacher_id: int = Query(None, description="Filter by teacher ID"),
    subject_id: int = Query(None, description="Filter by subject ID"),
    group_id: int = Query(None, description="Filter by group ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of teacher assignments with filters.

    - **teacher_id**: Optional filter by teacher
    - **subject_id**: Optional filter by subject
    - **group_id**: Optional filter by group
    - **page**: Page number (starts from 1)
    - **size**: Number of assignments per page
    """
    try:
        # Build filter conditions
        conditions = []
        if teacher_id:
            conditions.append(TeacherSubjectGroup.teacher_id == teacher_id)
        if subject_id:
            conditions.append(TeacherSubjectGroup.subject_id == subject_id)
        if group_id:
            conditions.append(TeacherSubjectGroup.group_id == group_id)

        # Get total count
        count_query = select(func.count(TeacherSubjectGroup.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        count_result = await db.execute(count_query)
        total = count_result.scalar()

        # Get paginated results with joined data
        offset = (page - 1) * size
        query = (
            select(
                TeacherSubjectGroup,
                User.full_name.label("teacher_name"),
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
    db: AsyncSession = Depends(get_db)
):
    """
    Get all subjects assigned to a teacher in a specific group.

    This endpoint is used by teachers to see what subjects they teach in a group.

    - **teacher_id**: Teacher user ID
    - **group_id**: Group ID
    """
    try:
        # Verify teacher exists
        teacher_result = await db.execute(
            select(User).where(
                and_(User.id == teacher_id, User.role == UserRole.TEACHER)
            )
        )
        if not teacher_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Get subjects for this teacher-group combination
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
    db: AsyncSession = Depends(get_db)
):
    """
    Get all groups assigned to a teacher for a specific subject.

    This endpoint is used by teachers to see what groups they teach for a subject.

    - **teacher_id**: Teacher user ID
    - **subject_id**: Subject ID
    """
    try:
        # Verify teacher exists
        teacher_result = await db.execute(
            select(User).where(
                and_(User.id == teacher_id, User.role == UserRole.TEACHER)
            )
        )
        if not teacher_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Get groups for this teacher-subject combination
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
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a teacher-subject-group assignment.

    - **assignment_id**: Assignment ID
    """
    try:
        # Get existing assignment
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
    subject_id: int = Query(None, description="Optional subject ID filter"),
    group_id: int = Query(None, description="Optional group ID filter"),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk delete teacher assignments with optional filters.

    Useful for removing all assignments for a teacher, or for a specific subject/group.

    - **teacher_id**: Teacher user ID
    - **subject_id**: Optional filter by subject
    - **group_id**: Optional filter by group
    """
    try:
        # Build delete conditions
        conditions = [TeacherSubjectGroup.teacher_id == teacher_id]
        if subject_id:
            conditions.append(TeacherSubjectGroup.subject_id == subject_id)
        if group_id:
            conditions.append(TeacherSubjectGroup.group_id == group_id)

        # Execute bulk delete
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
