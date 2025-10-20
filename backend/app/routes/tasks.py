"""
EduCode Backend - Task Routes

FastAPI routes for Task CRUD operations.
Handles programming task management for lessons.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, admin_required, require_roles
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.submission import Submission
from app.models.ai_solution import AISolution
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate, TaskList, TaskWithSubmissions, TaskWithRelations
from app.tasks.ai_tasks import generate_ai_solutions_task, grade_task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/", response_model=dict)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Create a new programming task.
    
    Teachers can only create tasks for their own lessons.
    
    - **lesson_id**: Lesson ID (foreign key)
    - **title**: Task title
    - **body**: Task description and requirements
    - **language**: Programming language (python/javascript/java/cpp/csharp)
    - **deadline_at**: Task deadline (ISO format)
    """
    try:
        # Verify the lesson belongs to the current teacher
        lesson = await db.execute(select(Lesson).where(Lesson.id == task_data.lesson_id))
        lesson = lesson.scalar_one_or_none()
        
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only create tasks for your own lessons")
        
        # Create new task
        task = Task(**task_data.model_dump())
        db.add(task)
        await db.commit()
        await db.refresh(task)

        # FIXED: Manually construct TaskRead without removed fields (submission_count, has_ai_solutions)
        # Safe properties (is_expired, is_active, time_remaining) are computed from task model
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


@router.get("/", response_model=dict)
async def get_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    lesson_id: Optional[int] = Query(None, description="Filter by lesson"),
    language: Optional[str] = Query(None, description="Filter by programming language"),
    active_only: bool = Query(False, description="Show only active (non-expired) tasks"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get tasks with pagination and filtering.
    
    Teachers can only see tasks from their own lessons.
    Students can see tasks from lessons they have access to.
    Admins can see all tasks.
    """
    try:
        # Build base query
        query = select(Task).options(selectinload(Task.lesson))
        
        # Apply role-based filtering
        if current_user.role == "teacher":
            # Teachers can only see tasks from their own lessons
            query = query.join(Lesson).where(Lesson.teacher_id == current_user.id)
        elif current_user.role == "student":
            # Students can see tasks from lessons they have access to
            # For now, allow all tasks - can be refined based on group/enrollment logic
            pass
        # Admins can see all tasks (no additional filtering)
        
        # Apply filters
        if lesson_id:
            if current_user.role == "teacher":
                # Verify teacher owns the lesson
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
        
        # Get total count
        count_query = select(func.count(Task.id))
        if lesson_id:
            count_query = count_query.where(Task.lesson_id == lesson_id)
        if language:
            count_query = count_query.where(Task.language == language)
        if active_only:
            count_query = count_query.where(Task.deadline_at > datetime.now(timezone.utc))
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
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
    """
    Get a specific task by ID.
    
    - **task_id**: Task ID
    - **include_submissions**: Whether to include submissions in the response
    - **include_relations**: Whether to include lesson details
    """
    try:
        query = select(Task)
        
        if include_submissions and include_relations:
            query = query.options(
                selectinload(Task.submissions),
                selectinload(Task.lesson)
            )
        elif include_submissions:
            query = query.options(selectinload(Task.submissions))
        elif include_relations:
            query = query.options(selectinload(Task.lesson))
        
        query = query.where(Task.id == task_id)
        result = await db.execute(query)
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        if include_submissions and include_relations:
            return {
                "data": TaskWithRelations.model_validate(task),
                "status": "success"
            }
        elif include_submissions:
            return {
                "data": TaskWithSubmissions.model_validate(task),
                "status": "success"
            }
        else:
            return {
                "data": TaskRead.model_validate(task),
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
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Update a task.
    
    Only admins and teachers can update tasks.
    Teachers can only update their own tasks.
    """
    try:
        # Get existing task with lesson information
        result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check teacher permissions
        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only update your own tasks"
            )
        
        # Check if task has submissions and deadline is being moved earlier
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
        
        # Update task fields
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
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Delete a task.
    
    Only admins and teachers can delete tasks.
    Teachers can only delete their own tasks.
    """
    try:
        # Get existing task with lesson information
        result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check teacher permissions
        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only delete your own tasks"
            )
        # Check if task has submissions
        submissions_result = await db.execute(
            select(func.count(Submission.id)).where(Submission.task_id == task_id)
        )
        submission_count = submissions_result.scalar()
        
        if submission_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete task with {submission_count} submissions. Archive instead."
            )
        
        # Check if task has AI solutions
        ai_solutions_result = await db.execute(
            select(func.count(AISolution.id)).where(AISolution.task_id == task_id)
        )
        ai_solution_count = ai_solutions_result.scalar()
        
        if ai_solution_count > 0:
            # Delete AI solutions first
            ai_solutions = await db.execute(
                select(AISolution).where(AISolution.task_id == task_id)
            )
            for ai_solution in ai_solutions.scalars():
                await db.delete(ai_solution)
        
        # Delete the task (already retrieved above)
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
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Get AI solutions for a specific task.
    
    Only admins and teachers can view AI solutions.
    Teachers can only view AI solutions for their own tasks.
    """
    try:
        # Check if task exists and verify permissions
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check teacher permissions
        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view AI solutions for your own tasks"
            )
        
        # Get AI solutions
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


@router.post("/{task_id}/prepare-ai", response_model=dict)
async def prepare_ai_solutions(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Generate AI reference solutions for a task.
    
    Triggers Celery task to generate 4 AI solutions:
    - 3 from OpenAI (ChatGPT) with different approaches
    - 1 from Anthropic (Claude)
    
    Only admins and teachers can trigger AI solution generation.
    Teachers can only generate solutions for their own tasks.
    """
    try:
        # Check if task exists and verify permissions
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check teacher permissions
        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only generate AI solutions for your own tasks"
            )
        
        # Check if AI solutions already exist
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
        
        # Trigger AI solution generation
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
    current_user: User = Depends(require_roles(["admin", "teacher"]))
):
    """
    Grade all submissions for a task using AI evaluation.
    
    Calculates:
    - AI similarity (comparison with AI reference solutions)
    - Intra-group similarity (comparison among student submissions)
    - Final grade using ChatGPT evaluation (1-100 scale)
    
    Only admins and teachers can trigger grading.
    Teachers can only grade submissions for their own tasks.
    """
    try:
        # Check if task exists and verify permissions
        task_result = await db.execute(
            select(Task).join(Lesson).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check teacher permissions
        if current_user.role == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only grade submissions for your own tasks"
            )
        
        # Check if task has submissions
        submissions_result = await db.execute(
            select(func.count(Submission.id)).where(Submission.task_id == task_id)
        )
        submission_count = submissions_result.scalar()
        
        if submission_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No submissions found for this task"
            )
        
        # Check if AI solutions exist
        ai_solutions_result = await db.execute(
            select(func.count(AISolution.id)).where(AISolution.task_id == task_id)
        )
        ai_solution_count = ai_solutions_result.scalar()
        
        if ai_solution_count == 0:
            raise HTTPException(
                status_code=400,
                detail="No AI solutions found. Please run /prepare-ai first"
            )
        
        # Check if already graded
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
        
        # Trigger grading task
        grading_task_result = grade_task.delay(task_id)
        
        return {
            "data": {
                "message": f"Grading started for task {task_id}",
                "task_id": task_id,
                "submissions_to_grade": submission_count,
                "celery_task_id": grading_task_result.id,
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