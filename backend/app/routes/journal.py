
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.journal_entry import JournalEntry
from app.models.lesson import Lesson

router = APIRouter(tags=["journal"])


from pydantic import BaseModel


class JournalCreate(BaseModel):
    user_id: int
    lesson_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    test_score: Optional[int] = None
    practice_score: Optional[int] = None
    average_score: Optional[int] = None
    notes: Optional[str] = None


class JournalUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    test_score: Optional[int] = None
    practice_score: Optional[int] = None
    average_score: Optional[int] = None
    notes: Optional[str] = None


class JournalRead(BaseModel):
    id: int
    user_id: int
    lesson_id: int
    started_at: datetime
    completed_at: Optional[datetime]
    test_score: Optional[int]
    practice_score: Optional[int]
    average_score: Optional[int]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=dict)
async def get_journal_entries(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    lesson_id: Optional[int] = Query(None, description="Filter by lesson ID"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(JournalEntry).options(
            selectinload(JournalEntry.user),
            selectinload(JournalEntry.lesson)
        )

        if user_id:
            query = query.where(JournalEntry.user_id == user_id)
        if lesson_id:
            query = query.where(JournalEntry.lesson_id == lesson_id)

        count_query = select(func.count(JournalEntry.id))
        if user_id:
            count_query = count_query.where(JournalEntry.user_id == user_id)
        if lesson_id:
            count_query = count_query.where(JournalEntry.lesson_id == lesson_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size)
        result = await db.execute(query)
        entries = result.scalars().all()

        return {
            "data": {
                "items": [JournalRead.model_validate(e) for e in entries],
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
            detail=f"Failed to fetch journal entries: {str(e)}"
        )


@router.post("", response_model=dict)
async def create_journal_entry(
    entry_data: JournalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if entry_data.test_score is not None and entry_data.practice_score is not None:
            entry_data.average_score = round((entry_data.test_score + entry_data.practice_score) / 2)

        entry = JournalEntry(**entry_data.model_dump())
        db.add(entry)
        await db.commit()
        await db.refresh(entry)

        return {
            "data": JournalRead.model_validate(entry),
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create journal entry: {str(e)}"
        )


@router.put("/{entry_id}", response_model=dict)
async def update_journal_entry(
    entry_id: int,
    entry_data: JournalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(JournalEntry).where(JournalEntry.id == entry_id)
        )
        entry = result.scalar_one_or_none()

        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")

        update_data = entry_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(entry, field, value)

        if entry.test_score is not None and entry.practice_score is not None:
            entry.average_score = round((entry.test_score + entry.practice_score) / 2)

        await db.commit()
        await db.refresh(entry)

        return {
            "data": JournalRead.model_validate(entry),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update journal entry: {str(e)}"
        )


@router.get("/user/{user_id}/course/{course_id}", response_model=dict)
async def get_course_journal(
    user_id: int,
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        lessons_result = await db.execute(
            select(Lesson.id).where(Lesson.subject_id == course_id)
        )
        lesson_ids = [row[0] for row in lessons_result.all()]

        result = await db.execute(
            select(JournalEntry).options(
                selectinload(JournalEntry.lesson)
            ).where(
                and_(
                    JournalEntry.user_id == user_id,
                    JournalEntry.lesson_id.in_(lesson_ids)
                )
            )
        )
        entries = result.scalars().all()

        total_lessons = len(entries)
        completed_lessons = sum(1 for e in entries if e.completed_at is not None)
        avg_test_score = round(sum(e.test_score for e in entries if e.test_score is not None) / total_lessons) if total_lessons > 0 else 0
        avg_practice_score = round(sum(e.practice_score for e in entries if e.practice_score is not None) / total_lessons) if total_lessons > 0 else 0
        avg_overall = round(sum(e.average_score for e in entries if e.average_score is not None) / total_lessons) if total_lessons > 0 else 0

        return {
            "data": {
                "user_id": user_id,
                "course_id": course_id,
                "entries": [JournalRead.model_validate(e) for e in entries],
                "statistics": {
                    "total_lessons": total_lessons,
                    "completed_lessons": completed_lessons,
                    "average_test_score": avg_test_score,
                    "average_practice_score": avg_practice_score,
                    "average_overall_score": avg_overall
                }
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch course journal: {str(e)}"
        )


@router.get("/lesson/{lesson_id}/stats", response_model=dict)
async def get_lesson_journal_stats(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(JournalEntry).where(JournalEntry.lesson_id == lesson_id)
        )
        entries = result.scalars().all()

        total_students = len(entries)
        completed_students = sum(1 for e in entries if e.completed_at is not None)

        test_scores = [e.test_score for e in entries if e.test_score is not None]
        practice_scores = [e.practice_score for e in entries if e.practice_score is not None]
        overall_scores = [e.average_score for e in entries if e.average_score is not None]

        avg_test = round(sum(test_scores) / len(test_scores)) if test_scores else 0
        avg_practice = round(sum(practice_scores) / len(practice_scores)) if practice_scores else 0
        avg_overall = round(sum(overall_scores) / len(overall_scores)) if overall_scores else 0

        pass_count = sum(1 for score in overall_scores if score >= 70)
        pass_rate = (pass_count / len(overall_scores) * 100) if overall_scores else 0

        return {
            "data": {
                "lesson_id": lesson_id,
                "total_students": total_students,
                "completed_students": completed_students,
                "completion_rate": (completed_students / total_students * 100) if total_students > 0 else 0,
                "average_test_score": avg_test,
                "average_practice_score": avg_practice,
                "average_overall_score": avg_overall,
                "pass_rate": round(pass_rate, 1),
                "pass_count": pass_count
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lesson statistics: {str(e)}"
        )
