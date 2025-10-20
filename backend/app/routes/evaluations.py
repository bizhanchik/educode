"""
EduCode Backend - Evaluation Routes

FastAPI routes for Evaluation CRUD operations.
Handles AI grading results and similarity metrics management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, admin_required, require_roles
from app.models.evaluation import Evaluation
from app.models.submission import Submission
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.user import User
from app.schemas.evaluation import (
    EvaluationCreate, EvaluationRead, EvaluationUpdate, EvaluationList,
    EvaluationWithSubmission, EvaluationStats, TaskEvaluationSummary
)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


@router.post("/", response_model=dict)
async def create_evaluation(
    evaluation_data: EvaluationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new evaluation for a submission.
    
    - **submission_id**: Submission ID (foreign key)
    - **ai_similarity**: AI similarity score (0.0-1.0)
    - **intra_group_similarity**: Intra-group similarity score (0.0-1.0)
    - **final_score**: Final grade (1-100)
    - **rationale**: AI-generated rationale for the grade
    """
    try:
        # Check if submission exists
        submission_result = await db.execute(
            select(Submission).where(Submission.id == evaluation_data.submission_id)
        )
        submission = submission_result.scalar_one_or_none()
        
        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Submission not found"
            )
        
        # Check if evaluation already exists for this submission
        existing_evaluation = await db.execute(
            select(Evaluation).where(Evaluation.submission_id == evaluation_data.submission_id)
        )
        if existing_evaluation.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Evaluation already exists for this submission"
            )
        
        # Create new evaluation
        evaluation = Evaluation(**evaluation_data.model_dump())
        db.add(evaluation)
        await db.commit()
        await db.refresh(evaluation)
        
        return {
            "data": EvaluationRead.model_validate(evaluation),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create evaluation: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_evaluations(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    task_id: Optional[int] = Query(None, description="Filter by task"),
    min_score: Optional[int] = Query(None, ge=1, le=100, description="Minimum final score"),
    max_score: Optional[int] = Query(None, ge=1, le=100, description="Maximum final score"),
    suspicious_only: Optional[bool] = Query(False, description="Show only suspicious evaluations"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated list of evaluations with optional filtering.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of evaluations per page
    - **task_id**: Filter by task ID
    - **min_score**: Minimum final score filter
    - **max_score**: Maximum final score filter
    - **suspicious_only**: Show only evaluations with high similarity scores
    """
    try:
        # Role-based access control
        if current_user.role.value == "student":
            # Students can only view evaluations for their own submissions
            query = select(Evaluation).options(
                selectinload(Evaluation.submission).selectinload(Submission.task),
                selectinload(Evaluation.submission).selectinload(Submission.student)
            ).join(Evaluation.submission).where(Submission.student_id == current_user.id)
            
            # Apply filters for students
            if task_id:
                query = query.where(Submission.task_id == task_id)
            if min_score is not None:
                query = query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                query = query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                query = query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
            
            # Count query for students
            count_query = select(func.count(Evaluation.id)).select_from(Evaluation).join(Evaluation.submission).where(Submission.student_id == current_user.id)
            if task_id:
                count_query = count_query.where(Submission.task_id == task_id)
            if min_score is not None:
                count_query = count_query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                count_query = count_query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                count_query = count_query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
                
        elif current_user.role.value == "teacher":
            # Teachers can only view evaluations for tasks in their lessons
            query = select(Evaluation).options(
                selectinload(Evaluation.submission).selectinload(Submission.task),
                selectinload(Evaluation.submission).selectinload(Submission.student)
            ).join(Evaluation.submission).join(Submission.task).join(Task.lesson).where(Lesson.teacher_id == current_user.id)
            
            # Apply filters for teachers
            if task_id:
                # Verify teacher owns the lesson for this task
                task_result = await db.execute(
                    select(Task).join(Task.lesson).where(Task.id == task_id, Lesson.teacher_id == current_user.id)
                )
                if not task_result.scalar_one_or_none():
                    raise HTTPException(status_code=403, detail="Access denied to this task")
                query = query.where(Submission.task_id == task_id)
            if min_score is not None:
                query = query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                query = query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                query = query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
            
            # Count query for teachers
            count_query = select(func.count(Evaluation.id)).select_from(Evaluation).join(Evaluation.submission).join(Submission.task).join(Task.lesson).where(Lesson.teacher_id == current_user.id)
            if task_id:
                count_query = count_query.where(Submission.task_id == task_id)
            if min_score is not None:
                count_query = count_query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                count_query = count_query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                count_query = count_query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
                
        else:  # admin
            # Admins can view all evaluations
            query = select(Evaluation).options(
                selectinload(Evaluation.submission).selectinload(Submission.task),
                selectinload(Evaluation.submission).selectinload(Submission.student)
            )
            
            if task_id:
                query = query.join(Evaluation.submission).where(Submission.task_id == task_id)
            if min_score is not None:
                query = query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                query = query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                query = query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
            
            # Count query for admins
            count_query = select(func.count(Evaluation.id))
            if task_id:
                count_query = count_query.select_from(Evaluation).join(Evaluation.submission).where(Submission.task_id == task_id)
            if min_score is not None:
                count_query = count_query.where(Evaluation.final_score >= min_score)
            if max_score is not None:
                count_query = count_query.where(Evaluation.final_score <= max_score)
            if suspicious_only:
                count_query = count_query.where(
                    (Evaluation.ai_similarity > 0.8) | 
                    (Evaluation.intra_group_similarity > 0.8)
                )
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(Evaluation.created_at.desc())
        
        result = await db.execute(query)
        evaluations = result.scalars().all()
        
        return {
            "data": EvaluationList(
                evaluations=[EvaluationRead.model_validate(evaluation) for evaluation in evaluations],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch evaluations: {str(e)}"
        )


@router.get("/{evaluation_id}", response_model=dict)
async def get_evaluation(
    evaluation_id: int,
    include_submission: bool = Query(False, description="Include submission details"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific evaluation by ID.
    
    - **evaluation_id**: Evaluation ID
    - **include_submission**: Whether to include submission details in the response
    """
    try:
        query = select(Evaluation)
        
        if include_submission:
            query = query.options(
                selectinload(Evaluation.submission).selectinload(Submission.task).selectinload(Task.lesson),
                selectinload(Evaluation.submission).selectinload(Submission.student)
            )
        else:
            query = query.options(
                selectinload(Evaluation.submission).selectinload(Submission.task).selectinload(Task.lesson),
                selectinload(Evaluation.submission).selectinload(Submission.student)
            )
        
        query = query.where(Evaluation.id == evaluation_id)
        result = await db.execute(query)
        evaluation = result.scalar_one_or_none()
        
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluation not found"
            )
        
        # Role-based access control
        if current_user.role == "student":
            # Students can only view their own evaluations
            if evaluation.submission.student_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You can only view your own evaluations"
                )
        elif current_user.role == "teacher":
            # Teachers can only view evaluations for tasks in their lessons
            if evaluation.submission.task.lesson.teacher_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You can only view evaluations for your own tasks"
                )
        # Admins can view any evaluation (no additional check needed)
        
        if include_submission:
            return {
                "data": EvaluationWithSubmission.model_validate(evaluation),
                "status": "success"
            }
        else:
            return {
                "data": EvaluationRead.model_validate(evaluation),
                "status": "success"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch evaluation: {str(e)}"
        )


@router.put("/{evaluation_id}", response_model=dict)
async def update_evaluation(
    evaluation_id: int,
    evaluation_data: EvaluationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """
    Update an evaluation (typically used for manual grade adjustments).
    
    - **evaluation_id**: Evaluation ID
    - **final_score**: Updated final score
    - **rationale**: Updated rationale
    """
    try:
        # Get existing evaluation
        result = await db.execute(select(Evaluation).where(Evaluation.id == evaluation_id))
        evaluation = result.scalar_one_or_none()
        
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluation not found"
            )
        
        # Update evaluation fields
        update_data = evaluation_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(evaluation, field, value)
        
        await db.commit()
        await db.refresh(evaluation)
        
        return {
            "data": EvaluationRead.model_validate(evaluation),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update evaluation: {str(e)}"
        )


@router.delete("/{evaluation_id}", response_model=dict)
async def delete_evaluation(
    evaluation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """
    Delete an evaluation (use with caution).
    
    - **evaluation_id**: Evaluation ID
    """
    try:
        # Get existing evaluation
        result = await db.execute(select(Evaluation).where(Evaluation.id == evaluation_id))
        evaluation = result.scalar_one_or_none()
        
        if not evaluation:
            raise HTTPException(
                status_code=404,
                detail="Evaluation not found"
            )
        
        await db.delete(evaluation)
        await db.commit()
        
        return {
            "data": {"message": f"Evaluation {evaluation_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete evaluation: {str(e)}"
        )


@router.get("/task/{task_id}/summary", response_model=dict)
async def get_task_evaluation_summary(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get evaluation summary statistics for a specific task.
    
    - **task_id**: Task ID
    """
    try:
        # Check if task exists and load lesson for role-based access control
        task_result = await db.execute(
            select(Task).options(selectinload(Task.lesson)).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Role-based access control
        if current_user.role == "student":
            # Students cannot access task evaluation summaries
            raise HTTPException(
                status_code=403,
                detail="Access denied: Students cannot view task evaluation summaries"
            )
        elif current_user.role == "teacher":
            # Teachers can only view summaries for their own tasks
            if task.lesson.teacher_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You can only view summaries for your own tasks"
                )
        # Admins can view any task summary (no additional check needed)
        
        # Get evaluation statistics
        evaluations_query = select(Evaluation).join(Evaluation.submission).where(Submission.task_id == task_id)
        evaluations_result = await db.execute(evaluations_query)
        evaluations = evaluations_result.scalars().all()
        
        if not evaluations:
            return {
                "data": TaskEvaluationSummary(
                    task_id=task_id,
                    total_evaluations=0,
                    average_score=0.0,
                    average_ai_similarity=0.0,
                    average_group_similarity=0.0,
                    suspicious_count=0,
                    grade_distribution={}
                ),
                "status": "success"
            }
        
        # Calculate statistics
        total_evaluations = len(evaluations)
        average_score = sum(e.final_score for e in evaluations) / total_evaluations
        average_ai_similarity = sum(e.ai_similarity for e in evaluations) / total_evaluations
        average_group_similarity = sum(e.intra_group_similarity for e in evaluations) / total_evaluations
        
        # Count suspicious evaluations (high similarity)
        suspicious_count = sum(
            1 for e in evaluations 
            if e.ai_similarity > 0.8 or e.intra_group_similarity > 0.8
        )
        
        # Grade distribution
        grade_distribution = {}
        for evaluation in evaluations:
            grade_letter = evaluation.grade_letter
            grade_distribution[grade_letter] = grade_distribution.get(grade_letter, 0) + 1
        
        return {
            "data": TaskEvaluationSummary(
                task_id=task_id,
                total_evaluations=total_evaluations,
                average_score=round(average_score, 2),
                average_ai_similarity=round(average_ai_similarity, 3),
                average_group_similarity=round(average_group_similarity, 3),
                suspicious_count=suspicious_count,
                grade_distribution=grade_distribution
            ),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch evaluation summary: {str(e)}"
        )


@router.get("/stats/global", response_model=dict)
async def get_global_evaluation_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_required)
):
    """
    Get global evaluation statistics across all tasks.
    """
    try:
        # Get all evaluations
        evaluations_result = await db.execute(select(Evaluation))
        evaluations = evaluations_result.scalars().all()
        
        if not evaluations:
            return {
                "data": EvaluationStats(
                    total_evaluations=0,
                    average_score=0.0,
                    average_ai_similarity=0.0,
                    average_group_similarity=0.0,
                    high_ai_similarity_count=0,
                    high_group_similarity_count=0,
                    suspicious_evaluations=0
                ),
                "status": "success"
            }
        
        # Calculate global statistics
        total_evaluations = len(evaluations)
        average_score = sum(e.final_score for e in evaluations) / total_evaluations
        average_ai_similarity = sum(e.ai_similarity for e in evaluations) / total_evaluations
        average_group_similarity = sum(e.intra_group_similarity for e in evaluations) / total_evaluations
        
        high_ai_similarity_count = sum(1 for e in evaluations if e.ai_similarity > 0.8)
        high_group_similarity_count = sum(1 for e in evaluations if e.intra_group_similarity > 0.8)
        suspicious_evaluations = sum(
            1 for e in evaluations 
            if e.ai_similarity > 0.8 or e.intra_group_similarity > 0.8
        )
        
        return {
            "data": EvaluationStats(
                total_evaluations=total_evaluations,
                average_score=round(average_score, 2),
                average_ai_similarity=round(average_ai_similarity, 3),
                average_group_similarity=round(average_group_similarity, 3),
                high_ai_similarity_count=high_ai_similarity_count,
                high_group_similarity_count=high_group_similarity_count,
                suspicious_evaluations=suspicious_evaluations
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch global evaluation stats: {str(e)}"
        )