"""
EduCode Backend - Lesson Routes

FastAPI routes for Lesson CRUD operations.
Handles lesson management for teachers to organize programming tasks.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, admin_required, require_roles
from app.models.lesson import Lesson
from app.models.task import Task
from app.models.user import User
from app.schemas.lesson import LessonCreate, LessonRead, LessonUpdate, LessonList, LessonWithTasks, LessonWithRelations

router = APIRouter(prefix="/api/lessons", tags=["lessons"])


@router.post("/", response_model=dict)
async def create_lesson(
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Create a new lesson.
    
    - **title**: Lesson title
    - **description**: Lesson description
    - **subject_id**: Subject ID (foreign key)
    - **teacher_id**: Teacher ID (foreign key) - auto-set to current teacher
    """
    try:
        # Auto-set teacher_id to current user for teachers
        lesson_dict = lesson_data.model_dump()
        if current_user.role == "teacher":
            lesson_dict["teacher_id"] = current_user.id
        
        # Create new lesson
        lesson = Lesson(**lesson_dict)
        db.add(lesson)
        await db.commit()
        await db.refresh(lesson)

        # FIXED: Manually construct LessonRead to avoid greenlet errors
        # Don't use from_attributes with relationships
        return {
            "data": LessonRead(
                id=lesson.id,
                title=lesson.title,
                description=lesson.description,
                subject_id=lesson.subject_id,
                teacher_id=lesson.teacher_id,
                created_at=lesson.created_at,
                updated_at=lesson.updated_at,
            ),
            "status": "success"
        }
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create lesson: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_lessons(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    subject_id: Optional[int] = Query(None, description="Filter by subject"),
    teacher_id: Optional[int] = Query(None, description="Filter by teacher"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get lessons with pagination and filtering.
    
    Teachers can only see their own lessons unless they're admin.
    Students can see lessons from their assigned teachers.
    """
    try:
        # Build base query
        query = select(Lesson).options(
            selectinload(Lesson.subject),
            selectinload(Lesson.teacher)
        )
        
        # Apply role-based filtering
        if current_user.role == "teacher":
            # Teachers can only see their own lessons
            query = query.where(Lesson.teacher_id == current_user.id)
        elif current_user.role == "student":
            # Students can see lessons from teachers in their group
            # For now, allow all lessons - can be refined based on group logic
            pass
        # Admins can see all lessons (no additional filtering)
        
        # Apply filters
        if subject_id:
            query = query.where(Lesson.subject_id == subject_id)
        if teacher_id and current_user.role == "admin":
            # Only admins can filter by teacher_id
            query = query.where(Lesson.teacher_id == teacher_id)
        
        # Get total count
        count_query = select(func.count(Lesson.id))
        if subject_id:
            count_query = count_query.where(Lesson.subject_id == subject_id)
        if teacher_id:
            count_query = count_query.where(Lesson.teacher_id == teacher_id)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(Lesson.created_at.desc())
        
        result = await db.execute(query)
        lessons = result.scalars().all()
        
        return {
            "data": LessonList(
                lessons=[LessonRead.model_validate(lesson) for lesson in lessons],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lessons: {str(e)}"
        )


@router.get("/{lesson_id}", response_model=dict)
async def get_lesson(
    lesson_id: int,
    include_tasks: bool = Query(False, description="Include tasks in response"),
    include_relations: bool = Query(False, description="Include subject and teacher details"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific lesson by ID.
    
    Teachers can only access their own lessons.
    Students can access lessons they're enrolled in.
    Admins can access any lesson.
    """
    try:
        query = select(Lesson)
        
        if include_tasks and include_relations:
            query = query.options(
                selectinload(Lesson.tasks),
                selectinload(Lesson.subject),
                selectinload(Lesson.teacher)
            )
        elif include_tasks:
            query = query.options(selectinload(Lesson.tasks))
        elif include_relations:
            query = query.options(
                selectinload(Lesson.subject),
                selectinload(Lesson.teacher)
            )
        
        query = query.where(Lesson.id == lesson_id)
        result = await db.execute(query)
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )
        
        # Check access permissions
        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only access your own lessons")
        elif current_user.role == "student":
            # For now, allow students to access all lessons
            # This can be refined based on group/enrollment logic
            pass
        
        if include_tasks and include_relations:
            return {
                "data": LessonWithRelations.model_validate(lesson),
                "status": "success"
            }
        elif include_tasks:
            return {
                "data": LessonWithTasks.model_validate(lesson),
                "status": "success"
            }
        else:
            return {
                "data": LessonRead.model_validate(lesson),
                "status": "success"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lesson: {str(e)}"
        )


@router.put("/{lesson_id}", response_model=dict)
async def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Update a lesson.
    
    Teachers can only update their own lessons.
    Admins can update any lesson.
    """
    try:
        # Get existing lesson
        result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )
        
        # Check permissions
        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only update your own lessons")
        
        # Update lesson fields
        update_data = lesson_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lesson, field, value)
        
        await db.commit()
        await db.refresh(lesson)
        
        return {
            "data": LessonRead.model_validate(lesson),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update lesson: {str(e)}"
        )


@router.delete("/{lesson_id}", response_model=dict)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Delete a lesson.
    
    Teachers can only delete their own lessons.
    Admins can delete any lesson.
    """
    try:
        # Check if lesson has tasks
        tasks_result = await db.execute(
            select(func.count(Task.id)).where(Task.lesson_id == lesson_id)
        )
        task_count = tasks_result.scalar()
        
        if task_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete lesson with {task_count} tasks. Remove tasks first."
            )
        
        # Get existing lesson
        result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )
        
        # Check permissions
        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only delete your own lessons")
        
        await db.delete(lesson)
        await db.commit()
        
        return {
            "data": {"message": f"Lesson {lesson_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete lesson: {str(e)}"
        )