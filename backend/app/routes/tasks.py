
from typing import List, Optional
from datetime import datetime, timezone
from io import StringIO
import csv

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, admin_required, teacher_or_admin_required
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.submission import Submission
from app.models.ai_solution import AISolution
from app.models.evaluation import Evaluation
from app.models.user import User
from app.models.grading_job import GradingJob, GradingJobStatus
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate, TaskList, TaskWithSubmissions, TaskWithRelations
from app.tasks.ai_tasks import generate_ai_solutions_task, grade_task
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=dict)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    logger.info(f"POST /api/v1/tasks called by user {current_user.email if current_user else 'unknown'}")
    logger.info(f"Task data: {task_data}")
    try:
        lesson = await db.execute(select(Lesson).where(Lesson.id == task_data.lesson_id))
        lesson = lesson.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only create tasks for your own lessons")

        task = Task(**task_data.model_dump())
        db.add(task)
        await db.commit()
        await db.refresh(task)

        from app.tasks.ai_tasks import generate_ai_solutions_task, generate_tests_task

        generate_tests_task.delay(task.id)

        generate_ai_solutions_task.delay(task.id)

        logger.info(f"Triggered background generation (tests & solutions) for task {task.id}")

        return {
            "data": TaskRead(
                id=task.id,
                title=task.title,
                body=task.body,
                language=task.language,
                lesson_id=task.lesson_id,
                deadline_at=task.deadline_at,
                created_at=task.created_at,
                updated_at=task.updated_at,
                is_expired=task.is_expired,
                is_active=task.is_active,
                time_remaining=task.time_remaining
            ),
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create task: {str(e)}"
        )


@router.get("", response_model=dict)
async def get_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    lesson_id: Optional[int] = Query(None, description="Filter by lesson"),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    active_only: bool = Query(False, description="Show only active (non-expired) tasks"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Task).options(selectinload(Task.lesson))

        if current_user.role == "teacher":
            query = query.join(Lesson).where(Lesson.teacher_id == current_user.id)
        elif current_user.role == "student":
            pass

        if lesson_id:
            if current_user.role == "teacher":
                lesson_check = await db.execute(
                    select(Lesson).where(Lesson.id == lesson_id, Lesson.teacher_id == current_user.id)
                )
                if not lesson_check.scalar_one_or_none():
                    raise HTTPException(status_code=403, detail="Access denied: Lesson not found or not owned by you")
            query = query.where(Task.lesson_id == lesson_id)
        if language:
            query = query.where(Task.language == language)
        if active_only:
            query = query.where(Task.deadline_at > datetime.now(timezone.utc))

        count_query = select(func.count(Task.id))
        if lesson_id:
            count_query = count_query.where(Task.lesson_id == lesson_id)
        if language:
            count_query = count_query.where(Task.language == language)
        if active_only:
            count_query = count_query.where(Task.deadline_at > datetime.now(timezone.utc))

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(Task.created_at.desc())

        result = await db.execute(query)
        tasks = result.scalars().all()

        return {
            "data": TaskList(
                tasks=[TaskRead.model_validate(task) for task in tasks],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch tasks: {str(e)}"
        )


@router.get("/{task_id}", response_model=dict)
async def get_task(
    task_id: int,
    include_submissions: bool = Query(False, description="Include submissions in response"),
    include_relations: bool = Query(False, description="Include lesson details"),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(Task).options(
            selectinload(Task.lesson).selectinload(Lesson.materials)
        )

        if include_submissions:
            query = query.options(selectinload(Task.submissions))

        query = query.where(Task.id == task_id)
        result = await db.execute(query)
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if include_submissions and include_relations:
            task_data = TaskWithRelations.model_validate(task).model_dump()
        elif include_submissions:
            task_data = TaskWithSubmissions.model_validate(task).model_dump()
        else:
            task_data = TaskRead.model_validate(task).model_dump()

        if task.lesson:
            from app.schemas.lesson_material import LessonMaterialRead
            lesson_data = {
                "id": task.lesson.id,
                "title": task.lesson.title,
                "description": task.lesson.description,
                "materials": [
                    LessonMaterialRead.model_validate(material).model_dump()
                    for material in task.lesson.materials
                ]
            }
            task_data["lesson"] = lesson_data

        return {
            "data": task_data,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task: {str(e)}"
        )


@router.put("/{task_id}", response_model=dict)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only update your own tasks"
            )

        if task_data.deadline_at and task_data.deadline_at < task.deadline_at:
            submissions_result = await db.execute(
                select(func.count(Submission.id)).where(Submission.task_id == task_id)
            )
            submission_count = submissions_result.scalar()

            if submission_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot move deadline earlier when task has submissions"
                )

        update_data = task_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)

        await db.commit()
        await db.refresh(task)

        return {
            "data": TaskRead.model_validate(task),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update task: {str(e)}"
        )


@router.delete("/{task_id}", response_model=dict)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only delete your own tasks"
            )
        submissions_result = await db.execute(
            select(func.count(Submission.id)).where(Submission.task_id == task_id)
        )
        submission_count = submissions_result.scalar()

        if submission_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete task with {submission_count} submissions. Archive instead."
            )

        ai_solutions_result = await db.execute(
            select(func.count(AISolution.id)).where(AISolution.task_id == task_id)
        )
        ai_solution_count = ai_solutions_result.scalar()

        if ai_solution_count > 0:
            ai_solutions = await db.execute(
                select(AISolution).where(AISolution.task_id == task_id)
            )
            for ai_solution in ai_solutions.scalars():
                await db.delete(ai_solution)

        await db.delete(task)
        await db.commit()

        return {
            "data": {"message": f"Task {task_id} deleted successfully"},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete task: {str(e)}"
        )


@router.get("/{task_id}/ai-solutions", response_model=dict)
async def get_task_ai_solutions(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view AI solutions for your own tasks"
            )

        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id).order_by(AISolution.variant_index)
        )
        ai_solutions = ai_solutions_result.scalars().all()

        return {
            "data": {
                "task_id": task_id,
                "ai_solutions": [
                    {
                        "id": sol.id,
                        "provider": sol.provider,
                        "variant_index": sol.variant_index,
                        "code": sol.code,
                        "meta": sol.meta,
                        "created_at": sol.created_at
                    }
                    for sol in ai_solutions
                ],
                "total_solutions": len(ai_solutions)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch AI solutions: {str(e)}"
        )


@router.get("/{task_id}/tests", response_model=dict)
async def get_task_tests(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.task_test import TaskTest

    try:
        task_result = await db.execute(
            select(Task).options(selectinload(Task.lesson)).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        query = select(TaskTest).where(TaskTest.task_id == task_id).order_by(TaskTest.id)

        if current_user.role.value == "student":
            query = query.where(TaskTest.is_public == True)

        tests_result = await db.execute(query)
        tests = tests_result.scalars().all()

        return {
            "data": {
                "task_id": task_id,
                "tests": [
                    {
                        "id": test.id,
                        "test_name": test.test_name,
                        "test_input": test.test_input,
                        "expected_output": test.expected_output,
                        "test_type": test.test_type.value,
                        "weight": test.weight,
                        "timeout_seconds": test.timeout_seconds,
                        "is_public": test.is_public
                    }
                    for test in tests
                ],
                "total_tests": len(tests)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch task tests: {str(e)}"
        )


@router.post("/{task_id}/generate-tests", response_model=dict)
async def generate_task_tests(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    from app.services.ai_service import ai_service

    try:
        task_result = await db.execute(
            select(Task).options(selectinload(Task.lesson)).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if current_user.role.value == "teacher" and task.lesson:
            if task.lesson.teacher_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only generate tests for your own tasks"
                )

        tests = await ai_service.generate_task_tests(task_id, db)

        return {
            "data": {
                "task_id": task_id,
                "tests_generated": len(tests),
                "tests": [
                    {
                        "id": test.id,
                        "test_name": test.test_name,
                        "test_input": test.test_input,
                        "expected_output": test.expected_output,
                        "is_public": test.is_public,
                        "weight": test.weight
                    }
                    for test in tests
                ]
            },
            "message": f"Successfully generated {len(tests)} test cases",
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate tests for task {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate tests: {str(e)}"
        )


@router.post("/{task_id}/prepare-ai", response_model=dict)
async def prepare_ai_solutions(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only generate AI solutions for your own tasks"
            )

        existing_solutions = await db.execute(
            select(func.count(AISolution.id)).where(AISolution.task_id == task_id)
        )
        solution_count = existing_solutions.scalar()

        if solution_count >= 4:
            return {
                "data": {
                    "message": f"AI solutions already exist for task {task_id}",
                    "task_id": task_id,
                    "existing_solutions": solution_count,
                    "status": "already_prepared"
                },
                "status": "success"
            }

        task_result = generate_ai_solutions_task.delay(task_id)

        return {
            "data": {
                "message": f"AI solution generation started for task {task_id}",
                "task_id": task_id,
                "celery_task_id": task_result.id,
                "status": "generating"
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to prepare AI solutions: {str(e)}"
        )


@router.post("/{task_id}/grade", response_model=dict)
async def grade_task_submissions(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only grade submissions for your own tasks"
            )

        submissions_result = await db.execute(
            select(func.count(Submission.id)).where(Submission.task_id == task_id)
        )
        submission_count = submissions_result.scalar()

        if submission_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No submissions found for this task"
            )

        ai_solutions_result = await db.execute(
            select(func.count(AISolution.id)).where(AISolution.task_id == task_id)
        )
        ai_solution_count = ai_solutions_result.scalar()

        if ai_solution_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No AI solutions found. Please run /prepare-ai first"
            )

        evaluations_result = await db.execute(
            select(func.count(Evaluation.id))
            .join(Submission, Evaluation.submission_id == Submission.id)
            .where(Submission.task_id == task_id)
        )
        evaluation_count = evaluations_result.scalar()

        if evaluation_count >= submission_count:
            return {
                "data": {
                    "message": f"Task {task_id} is already graded",
                    "task_id": task_id,
                    "submissions": submission_count,
                    "evaluations": evaluation_count,
                    "status": "already_graded"
                },
                "status": "success"
            }

        grading_job = GradingJob(
            task_id=task_id,
            teacher_id=current_user.id,
            status=GradingJobStatus.PENDING,
            total_submissions=submission_count
        )
        db.add(grading_job)
        await db.commit()
        await db.refresh(grading_job)

        grading_task_result = grade_task.delay(task_id, grading_job.id)

        grading_job.celery_task_id = grading_task_result.id
        await db.commit()

        return {
            "data": {
                "message": f"Grading started for task {task_id}",
                "task_id": task_id,
                "submissions_to_grade": submission_count,
                "celery_task_id": grading_task_result.id,
                "grading_job_id": grading_job.id,
                "status": "grading"
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start grading: {str(e)}"
        )


@router.get("/{task_id}/grading-status", response_model=dict)
async def get_grading_status(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(
            select(Task).options(selectinload(Task.lesson)).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if current_user.role.value == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view grading status for your own tasks"
            )

        job_result = await db.execute(
            select(GradingJob)
            .where(GradingJob.task_id == task_id)
            .order_by(GradingJob.created_at.desc())
            .limit(1)
        )
        grading_job = job_result.scalar_one_or_none()

        if not grading_job:
            return {
                "data": {
                    "task_id": task_id,
                    "status": "no_job",
                    "message": "No grading job found for this task"
                },
                "status": "success"
            }

        return {
            "data": {
                "task_id": task_id,
                "job_id": grading_job.id,
                "status": grading_job.status.value,
                "total_submissions": grading_job.total_submissions,
                "processed_submissions": grading_job.processed_submissions,
                "successful_evaluations": grading_job.successful_evaluations,
                "failed_evaluations": grading_job.failed_evaluations,
                "progress_percent": grading_job.progress_percent,
                "error_message": grading_job.error_message,
                "started_at": grading_job.started_at.isoformat() if grading_job.started_at else None,
                "completed_at": grading_job.completed_at.isoformat() if grading_job.completed_at else None,
                "duration_seconds": grading_job.duration_seconds
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch grading status: {str(e)}"
        )


@router.get("/{task_id}/export", response_class=StreamingResponse)
async def export_task_grades(
    task_id: int,
    format: str = Query("csv", regex="^(csv)$", description="Export format (csv)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(
            select(Task).options(selectinload(Task.lesson)).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if current_user.role.value == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only export grades for your own tasks"
            )

        submissions_result = await db.execute(
            select(Submission)
            .options(
                selectinload(Submission.student),
                selectinload(Submission.evaluation)
            )
            .where(Submission.task_id == task_id)
            .order_by(Submission.student_id, Submission.attempt_number.desc())
        )
        all_submissions = submissions_result.scalars().all()

        latest_submissions = {}
        for sub in all_submissions:
            if sub.student_id not in latest_submissions:
                latest_submissions[sub.student_id] = sub
        submissions = list(latest_submissions.values())

        output = StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Студент",
            "Email",
            "Попытка",
            "Тесты пройдено",
            "Всего тестов",
            "Балл за тесты",
            "AI Similarity (%)",
            "Group Similarity (%)",
            "Итоговый балл",
            "Оценка",
            "Дата отправки",
            "Комментарий"
        ])

        for submission in submissions:
            evaluation = submission.evaluation
            student = submission.student

            if evaluation and evaluation.final_score:
                score = evaluation.final_score
                if score >= 90:
                    letter = "A"
                elif score >= 80:
                    letter = "B"
                elif score >= 70:
                    letter = "C"
                elif score >= 60:
                    letter = "D"
                else:
                    letter = "F"
            else:
                letter = "—"

            writer.writerow([
                student.name if student else "Unknown",
                student.email if student else "",
                submission.attempt_number,
                submission.test_passed_count or "—",
                submission.test_total_count or "—",
                f"{submission.test_score:.1f}" if submission.test_score else "—",
                f"{evaluation.ai_similarity * 100:.1f}" if evaluation else "—",
                f"{evaluation.intra_group_similarity * 100:.1f}" if evaluation else "—",
                evaluation.final_score if evaluation else "—",
                letter,
                submission.created_at.strftime("%Y-%m-%d %H:%M"),
                evaluation.rationale if evaluation else ""
            ])

        output.seek(0)
        filename = f"grades_task_{task_id}_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export grades: {str(e)}"
        )