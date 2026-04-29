
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional

from celery import current_task
from sqlalchemy.orm import Session

from app.tasks.celery_app import celery_app
from app.core.database import get_db
from app.models.ai_solution import AISolution
from app.models.evaluation import Evaluation
from app.models.submission import Submission
from app.models.task import Task
from app.services.ai_service import ai_service
from app.services.similarity_client import get_ai_similarity, get_average_group_similarity

logger = logging.getLogger(__name__)


def get_celery_db_session():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings

    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    sync_engine = create_engine(sync_url, pool_pre_ping=True)

    SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
    return SessionLocal()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_ai_solutions_task(self, task_id: int):
    try:
        logger.info(f"[AI] Starting solution generation for task {task_id}")

        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 4, "status": "Fetching task details"}
        )

        db = get_celery_db_session()

        try:
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                raise ValueError(f"Task {task_id} not found")

            self.update_state(
                state="PROGRESS",
                meta={"current": 1, "total": 4, "status": "Generating AI solutions"}
            )

            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                from app.core.database import async_session_factory, create_session_factory

                session_factory = create_session_factory()
                async_db = session_factory()

                try:
                    result = loop.run_until_complete(
                        ai_service.generate_ai_solutions(task_id, async_db)
                    )

                    loop.run_until_complete(async_db.commit())

                    logger.info(f"[AI] Generated {len(result)} solutions for task {task_id}")

                    return {
                        "task_id": task_id,
                        "solutions_generated": len(result),
                        "total_solutions": len(result),
                        "status": "completed"
                    }
                finally:
                    loop.run_until_complete(async_db.close())

            except Exception as e:
                logger.error(f"[AI] Solution generation failed for task {task_id}: {str(e)}")
                return {
                    "task_id": task_id,
                    "solutions_generated": 0,
                    "total_solutions": 0,
                    "error": str(e),
                    "status": "failed"
                }
            finally:
                try:
                    loop.close()
                except:
                    pass

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[AI] Solution generation failed for task {task_id}: {str(exc)}")

        if any(keyword in str(exc).lower() for keyword in ["rate limit", "timeout", "connection"]):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

        return {
            "task_id": task_id,
            "solutions_generated": 0,
            "total_solutions": 0,
            "error": str(exc),
            "status": "failed"
        }


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_tests_task(self, task_id: int):
    try:
        logger.info(f"[AI] Starting test generation for task {task_id}")

        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 1, "status": "Generating tests..."}
        )

        async def _run_async_generation():
            from app.core.database import create_session_factory
            from app.services.ai_service import ai_service

            async_session_factory = create_session_factory()
            db = async_session_factory()
            try:
                return await ai_service.generate_task_tests(task_id, db)
            finally:
                await db.close()

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            tests = loop.run_until_complete(_run_async_generation())

            logger.info(f"[AI] Generated {len(tests)} tests for task {task_id}")
            return {
                "task_id": task_id,
                "tests_generated": len(tests),
                "status": "completed"
            }
        finally:
            loop.close()

    except Exception as exc:
        logger.error(f"[AI] Test generation failed for task {task_id}: {str(exc)}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def calc_ai_similarity_task(self, submission_id: int):
    try:
        logger.info(f"[AI] Calculating AI similarity for submission {submission_id}")

        db = get_celery_db_session()

        try:
            submission = db.query(Submission).filter(Submission.id == submission_id).first()
            if not submission:
                raise ValueError(f"Submission {submission_id} not found")

            ai_solutions = db.query(AISolution).filter(
                AISolution.task_id == submission.task_id,
                AISolution.code.isnot(None)
            ).all()

            if not ai_solutions:
                logger.warning(f"[AI] No AI solutions found for task {submission.task_id}")
                ai_similarity = 0.0
            else:
                ai_codes = [solution.code for solution in ai_solutions]

                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                try:
                    ai_similarity = loop.run_until_complete(
                        get_ai_similarity(submission.code, ai_codes)
                    )
                finally:
                    loop.close()

            evaluation = db.query(Evaluation).filter(
                Evaluation.submission_id == submission_id
            ).first()

            if evaluation:
                evaluation.ai_similarity = ai_similarity
            else:
                evaluation = Evaluation(
                    submission_id=submission_id,
                    ai_similarity=ai_similarity,
                    intra_group_similarity=None,
                    final_score=None,
                    rationale=None
                )
                db.add(evaluation)

            db.commit()

            logger.info(f"[AI] AI similarity calculated: {ai_similarity:.3f} for submission {submission_id}")

            return {
                "submission_id": submission_id,
                "ai_similarity": ai_similarity,
                "ai_solutions_count": len(ai_solutions),
                "status": "completed"
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[AI] Similarity calculation failed for submission {submission_id}: {str(exc)}")

        if any(keyword in str(exc).lower() for keyword in ["timeout", "connection", "service"]):
            raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))

        return {
            "submission_id": submission_id,
            "ai_similarity": 0.0,
            "error": str(exc),
            "status": "failed"
        }


@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def grade_task(self, task_id: int, grading_job_id: int = None):
    try:
        logger.info(f"[AI] Starting grading for task {task_id} (job_id={grading_job_id})")

        db = get_celery_db_session()

        try:
            grading_job = None
            if grading_job_id:
                from app.models.grading_job import GradingJob, GradingJobStatus
                grading_job = db.query(GradingJob).filter(GradingJob.id == grading_job_id).first()
                if grading_job:
                    grading_job.mark_started()
                    db.commit()

            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                if grading_job:
                    grading_job.mark_failed("Task not found")
                    db.commit()
                raise ValueError(f"Task {task_id} not found")

            all_submissions = db.query(Submission).filter(
                Submission.task_id == task_id
            ).order_by(Submission.student_id, Submission.attempt_number.desc()).all()

            latest_submissions = {}
            for sub in all_submissions:
                if sub.student_id not in latest_submissions:
                    latest_submissions[sub.student_id] = sub
            submissions = list(latest_submissions.values())

            if not submissions:
                logger.warning(f"[AI] No submissions found for task {task_id}")
                if grading_job:
                    grading_job.total_submissions = 0
                    grading_job.mark_completed()
                    db.commit()
                return {"task_id": task_id, "graded_count": 0, "status": "no_submissions"}

            if grading_job:
                grading_job.total_submissions = len(submissions)
                db.commit()

            logger.info(f"[AI] Grading {len(submissions)} submissions for task {task_id}")

            ai_solutions = db.query(AISolution).filter(
                AISolution.task_id == task_id,
                AISolution.code.isnot(None)
            ).all()

            submission_codes = [sub.code for sub in submissions]

            graded_count = 0

            from app.services.grading_service import calculate_final_score
            from app.services.similarity import SimilarityCalculator
            similarity_calc = SimilarityCalculator()

            for submission in submissions:
                try:
                    evaluation = db.query(Evaluation).filter(
                        Evaluation.submission_id == submission.id
                    ).first()

                    if not evaluation:
                        evaluation = Evaluation(
                            submission_id=submission.id,
                            ai_similarity=0.0,
                            intra_group_similarity=None,
                            final_score=None,
                            rationale=None
                        )
                        db.add(evaluation)

                    test_score = submission.test_score if submission.test_score is not None else 0.0

                    if evaluation.ai_similarity is None or evaluation.ai_similarity == 0.0:
                        if ai_solutions:
                            ai_codes = [sol.code for sol in ai_solutions]
                            ai_similarity = similarity_calc.get_max_similarity(submission.code, ai_codes)
                            evaluation.ai_similarity = ai_similarity
                        else:
                            evaluation.ai_similarity = 0.0

                    if evaluation.intra_group_similarity is None:
                        other_codes = [code for code in submission_codes if code != submission.code]

                        if other_codes:
                            group_similarity = similarity_calc.get_max_similarity(submission.code, other_codes)
                        else:
                            group_similarity = 0.0

                        evaluation.intra_group_similarity = group_similarity

                    final_score, rationale = calculate_final_score(
                        test_score=test_score,
                        ai_similarity=evaluation.ai_similarity or 0.0,
                        group_similarity=evaluation.intra_group_similarity or 0.0
                    )

                    evaluation.test_score = test_score
                    evaluation.test_passed = submission.test_passed_count
                    evaluation.test_total = submission.test_total_count
                    evaluation.final_score = final_score
                    evaluation.rationale = rationale

                    graded_count += 1

                    if grading_job:
                        grading_job.increment_progress(success=True)
                        db.commit()

                except Exception as e:
                    logger.error(f"[AI] Failed to grade submission {submission.id}: {str(e)}")
                    if grading_job:
                        grading_job.increment_progress(success=False)
                        db.commit()
                    continue

            db.commit()

            if grading_job:
                grading_job.mark_completed()
                db.commit()

            logger.info(f"[AI] Completed grading for task {task_id}: {graded_count}/{len(submissions)} submissions")

            return {
                "task_id": task_id,
                "total_submissions": len(submissions),
                "graded_count": graded_count,
                "status": "completed"
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[AI] Grading failed for task {task_id}: {str(exc)}")

        if grading_job_id:
            try:
                db = get_celery_db_session()
                from app.models.grading_job import GradingJob
                grading_job = db.query(GradingJob).filter(GradingJob.id == grading_job_id).first()
                if grading_job:
                    grading_job.mark_failed(str(exc))
                    db.commit()
                db.close()
            except:
                pass

        if any(keyword in str(exc).lower() for keyword in ["timeout", "connection", "service"]):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

        return {
            "task_id": task_id,
            "graded_count": 0,
            "error": str(exc),
            "status": "failed"
        }


@celery_app.task
def auto_grade_expired_tasks():
    try:
        logger.info("[AI] ⏰ Checking for expired tasks to auto-grade")

        db = get_celery_db_session()

        try:
            now = datetime.now(timezone.utc)

            expired_tasks = db.query(Task).filter(
                Task.deadline_at < now
            ).all()

            tasks_to_grade = []
            for task in expired_tasks:
                submission_count = db.query(Submission).filter(
                    Submission.task_id == task.id
                ).count()

                evaluation_count = db.query(Evaluation).join(Submission).filter(
                    Submission.task_id == task.id
                ).count()

                if submission_count > 0 and evaluation_count < submission_count:
                    tasks_to_grade.append(task)

            if not tasks_to_grade:
                logger.info("[AI] ⏰ No expired tasks found for auto-grading")
                return {"expired_tasks": len(expired_tasks), "triggered_grading": 0, "status": "no_tasks"}

            triggered_count = 0

            for task in tasks_to_grade:
                try:
                    grade_task.delay(task.id)
                    triggered_count += 1
                    logger.info(f"[AI] ⏰ Auto-grading triggered for task {task.id}")

                except Exception as e:
                    logger.error(f"[AI] ⏰ Failed to trigger grading for task {task.id}: {str(e)}")
                    continue

            db.commit()

            logger.info(f"[AI] ⏰ Auto-grading check completed: {triggered_count}/{len(tasks_to_grade)} tasks triggered")

            return {
                "expired_tasks": len(expired_tasks),
                "triggered_grading": triggered_count,
                "status": "completed"
            }

        finally:
            db.close()

    except Exception as exc:
        logger.error(f"[AI] ⏰ Auto-grading check failed: {str(exc)}")
        return {
            "expired_tasks": 0,
            "triggered_grading": 0,
            "error": str(exc),
            "status": "failed"
        }