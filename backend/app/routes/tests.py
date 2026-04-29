
import random
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.core.database import get_db
from app.core.auth import get_current_user, student_required, require_roles
from app.models.user import UserRole
from app.models.test_question import TestQuestion
from app.models.test_result import TestResult
from app.models.test_attempt import TestAttempt
from app.models.lesson import Lesson
from app.models.user import User, UserRole
from app.schemas.test_question import TestQuestionRead, TestQuestionList
from app.schemas.test_result import (
    TestResultCreate,
    TestResultRead,
    TestResultWithAttempts,
    TestAttemptCreate
)

router = APIRouter(tags=["tests"])


@router.get("/lessons/{lesson_id}/questions", response_model=dict)
async def get_random_questions(
    lesson_id: int,
    count: int = Query(12, ge=10, le=15, description="Number of questions to return"),
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

        all_questions_query = select(TestQuestion).where(TestQuestion.lesson_id == lesson_id)
        all_questions_result = await db.execute(all_questions_query)
        all_questions = all_questions_result.scalars().all()

        if not all_questions:
            return {
                "data": TestQuestionList(questions=[], total=0),
                "status": "success"
            }

        previous_results_query = select(TestResult).where(
            and_(
                TestResult.lesson_id == lesson_id,
                TestResult.student_id == current_user.id
            )
        ).order_by(TestResult.completed_at.desc())
        previous_results = await db.execute(previous_results_query)
        previous_results_list = previous_results.scalars().all()

        incorrect_topics = set()
        for result in previous_results_list:
            if result.incorrect_question_ids:
                incorrect_q_ids = result.incorrect_question_ids
                incorrect_questions_query = select(TestQuestion).where(
                    TestQuestion.id.in_(incorrect_q_ids)
                )
                incorrect_questions_result = await db.execute(incorrect_questions_query)
                incorrect_questions = incorrect_questions_result.scalars().all()
                for q in incorrect_questions:
                    if q.topic:
                        incorrect_topics.add(q.topic)

        prioritized_questions = []
        other_questions = []

        for question in all_questions:
            if question.topic and question.topic in incorrect_topics:
                prioritized_questions.append(question)
            else:
                other_questions.append(question)

        selected_questions = []

        prioritized_count = min(len(prioritized_questions), int(count * 0.3))
        if prioritized_questions:
            selected_questions.extend(random.sample(prioritized_questions, prioritized_count))

        remaining_count = count - len(selected_questions)
        if remaining_count > 0 and other_questions:
            available_other = [q for q in other_questions if q not in selected_questions]
            if available_other:
                selected_questions.extend(random.sample(available_other, min(remaining_count, len(available_other))))

        if len(selected_questions) < count and prioritized_questions:
            available_prioritized = [q for q in prioritized_questions if q not in selected_questions]
            if available_prioritized:
                needed = count - len(selected_questions)
                selected_questions.extend(random.sample(available_prioritized, min(needed, len(available_prioritized))))

        random.shuffle(selected_questions)

        questions_data = [TestQuestionRead.model_validate(q) for q in selected_questions]

        return {
            "data": TestQuestionList(
                questions=questions_data,
                total=len(questions_data)
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch questions: {str(e)}"
        )


@router.post("/lessons/{lesson_id}/submit", response_model=dict)
async def submit_test(
    lesson_id: int,
    test_data: TestResultCreate,
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

        if test_data.lesson_id != lesson_id:
            raise HTTPException(status_code=400, detail="Lesson ID mismatch")

        question_ids = [attempt.question_id for attempt in test_data.attempts]
        questions_query = select(TestQuestion).where(TestQuestion.id.in_(question_ids))
        questions_result = await db.execute(questions_query)
        questions = {q.id: q for q in questions_result.scalars().all()}

        correct_count = 0
        incorrect_question_ids = []
        completed_at = datetime.now(timezone.utc)

        attempts_to_create = []
        for attempt_data in test_data.attempts:
            question = questions.get(attempt_data.question_id)
            if not question:
                continue

            is_correct = attempt_data.student_answer == question.correct_answer

            if is_correct:
                correct_count += 1
            else:
                incorrect_question_ids.append(question.id)

            attempts_to_create.append({
                "question_id": attempt_data.question_id,
                "student_answer": attempt_data.student_answer,
                "is_correct": is_correct
            })

        score = (correct_count / len(test_data.attempts) * 100) if test_data.attempts else 0.0

        test_result = TestResult(
            lesson_id=lesson_id,
            student_id=current_user.id,
            started_at=test_data.started_at,
            completed_at=completed_at,
            total_questions=len(test_data.attempts),
            time_taken_seconds=test_data.time_taken_seconds,
            score=score,
            correct_answers=correct_count,
            incorrect_question_ids=incorrect_question_ids if incorrect_question_ids else None
        )

        db.add(test_result)
        await db.flush()

        for attempt_data in attempts_to_create:
            test_attempt = TestAttempt(
                test_result_id=test_result.id,
                question_id=attempt_data["question_id"],
                student_answer=attempt_data["student_answer"],
                is_correct=attempt_data["is_correct"]
            )
            db.add(test_attempt)

        await db.commit()
        await db.refresh(test_result)

        return {
            "data": TestResultRead.model_validate(test_result),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit test: {str(e)}"
        )


@router.get("/lessons/{lesson_id}/results", response_model=dict)
async def get_test_results(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(TestResult).where(TestResult.lesson_id == lesson_id)

        if current_user.role == UserRole.STUDENT:
            query = query.where(TestResult.student_id == current_user.id)
        elif current_user.role == UserRole.TEACHER:
            lesson_result = await db.execute(
                select(Lesson).where(Lesson.id == lesson_id, Lesson.teacher_id == current_user.id)
            )
            if not lesson_result.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        results = await db.execute(query.order_by(TestResult.completed_at.desc()))
        results_list = results.scalars().all()

        return {
            "data": [TestResultRead.model_validate(r) for r in results_list],
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch test results: {str(e)}"
        )

