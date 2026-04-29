
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.lesson_progress import LessonProgress
from app.models.lesson import Lesson

router = APIRouter(tags=["progress"])


from pydantic import BaseModel, Field


class ProgressCreate(BaseModel):
    user_id: int
    lesson_id: int
    sections_completed: Optional[dict] = Field(default={"video": False, "theory": False, "practice": False})


class ProgressUpdate(BaseModel):
    completed: Optional[bool] = None
    sections_completed: Optional[dict] = None
    completed_at: Optional[datetime] = None


class ProgressRead(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    completed: bool
    sections_completed: dict
    started_at: datetime
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
async def get_progress(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    lesson_id: Optional[int] = Query(None, description="Filter by lesson ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(LessonProgress).options(
            selectinload(LessonProgress.user),
            selectinload(LessonProgress.lesson)
        )

        if user_id:
            query = query.where(LessonProgress.user_id == user_id)
        if lesson_id:
            query = query.where(LessonProgress.lesson_id == lesson_id)

        count_query = select(func.count(LessonProgress.id))
        if user_id:
            count_query = count_query.where(LessonProgress.user_id == user_id)
        if lesson_id:
            count_query = count_query.where(LessonProgress.lesson_id == lesson_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        result = await db.execute(query)
        progress_records = result.scalars().all()

        return {
            "data": {
                "items": [ProgressRead.model_validate(p) for p in progress_records],
                "total": total,
                "page": page,
                "size": size,
                "pages": (total + size - 1) // size if size > 0 else 0
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch progress: {str(e)}"
        )


@router.post("", response_model=dict)
async def create_progress(
    progress_data: ProgressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        existing = await db.execute(
            select(LessonProgress).where(
                and_(
                    LessonProgress.user_id == progress_data.user_id,
                    LessonProgress.lesson_id == progress_data.lesson_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Progress record already exists for this user and lesson"
            )

        progress = LessonProgress(**progress_data.model_dump())
        db.add(progress)
        await db.commit()
        await db.refresh(progress)

        return {
            "data": ProgressRead.model_validate(progress),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create progress: {str(e)}"
        )


@router.put("/{progress_id}", response_model=dict)
async def update_progress(
    progress_id: int,
    progress_data: ProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(LessonProgress).where(LessonProgress.id == progress_id)
        )
        progress = result.scalar_one_or_none()

        if not progress:
            raise HTTPException(status_code=404, detail="Progress not found")

        update_data = progress_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(progress, field, value)

        if progress_data.completed and not progress.completed_at:
            progress.completed_at = datetime.utcnow()

        await db.commit()
        await db.refresh(progress)

        return {
            "data": ProgressRead.model_validate(progress),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update progress: {str(e)}"
        )


@router.get("/user/{user_id}/summary", response_model=dict)
async def get_user_progress_summary(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(LessonProgress).options(
                selectinload(LessonProgress.lesson)
            ).where(LessonProgress.user_id == user_id)
        )
        progress_records = result.scalars().all()

        total_lessons = len(progress_records)
        completed_lessons = sum(1 for p in progress_records if p.completed)
        total_sections = total_lessons * 3
        completed_sections = sum(
            sum(1 for v in p.sections_completed.values() if v)
            for p in progress_records
        )

        lessons = {}
        for p in progress_records:
            lessons[p.lesson_id] = ProgressRead.model_validate(p)

        return {
            "data": {
                "user_id": user_id,
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "total_sections": total_sections,
                "completed_sections": completed_sections,
                "completion_percentage": (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0,
                "lessons": lessons
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch progress summary: {str(e)}"
        )


@router.get("/lesson/{lesson_id}/stats", response_model=dict)
async def get_lesson_stats(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(LessonProgress).where(LessonProgress.lesson_id == lesson_id)
        )
        progress_records = result.scalars().all()

        total_students = len(progress_records)
        completed_students = sum(1 for p in progress_records if p.completed)

        video_completed = sum(1 for p in progress_records if p.sections_completed.get("video", False))
        theory_completed = sum(1 for p in progress_records if p.sections_completed.get("theory", False))
        practice_completed = sum(1 for p in progress_records if p.sections_completed.get("practice", False))

        return {
            "data": {
                "lesson_id": lesson_id,
                "total_students": total_students,
                "completed_students": completed_students,
                "completion_rate": (completed_students / total_students * 100) if total_students > 0 else 0,
                "section_stats": {
                    "video": {"completed": video_completed, "rate": (video_completed / total_students * 100) if total_students > 0 else 0},
                    "theory": {"completed": theory_completed, "rate": (theory_completed / total_students * 100) if total_students > 0 else 0},
                    "practice": {"completed": practice_completed, "rate": (practice_completed / total_students * 100) if total_students > 0 else 0}
                }
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lesson stats: {str(e)}"
        )
