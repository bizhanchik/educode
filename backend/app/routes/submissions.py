
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, student_required, teacher_required, admin_required, teacher_or_admin_required, require_roles
from app.models.submission import Submission
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.user import User, UserRole
from app.schemas.submission import (
    SubmissionCreate, SubmissionRead, SubmissionUpdate, SubmissionList,
    SubmissionWithEvaluation, SubmissionWithRelations, SubmissionStats
)
from app.tasks.ai_tasks import calc_ai_similarity_task

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.post("", response_model=dict)
async def create_submission(
    submission_data: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        task_result = await db.execute(select(Task).where(Task.id == submission_data.task_id))
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        if task.deadline_at and datetime.now(timezone.utc) > task.deadline_at:
            raise HTTPException(
                status_code=400,
                detail="Task deadline has passed"
            )

        existing_submission = await db.execute(
            select(Submission).where(
                Submission.task_id == submission_data.task_id,
                Submission.student_id == current_user.id
            )
        )
        if existing_submission.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="You have already submitted code for this task"
            )

        submission_dict = submission_data.model_dump()
        submission_dict["student_id"] = current_user.id

        submission = Submission(**submission_dict)
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        calc_ai_similarity_task.delay(submission.id)

        return {
            "data": SubmissionRead.model_validate(submission),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create submission: {str(e)}"
        )


@router.get("", response_model=dict)
async def get_submissions(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    task_id: Optional[int] = Query(None, description="Filter by task"),
    student_id: Optional[int] = Query(None, description="Filter by student"),
    has_evaluation: Optional[bool] = Query(None, description="Filter by evaluation status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Submission).options(
            selectinload(Submission.task),
            selectinload(Submission.student)
        )

        if current_user.role == UserRole.STUDENT:
            query = query.where(Submission.student_id == current_user.id)
        elif current_user.role == UserRole.TEACHER:
            query = query.join(Task).join(Lesson).where(Lesson.teacher_id == current_user.id)

        if task_id:
            if current_user.role == UserRole.TEACHER:
                task_check = await db.execute(
                    select(Task).join(Lesson).where(
                        Task.id == task_id,
                        Lesson.teacher_id == current_user.id
                    )
                )
                if not task_check.scalar_one_or_none():
                    raise HTTPException(status_code=403, detail="Access denied: Task not found or not owned by you")
            query = query.where(Submission.task_id == task_id)
        if student_id:
            if current_user.role == UserRole.STUDENT:
                raise HTTPException(status_code=403, detail="Students cannot filter by student ID")
            query = query.where(Submission.student_id == student_id)
        if has_evaluation is not None:
            if has_evaluation:
                query = query.join(Submission.evaluation)
            else:
                query = query.where(~Submission.evaluation.has())

        count_query = select(func.count(Submission.id))

        if current_user.role == UserRole.STUDENT:
            count_query = count_query.where(Submission.student_id == current_user.id)
        elif current_user.role == UserRole.TEACHER:
            count_query = count_query.select_from(Submission).join(Task).join(Lesson).where(Lesson.teacher_id == current_user.id)

        if task_id:
            count_query = count_query.where(Submission.task_id == task_id)
        if student_id and current_user.role != UserRole.STUDENT:
            count_query = count_query.where(Submission.student_id == student_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(Submission.created_at.desc())

        result = await db.execute(query)
        submissions = result.scalars().all()

        return {
            "data": SubmissionList(
                submissions=[SubmissionRead.model_validate(submission) for submission in submissions],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch submissions: {str(e)}"
        )


@router.get("/{submission_id}", response_model=dict)
async def get_submission(
    submission_id: int,
    include_evaluation: bool = Query(False, description="Include evaluation in response"),
    include_relations: bool = Query(False, description="Include task and student details"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Submission)

        if include_evaluation and include_relations:
            query = query.options(
                selectinload(Submission.evaluation),
                selectinload(Submission.task),
                selectinload(Submission.student)
            )
        elif include_evaluation:
            query = query.options(selectinload(Submission.evaluation))
        elif include_relations:
            query = query.options(
                selectinload(Submission.task),
                selectinload(Submission.student)
            )

        query = query.where(Submission.id == submission_id)
        result = await db.execute(query)
        submission = result.scalar_one_or_none()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        if current_user.role == UserRole.STUDENT:
            if submission.student_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only view your own submissions")
        elif current_user.role == UserRole.TEACHER:
            task_check = await db.execute(
                select(Task).join(Lesson).where(
                    Task.id == submission.task_id,
                    Lesson.teacher_id == current_user.id
                )
            )
            if not task_check.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Access denied: Submission not in your lessons")

        if include_evaluation and include_relations:
            return {
                "data": SubmissionWithRelations.model_validate(submission),
                "status": "success"
            }
        elif include_evaluation:
            return {
                "data": SubmissionWithEvaluation.model_validate(submission),
                "status": "success"
            }
        else:
            return {
                "data": SubmissionRead.model_validate(submission),
                "status": "success"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch submission: {str(e)}"
        )


@router.put("/{submission_id}", response_model=dict)
async def update_submission(
    submission_id: int,
    submission_data: SubmissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(Submission).options(selectinload(Submission.task), selectinload(Submission.task).selectinload(Task.lesson)).where(Submission.id == submission_id)
        )
        submission = result.scalar_one_or_none()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        # Ownership check: student = own submission, teacher = task's lesson, admin = any
        if current_user.role == UserRole.STUDENT:
            if submission.student_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only update your own submissions")
        elif current_user.role == UserRole.TEACHER:
            if submission.task.lesson.teacher_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only update submissions for your tasks")
        # admin: no extra check

        if submission.task.deadline_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot update submission after task deadline"
            )

        update_data = submission_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(submission, field, value)

        await db.commit()
        await db.refresh(submission)

        if 'code' in submission_data.model_dump(exclude_unset=True):
            calc_ai_similarity_task.delay(submission.id)

        return {
            "data": SubmissionRead.model_validate(submission),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update submission: {str(e)}"
        )


@router.delete("/{submission_id}", response_model=dict)
async def delete_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = await db.execute(
            select(Submission).options(
                selectinload(Submission.task).selectinload(Task.lesson),
                selectinload(Submission.evaluation)
            ).where(Submission.id == submission_id)
        )
        submission = result.scalar_one_or_none()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )

        # Ownership check (submission.task.lesson loaded via selectinload above)
        if current_user.role == UserRole.STUDENT:
            if submission.student_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only delete your own submissions")
        elif current_user.role == UserRole.TEACHER and submission.task.lesson:
            if submission.task.lesson.teacher_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only delete submissions for your tasks")

        if submission.task.deadline_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot delete submission after task deadline"
            )

        if submission.evaluation:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete submission that has been evaluated"
            )

        await db.delete(submission)
        await db.commit()

        return {
            "data": {"message": f"Submission {submission_id} deleted successfully"},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete submission: {str(e)}"
        )


@router.get("/task/{task_id}/stats", response_model=dict)
async def get_task_submission_stats(
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
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        # Teacher can only view stats for their own tasks
        if current_user.role == UserRole.TEACHER and task.lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only view stats for your tasks")

        total_submissions = await db.execute(
            select(func.count(Submission.id)).where(Submission.task_id == task_id)
        )
        total = total_submissions.scalar()

        evaluated_submissions = await db.execute(
            select(func.count(Submission.id))
            .select_from(Submission)
            .join(Submission.evaluation)
            .where(Submission.task_id == task_id)
        )
        evaluated = evaluated_submissions.scalar()

        late_submissions = await db.execute(
            select(func.count(Submission.id))
            .where(
                Submission.task_id == task_id,
                Submission.created_at > task.deadline_at
            )
        )
        late = late_submissions.scalar()

        return {
            "data": SubmissionStats(
                task_id=task_id,
                total_submissions=total,
                evaluated_submissions=evaluated,
                pending_evaluations=total - evaluated,
                late_submissions=late,
                on_time_submissions=total - late
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch submission stats: {str(e)}"
        )