
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.core.auth import get_current_user, student_required
from app.models.lesson_progress import LessonProgress
from app.models.lesson import Lesson
from app.models.test_result import TestResult
from app.models.practice_result import PracticeResult
from app.models.user import User, UserRole

router = APIRouter(tags=["lesson-progress"])


@router.get("/lessons/{lesson_id}/status", response_model=dict)
async def get_lesson_status(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        test_result_query = select(TestResult).where(
            and_(
                TestResult.lesson_id == lesson_id,
                TestResult.student_id == current_user.id
            )
        ).order_by(TestResult.score.desc(), TestResult.completed_at.desc())
        test_result = await db.execute(test_result_query)
        best_test = test_result.scalar_one_or_none()
        test_score = best_test.score if best_test else 0.0

        practice_result_query = select(func.avg(PracticeResult.practice_score)).where(
            and_(
                PracticeResult.lesson_id == lesson_id,
                PracticeResult.student_id == current_user.id
            )
        )
        practice_avg_result = await db.execute(practice_result_query)
        practice_score = practice_avg_result.scalar() or 0.0

        final_score = (test_score + practice_score) / 2.0 if (test_score > 0 or practice_score > 0) else 0.0

        is_locked = final_score < 50.0
        can_proceed = not is_locked

        return {
            "data": {
                "lesson_id": lesson_id,
                "test_score": test_score,
                "practice_score": practice_score,
                "final_score": final_score,
                "is_locked": is_locked,
                "can_proceed": can_proceed,
                "passed": final_score >= 50.0
            },
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get lesson status: {str(e)}"
        )


@router.get("/lessons/{lesson_id}/next", response_model=dict)
async def get_next_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        test_result_query = select(TestResult).where(
            and_(
                TestResult.lesson_id == lesson_id,
                TestResult.student_id == current_user.id
            )
        ).order_by(TestResult.score.desc(), TestResult.completed_at.desc())
        test_result = await db.execute(test_result_query)
        best_test = test_result.scalar_one_or_none()
        test_score = best_test.score if best_test else 0.0

        practice_result_query = select(func.avg(PracticeResult.practice_score)).where(
            and_(
                PracticeResult.lesson_id == lesson_id,
                PracticeResult.student_id == current_user.id
            )
        )
        practice_avg_result = await db.execute(practice_result_query)
        practice_score = practice_avg_result.scalar() or 0.0

        final_score = (test_score + practice_score) / 2.0 if (test_score > 0 or practice_score > 0) else 0.0
        can_proceed = final_score >= 50.0

        if not can_proceed:
            raise HTTPException(
                status_code=403,
                detail="Current lesson must be passed (>=50%) to access next lesson"
            )

        next_lesson_query = select(Lesson).where(
            and_(
                Lesson.subject_id == lesson.subject_id,
                Lesson.id > lesson_id
            )
        ).order_by(Lesson.id.asc()).limit(1)
        next_lesson_result = await db.execute(next_lesson_query)
        next_lesson = next_lesson_result.scalar_one_or_none()

        if not next_lesson:
            return {
                "data": {"next_lesson_id": None, "message": "No more lessons in this subject"},
                "status": "success"
            }

        return {
            "data": {"next_lesson_id": next_lesson.id, "title": next_lesson.title},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get next lesson: {str(e)}"
        )

