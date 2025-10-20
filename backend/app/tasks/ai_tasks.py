"""
AI-powered evaluation tasks for EduCode.

This module contains Celery tasks for:
- AI solution generation (OpenAI + Anthropic)
- Similarity calculation (AI and group comparisons)
- Automated grading and evaluation
- Auto-grading scheduler for expired tasks
"""

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
    """Helper function to get synchronous database session for Celery tasks."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.core.config import settings
    
    # Create synchronous engine from async URL
    sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    sync_engine = create_engine(sync_url, pool_pre_ping=True)
    
    # Create synchronous session factory
    SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
    return SessionLocal()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def generate_ai_solutions_task(self, task_id: int):
    """
    Generate AI reference solutions for a programming task.
    
    Creates 4 AI solutions:
    - 3 from OpenAI (ChatGPT) using different approaches
    - 1 from Anthropic (Claude)
    
    Args:
        task_id (int): Database ID of the programming task
        
    Returns:
        dict: Results containing generated solutions and metadata
    """
    try:
        logger.info(f"[AI] Starting solution generation for task {task_id}")
        
        # Update task status
        self.update_state(
            state="PROGRESS",
            meta={"current": 0, "total": 4, "status": "Fetching task details"}
        )
        
        # Get database session for Celery (sync)
        db = get_celery_db_session()
        
        try:
            # Fetch task details
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            # Update progress
            self.update_state(
                state="PROGRESS",
                meta={"current": 1, "total": 4, "status": "Generating AI solutions"}
            )
            
            # Generate AI solutions using the AI service
            try:
                # Create a new event loop for async operations
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                # Create async session for AI service
                from app.core.database import async_session_factory, create_session_factory
                
                # Create async database session
                session_factory = create_session_factory()
                async_db = session_factory()
                
                try:
                    result = loop.run_until_complete(
                        ai_service.generate_ai_solutions(task_id, async_db)
                    )
                    
                    # Commit the async session
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
        
        # Retry for temporary failures
        if any(keyword in str(exc).lower() for keyword in ["rate limit", "timeout", "connection"]):
            raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
        
        # Return error for permanent failures
        return {
            "task_id": task_id,
            "solutions_generated": 0,
            "total_solutions": 0,
            "error": str(exc),
            "status": "failed"
        }


@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def calc_ai_similarity_task(self, submission_id: int):
    """
    Calculate AI similarity for a student submission.
    
    Compares the student's code with all AI-generated reference solutions
    and stores the maximum similarity score.
    
    Args:
        submission_id (int): Database ID of the student submission
        
    Returns:
        dict: Similarity calculation results
    """
    try:
        logger.info(f"[AI] Calculating AI similarity for submission {submission_id}")
        
        # Get database session for Celery (sync)
        db = get_celery_db_session()
        
        try:
            # Fetch submission and related data
            submission = db.query(Submission).filter(Submission.id == submission_id).first()
            if not submission:
                raise ValueError(f"Submission {submission_id} not found")
            
            # Get AI solutions for the task
            ai_solutions = db.query(AISolution).filter(
                AISolution.task_id == submission.task_id,
                AISolution.code.isnot(None)
            ).all()
            
            if not ai_solutions:
                logger.warning(f"[AI] No AI solutions found for task {submission.task_id}")
                ai_similarity = 0.0
            else:
                # Extract AI codes
                ai_codes = [solution.code for solution in ai_solutions]
                
                # Calculate similarity using async client
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                try:
                    ai_similarity = loop.run_until_complete(
                        get_ai_similarity(submission.code, ai_codes)
                    )
                finally:
                    loop.close()
            
            # Store or update evaluation record
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
        
        # Retry for temporary failures
        if any(keyword in str(exc).lower() for keyword in ["timeout", "connection", "service"]):
            raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
        
        return {
            "submission_id": submission_id,
            "ai_similarity": 0.0,
            "error": str(exc),
            "status": "failed"
        }


@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def grade_task(self, task_id: int):
    """
    Grade all submissions for a task using AI evaluation.
    
    Calculates group similarities, requests final grades from ChatGPT,
    and stores the results in the database.
    
    Args:
        task_id (int): Database ID of the task to grade
        
    Returns:
        dict: Grading results for all submissions
    """
    try:
        logger.info(f"[AI] Starting grading for task {task_id}")
        
        # Get database session for Celery (sync)
        db = get_celery_db_session()
        
        try:
            # Fetch task and submissions
            task = db.query(Task).filter(Task.id == task_id).first()
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            submissions = db.query(Submission).filter(Submission.task_id == task_id).all()
            if not submissions:
                logger.warning(f"[AI] No submissions found for task {task_id}")
                return {"task_id": task_id, "graded_count": 0, "status": "no_submissions"}
            
            logger.info(f"[AI] Grading {len(submissions)} submissions for task {task_id}")
            
            # Extract submission codes for group similarity
            submission_codes = [sub.code for sub in submissions]
            
            graded_count = 0
            
            # Process each submission
            for submission in submissions:
                try:
                    # Get or create evaluation record
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
                    
                    # Calculate group similarity if not already done
                    if evaluation.intra_group_similarity is None:
                        other_codes = [code for code in submission_codes if code != submission.code]
                        
                        if other_codes:
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            try:
                                group_similarity = loop.run_until_complete(
                                    get_average_group_similarity(submission.code, other_codes)
                                )
                            finally:
                                loop.close()
                        else:
                            group_similarity = 0.0
                        
                        evaluation.intra_group_similarity = group_similarity
                    
                    # Request final grade from AI if not already done
                    if evaluation.final_score is None:
                        context = {
                            "task_title": task.title,
                            "task_description": task.body,
                            "ai_similarity": evaluation.ai_similarity or 0.0,
                            "intra_group_similarity": evaluation.intra_group_similarity or 0.0,
                            "correctness_score": 85  # Default correctness score
                        }
                        
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        
                        try:
                            grade_result = loop.run_until_complete(
                                ai_service.request_final_grade(context)
                            )
                            
                            evaluation.final_score = grade_result["score"]
                            evaluation.rationale = grade_result["rationale"]
                            
                        except Exception as e:
                            logger.error(f"[AI] Failed to get grade for submission {submission.id}: {str(e)}")
                            # Use fallback grading
                            evaluation.final_score = max(1, min(100, 
                                85 - int(evaluation.ai_similarity * 30) - int(evaluation.intra_group_similarity * 20)
                            ))
                            evaluation.rationale = "Fallback grading due to AI service unavailability"
                        
                        finally:
                            loop.close()
                    
                    graded_count += 1
                    
                except Exception as e:
                    logger.error(f"[AI] Failed to grade submission {submission.id}: {str(e)}")
                    continue
            
            # Commit all changes
            db.commit()
            
            # Mark task as graded
            task.graded = True
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
        
        # Retry for temporary failures
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
    """
    Automatically grade tasks that have passed their deadline.
    
    Runs periodically via Celery Beat to find expired tasks
    and trigger grading for them.
    
    Returns:
        dict: Summary of auto-grading actions
    """
    try:
        logger.info("[AI] ⏰ Checking for expired tasks to auto-grade")
        
        # Get database session for Celery (sync)
        db = get_celery_db_session()
        
        try:
            # Find expired tasks that haven't been graded
            now = datetime.now(timezone.utc)
            
            # Find tasks that are expired and don't have evaluations for all submissions
            expired_tasks = db.query(Task).filter(
                Task.deadline_at < now
            ).all()
            
            # Filter tasks that need grading
            tasks_to_grade = []
            for task in expired_tasks:
                # Count submissions for this task
                submission_count = db.query(Submission).filter(
                    Submission.task_id == task.id
                ).count()
                
                # Count evaluations for this task
                evaluation_count = db.query(Evaluation).join(Submission).filter(
                    Submission.task_id == task.id
                ).count()
                
                # If there are submissions but not all are evaluated, add to grading list
                if submission_count > 0 and evaluation_count < submission_count:
                    tasks_to_grade.append(task)
            
            if not tasks_to_grade:
                logger.info("[AI] ⏰ No expired tasks found for auto-grading")
                return {"expired_tasks": len(expired_tasks), "triggered_grading": 0, "status": "no_tasks"}
            
            triggered_count = 0
            
            for task in tasks_to_grade:
                try:
                    # Trigger grading task
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