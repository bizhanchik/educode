"""
EduCode Backend - Submission Routes

FastAPI routes for Submission CRUD operations.
Handles student code submission management and AI similarity calculation.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, student_required, teacher_required, admin_required, require_roles
from app.models.submission import Submission
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.submission import (
    SubmissionCreate, SubmissionRead, SubmissionUpdate, SubmissionList,
    SubmissionWithEvaluation, SubmissionWithRelations, SubmissionStats
)
from app.tasks.ai_tasks import calc_ai_similarity_task

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.post("/", response_model=dict)
async def create_submission(
    submission_data: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    """
    Create a new code submission.
    
    Students can only submit code for tasks and auto-set their student_id.
    
    - **task_id**: Task ID (foreign key)
    - **code**: Student's code solution
    """
    try:
        # Check if task exists and is not expired
        task_result = await db.execute(select(Task).where(Task.id == submission_data.task_id))
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check if task deadline has passed
        if task.deadline_at and datetime.now(timezone.utc) > task.deadline_at:
            raise HTTPException(
                status_code=400,
                detail="Task deadline has passed"
            )
        
        # Check if student already has a submission for this task
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
        
        # Auto-set student_id to current user
        submission_dict = submission_data.model_dump()
        submission_dict["student_id"] = current_user.id
        
        # Create new submission
        submission = Submission(**submission_dict)
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        # Trigger AI similarity calculation task
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


@router.get("/", response_model=dict)
async def get_submissions(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    task_id: Optional[int] = Query(None, description="Filter by task"),
    student_id: Optional[int] = Query(None, description="Filter by student"),
    has_evaluation: Optional[bool] = Query(None, description="Filter by evaluation status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get submissions with pagination and filtering.
    
    Students can only see their own submissions.
    Teachers can see submissions for tasks in their lessons.
    Admins can see all submissions.
    """
    try:
        # Build base query
        query = select(Submission).options(
            selectinload(Submission.task),
            selectinload(Submission.student)
        )
        
        # Apply role-based filtering
        if current_user.role == "student":
            # Students can only see their own submissions
            query = query.where(Submission.student_id == current_user.id)
        elif current_user.role == "teacher":
            # Teachers can see submissions for tasks in their lessons
            query = query.join(Task).join(Lesson).where(Lesson.teacher_id == current_user.id)
        # Admins can see all submissions (no additional filtering)
        
        # Apply filters
        if task_id:
            if current_user.role == "teacher":
                # Verify teacher owns the lesson containing this task
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
            # Only admins and teachers can filter by student_id
            if current_user.role == "student":
                raise HTTPException(status_code=403, detail="Students cannot filter by student ID")
            query = query.where(Submission.student_id == student_id)
        if has_evaluation is not None:
            if has_evaluation:
                query = query.join(Submission.evaluation)
            else:
                query = query.where(~Submission.evaluation.has())
        
        # Get total count with same filters
        count_query = select(func.count(Submission.id))
        
        # Apply same role-based filtering to count
        if current_user.role == "student":
            count_query = count_query.where(Submission.student_id == current_user.id)
        elif current_user.role == "teacher":
            count_query = count_query.select_from(Submission).join(Task).join(Lesson).where(Lesson.teacher_id == current_user.id)
        
        if task_id:
            count_query = count_query.where(Submission.task_id == task_id)
        if student_id and current_user.role != "student":
            count_query = count_query.where(Submission.student_id == student_id)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
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
    """
    Get a specific submission by ID.
    
    Students can only view their own submissions.
    Teachers can view submissions for tasks in their lessons.
    Admins can view any submission.
    """
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
        
        # Check access permissions
        if current_user.role == "student":
            # Students can only view their own submissions
            if submission.student_id != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied: You can only view your own submissions")
        elif current_user.role == "teacher":
            # Teachers can view submissions for tasks in their lessons
            task_check = await db.execute(
                select(Task).join(Lesson).where(
                    Task.id == submission.task_id,
                    Lesson.teacher_id == current_user.id
                )
            )
            if not task_check.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Access denied: Submission not in your lessons")
        # Admins can view any submission (no additional check needed)
        
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
    db: AsyncSession = Depends(get_db)
):
    """
    Update a submission (only code can be updated before deadline).
    
    - **submission_id**: Submission ID
    - **code**: Updated code solution
    """
    try:
        # Get existing submission with task
        result = await db.execute(
            select(Submission).options(selectinload(Submission.task)).where(Submission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        
        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )
        
        # Check if task deadline has passed
        if submission.task.deadline_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot update submission after task deadline"
            )
        
        # Update submission fields
        update_data = submission_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(submission, field, value)
        
        await db.commit()
        await db.refresh(submission)
        
        # Trigger AI similarity recalculation if code was updated
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
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a submission (only allowed before deadline and if no evaluation exists).
    
    - **submission_id**: Submission ID
    """
    try:
        # Get existing submission with task and evaluation
        result = await db.execute(
            select(Submission).options(
                selectinload(Submission.task),
                selectinload(Submission.evaluation)
            ).where(Submission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        
        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )
        
        # Check if task deadline has passed
        if submission.task.deadline_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="Cannot delete submission after task deadline"
            )
        
        # Check if submission has evaluation
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
    db: AsyncSession = Depends(get_db)
):
    """
    Get submission statistics for a specific task.
    
    - **task_id**: Task ID
    """
    try:
        # Check if task exists
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Get submission statistics
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