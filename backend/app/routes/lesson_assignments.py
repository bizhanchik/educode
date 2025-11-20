"""
EduCode Backend - Lesson Assignment Routes

FastAPI routes for managing lesson assignments to groups.
Teachers use these endpoints to assign lessons to groups with deadlines.
"""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.lesson_assignment import LessonAssignment
from app.models.lesson import Lesson
from app.models.group import Group
from app.models.subject import Subject
from app.models.user import User
from app.schemas.lesson_assignment import (
    LessonAssignmentCreate,
    LessonAssignmentRead,
    LessonAssignmentWithDetails,
    LessonAssignmentList,
    LessonAssignmentBulkCreate
)

router = APIRouter(tags=["lesson-assignments"])


@router.post("/", response_model=dict)
async def create_lesson_assignment(
    assignment_data: LessonAssignmentCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new lesson assignment to a group.

    Teachers use this to assign a lesson to a group with a deadline.

    - **lesson_id**: Lesson ID
    - **group_id**: Group ID
    - **deadline_at**: Assignment deadline (ISO 8601 format)
    """
    try:
        # Verify lesson exists
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == assignment_data.lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Verify group exists
        group_result = await db.execute(
            select(Group).where(Group.id == assignment_data.group_id)
        )
        group = group_result.scalar_one_or_none()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        # Check if assignment already exists
        existing = await db.execute(
            select(LessonAssignment).where(
                and_(
                    LessonAssignment.lesson_id == assignment_data.lesson_id,
                    LessonAssignment.group_id == assignment_data.group_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="This lesson is already assigned to this group"
            )

        # Create assignment
        assignment = LessonAssignment(**assignment_data.model_dump())
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)

        return {
            "data": LessonAssignmentRead.model_validate(assignment),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create lesson assignment: {str(e)}"
        )


@router.post("/bulk", response_model=dict)
async def create_lesson_assignments_bulk(
    bulk_data: LessonAssignmentBulkCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk create lesson assignments to multiple groups.

    Useful when assigning the same lesson to multiple groups with different deadlines.

    - **lesson_id**: Lesson ID
    - **assignments**: List of {group_id, deadline_at} objects
    """
    try:
        # Verify lesson exists
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == bulk_data.lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        created_assignments = []
        errors = []

        for assignment_data in bulk_data.assignments:
            try:
                group_id = assignment_data["group_id"]
                deadline_at = datetime.fromisoformat(assignment_data["deadline_at"].replace('Z', '+00:00'))

                # Verify group exists
                group_result = await db.execute(
                    select(Group).where(Group.id == group_id)
                )
                if not group_result.scalar_one_or_none():
                    errors.append(f"Group {group_id} not found")
                    continue

                # Check if assignment already exists
                existing = await db.execute(
                    select(LessonAssignment).where(
                        and_(
                            LessonAssignment.lesson_id == bulk_data.lesson_id,
                            LessonAssignment.group_id == group_id
                        )
                    )
                )
                if existing.scalar_one_or_none():
                    errors.append(f"Lesson already assigned to group {group_id}")
                    continue

                # Create assignment
                assignment = LessonAssignment(
                    lesson_id=bulk_data.lesson_id,
                    group_id=group_id,
                    deadline_at=deadline_at
                )
                db.add(assignment)
                created_assignments.append(assignment)

            except Exception as e:
                errors.append(f"Error with group {assignment_data.get('group_id', 'unknown')}: {str(e)}")
                continue

        if created_assignments:
            await db.commit()
            for assignment in created_assignments:
                await db.refresh(assignment)

        return {
            "data": {
                "created": [LessonAssignmentRead.model_validate(a) for a in created_assignments],
                "errors": errors,
                "success_count": len(created_assignments),
                "error_count": len(errors)
            },
            "status": "success" if created_assignments else "error"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk create lesson assignments: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_lesson_assignments(
    lesson_id: int = Query(None, description="Filter by lesson ID"),
    group_id: int = Query(None, description="Filter by group ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of lesson assignments with filters.

    - **lesson_id**: Optional filter by lesson
    - **group_id**: Optional filter by group
    - **page**: Page number (starts from 1)
    - **size**: Number of assignments per page
    """
    try:
        # Build filter conditions
        conditions = []
        if lesson_id:
            conditions.append(LessonAssignment.lesson_id == lesson_id)
        if group_id:
            conditions.append(LessonAssignment.group_id == group_id)

        # Get total count
        count_query = select(func.count(LessonAssignment.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        count_result = await db.execute(count_query)
        total = count_result.scalar()

        # Get paginated results with joined data
        offset = (page - 1) * size
        query = (
            select(
                LessonAssignment,
                Lesson.title.label("lesson_title"),
                Group.name.label("group_name"),
                Subject.name.label("subject_name"),
                User.full_name.label("teacher_name")
            )
            .join(Lesson, LessonAssignment.lesson_id == Lesson.id)
            .join(Group, LessonAssignment.group_id == Group.id)
            .join(Subject, Lesson.subject_id == Subject.id)
            .join(User, Lesson.teacher_id == User.id)
            .offset(offset)
            .limit(size)
            .order_by(LessonAssignment.deadline_at.asc())
        )

        if conditions:
            query = query.where(and_(*conditions))

        result = await db.execute(query)
        rows = result.all()

        assignments_with_details = [
            LessonAssignmentWithDetails(
                id=row.LessonAssignment.id,
                lesson_id=row.LessonAssignment.lesson_id,
                group_id=row.LessonAssignment.group_id,
                deadline_at=row.LessonAssignment.deadline_at,
                created_at=row.LessonAssignment.created_at,
                lesson_title=row.lesson_title,
                group_name=row.group_name,
                subject_name=row.subject_name,
                teacher_name=row.teacher_name
            )
            for row in rows
        ]

        return {
            "data": LessonAssignmentList(
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
            detail=f"Failed to fetch lesson assignments: {str(e)}"
        )


@router.get("/group/{group_id}/active", response_model=dict)
async def get_active_assignments_for_group(
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all active lesson assignments for a specific group.

    Returns assignments with deadlines in the future or recently passed.
    Used by students to see their assigned lessons.

    - **group_id**: Group ID
    """
    try:
        # Verify group exists
        group_result = await db.execute(
            select(Group).where(Group.id == group_id)
        )
        if not group_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Group not found")

        # Get all assignments for the group (no time filter for now)
        query = (
            select(
                LessonAssignment,
                Lesson.title.label("lesson_title"),
                Lesson.description.label("lesson_description"),
                Subject.name.label("subject_name"),
                User.full_name.label("teacher_name")
            )
            .join(Lesson, LessonAssignment.lesson_id == Lesson.id)
            .join(Subject, Lesson.subject_id == Subject.id)
            .join(User, Lesson.teacher_id == User.id)
            .where(LessonAssignment.group_id == group_id)
            .order_by(LessonAssignment.deadline_at.asc())
        )

        result = await db.execute(query)
        rows = result.all()

        assignments = [
            {
                "assignment_id": row.LessonAssignment.id,
                "lesson_id": row.LessonAssignment.lesson_id,
                "lesson_title": row.lesson_title,
                "lesson_description": row.lesson_description,
                "subject_name": row.subject_name,
                "teacher_name": row.teacher_name,
                "deadline_at": row.LessonAssignment.deadline_at.isoformat(),
                "created_at": row.LessonAssignment.created_at.isoformat()
            }
            for row in rows
        ]

        return {
            "data": {
                "group_id": group_id,
                "assignments": assignments,
                "total": len(assignments)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch active assignments: {str(e)}"
        )


@router.put("/{assignment_id}", response_model=dict)
async def update_lesson_assignment(
    assignment_id: int,
    deadline_at: datetime,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a lesson assignment's deadline.

    - **assignment_id**: Assignment ID
    - **deadline_at**: New deadline (ISO 8601 format)
    """
    try:
        # Get existing assignment
        result = await db.execute(
            select(LessonAssignment).where(LessonAssignment.id == assignment_id)
        )
        assignment = result.scalar_one_or_none()

        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found"
            )

        # Update deadline
        assignment.deadline_at = deadline_at
        await db.commit()
        await db.refresh(assignment)

        return {
            "data": LessonAssignmentRead.model_validate(assignment),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update assignment: {str(e)}"
        )


@router.delete("/{assignment_id}", response_model=dict)
async def delete_lesson_assignment(
    assignment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a lesson assignment.

    - **assignment_id**: Assignment ID
    """
    try:
        # Get existing assignment
        result = await db.execute(
            select(LessonAssignment).where(LessonAssignment.id == assignment_id)
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
