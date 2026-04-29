
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.models.submission import Submission
from app.models.evaluation import Evaluation
from app.models.task import Task
from app.models.task_test import TaskTest
from app.models.ai_solution import AISolution
from app.models.grading_job import GradingJob, GradingJobStatus
from app.models.user import User
from app.services.similarity import SimilarityCalculator

logger = logging.getLogger(__name__)


def calculate_final_score(
    test_score: float,
    ai_similarity: float,
    group_similarity: float
) -> Tuple[int, str]:
    max_similarity = max(ai_similarity, group_similarity)
    originality = (1.0 - max_similarity) * 100

    raw_score = (test_score * 0.6) + (originality * 0.4)

    rationale_parts = []

    if group_similarity > 0.85:
        raw_score = min(raw_score, 40)
        rationale_parts.append(
            f"Высокое сходство с другими студентами ({group_similarity*100:.0f}%) - "
            "возможное списывание. Оценка ограничена."
        )
    elif group_similarity > 0.70:
        raw_score *= 0.9
        rationale_parts.append(
            f"Заметное сходство с другими студентами ({group_similarity*100:.0f}%)"
        )

    if ai_similarity > 0.90:
        rationale_parts.append(
            f"Код очень похож на AI-решение ({ai_similarity*100:.0f}%)"
        )
    elif ai_similarity > 0.75:
        rationale_parts.append(
            f"Код частично похож на AI-решение ({ai_similarity*100:.0f}%)"
        )

    final_score = max(0, min(100, int(round(raw_score))))

    if not rationale_parts:
        if test_score >= 90 and max_similarity < 0.5:
            rationale_parts.append("Отличная работа! Код оригинален и проходит все тесты.")
        elif test_score >= 70:
            rationale_parts.append("Хорошее решение с приемлемым уровнем оригинальности.")
        else:
            rationale_parts.append("Решение оценено автоматически.")

    rationale_parts.append(
        f"\nРасчет: {test_score:.0f}% тесты × 0.6 + {originality:.0f}% оригинальность × 0.4 = {raw_score:.0f}%"
    )

    rationale = " ".join(rationale_parts)

    return final_score, rationale


async def grade_submission(
    db: AsyncSession,
    submission: Submission,
    task: Task,
    ai_solutions: List[AISolution],
    other_submissions: List[Submission]
) -> Evaluation:
    similarity_calc = SimilarityCalculator()

    test_score = submission.test_score or 0.0

    ai_similarity = 0.0
    if ai_solutions:
        ai_codes = [sol.code for sol in ai_solutions]
        ai_similarity = similarity_calc.get_max_similarity(submission.code, ai_codes)

    group_similarity = 0.0
    if other_submissions:
        other_codes = [sub.code for sub in other_submissions if sub.id != submission.id]
        if other_codes:
            group_similarity = similarity_calc.get_max_similarity(submission.code, other_codes)

    final_score, rationale = calculate_final_score(
        test_score=test_score,
        ai_similarity=ai_similarity,
        group_similarity=group_similarity
    )

    existing_eval = await db.execute(
        select(Evaluation).where(Evaluation.submission_id == submission.id)
    )
    evaluation = existing_eval.scalar_one_or_none()

    if evaluation:
        evaluation.test_score = test_score
        evaluation.test_passed = submission.test_passed_count
        evaluation.test_total = submission.test_total_count
        evaluation.ai_similarity = ai_similarity
        evaluation.intra_group_similarity = group_similarity
        evaluation.final_score = final_score
        evaluation.rationale = rationale
    else:
        evaluation = Evaluation(
            submission_id=submission.id,
            test_score=test_score,
            test_passed=submission.test_passed_count,
            test_total=submission.test_total_count,
            ai_similarity=ai_similarity,
            intra_group_similarity=group_similarity,
            final_score=final_score,
            rationale=rationale
        )
        db.add(evaluation)

    return evaluation


async def batch_grade_task(
    db: AsyncSession,
    task_id: int,
    teacher_id: int
) -> GradingJob:
    grading_job = GradingJob(
        task_id=task_id,
        teacher_id=teacher_id,
        status=GradingJobStatus.PENDING
    )
    db.add(grading_job)
    await db.commit()
    await db.refresh(grading_job)

    try:
        task_result = await db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            grading_job.mark_failed("Task not found")
            await db.commit()
            return grading_job

        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        ai_solutions = ai_solutions_result.scalars().all()

        submissions_result = await db.execute(
            select(Submission)
            .where(Submission.task_id == task_id)
            .order_by(Submission.student_id, Submission.attempt_number.desc())
        )
        all_submissions = submissions_result.scalars().all()

        latest_submissions = {}
        for sub in all_submissions:
            if sub.student_id not in latest_submissions:
                latest_submissions[sub.student_id] = sub
        submissions = list(latest_submissions.values())

        if not submissions:
            grading_job.total_submissions = 0
            grading_job.mark_completed()
            await db.commit()
            return grading_job

        grading_job.total_submissions = len(submissions)
        grading_job.mark_started()
        await db.commit()

        for submission in submissions:
            try:
                await grade_submission(
                    db=db,
                    submission=submission,
                    task=task,
                    ai_solutions=ai_solutions,
                    other_submissions=submissions
                )
                grading_job.increment_progress(success=True)
            except Exception as e:
                logger.error(f"Failed to grade submission {submission.id}: {e}")
                grading_job.increment_progress(success=False)

            await db.commit()

        grading_job.mark_completed()
        await db.commit()

        logger.info(
            f"Completed grading task {task_id}: "
            f"{grading_job.successful_evaluations}/{grading_job.total_submissions} successful"
        )

        return grading_job

    except Exception as e:
        logger.error(f"Batch grading failed for task {task_id}: {e}")
        grading_job.mark_failed(str(e))
        await db.commit()
        return grading_job


async def get_grading_job_status(
    db: AsyncSession,
    task_id: int
) -> Optional[GradingJob]:
    result = await db.execute(
        select(GradingJob)
        .where(GradingJob.task_id == task_id)
        .order_by(GradingJob.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()
