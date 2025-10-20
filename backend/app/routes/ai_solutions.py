"""
EduCode Backend - AI Solution Routes

FastAPI routes for AI Solution CRUD operations.
Handles AI-generated reference solutions management.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.ai_solution import AISolution, AIProvider
from app.models.task import Task
from app.schemas.ai_solution import (
    AISolutionCreate, AISolutionRead, AISolutionUpdate, AISolutionList,
    AISolutionWithTask, TaskAISolutionSummary
)

router = APIRouter(prefix="/api/ai-solutions", tags=["ai-solutions"])


@router.post("/", response_model=dict)
async def create_ai_solution(
    ai_solution_data: AISolutionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new AI-generated solution.
    
    - **task_id**: Task ID (foreign key)
    - **provider**: AI provider (OpenAI or Anthropic)
    - **variant_index**: Solution variant index (1-4)
    - **code**: AI-generated code solution
    - **meta**: JSON metadata (model, prompt, tokens, etc.)
    """
    try:
        # Check if task exists
        task_result = await db.execute(select(Task).where(Task.id == ai_solution_data.task_id))
        task = task_result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        
        # Check if AI solution already exists for this task, provider, and variant
        existing_solution = await db.execute(
            select(AISolution).where(
                AISolution.task_id == ai_solution_data.task_id,
                AISolution.provider == ai_solution_data.provider,
                AISolution.variant_index == ai_solution_data.variant_index
            )
        )
        if existing_solution.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"AI solution already exists for task {ai_solution_data.task_id}, "
                       f"provider {ai_solution_data.provider.value}, variant {ai_solution_data.variant_index}"
            )
        
        # Create new AI solution
        ai_solution = AISolution(**ai_solution_data.model_dump())
        db.add(ai_solution)
        await db.commit()
        await db.refresh(ai_solution)
        
        return {
            "data": AISolutionRead.model_validate(ai_solution),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create AI solution: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_ai_solutions(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    task_id: Optional[int] = Query(None, description="Filter by task"),
    provider: Optional[AIProvider] = Query(None, description="Filter by AI provider"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of AI solutions with optional filtering.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of AI solutions per page
    - **task_id**: Filter by task ID
    - **provider**: Filter by AI provider (OpenAI or Anthropic)
    """
    try:
        # Build query with filters
        query = select(AISolution).options(selectinload(AISolution.task))
        
        if task_id:
            query = query.where(AISolution.task_id == task_id)
        if provider:
            query = query.where(AISolution.provider == provider)
        
        # Get total count
        count_query = select(func.count(AISolution.id))
        if task_id:
            count_query = count_query.where(AISolution.task_id == task_id)
        if provider:
            count_query = count_query.where(AISolution.provider == provider)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(
            AISolution.task_id.asc(),
            AISolution.provider.asc(),
            AISolution.variant_index.asc()
        )
        
        result = await db.execute(query)
        ai_solutions = result.scalars().all()
        
        return {
            "data": AISolutionList(
                ai_solutions=[AISolutionRead.model_validate(solution) for solution in ai_solutions],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch AI solutions: {str(e)}"
        )


@router.get("/{ai_solution_id}", response_model=dict)
async def get_ai_solution(
    ai_solution_id: int,
    include_task: bool = Query(False, description="Include task details"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific AI solution by ID.
    
    - **ai_solution_id**: AI Solution ID
    - **include_task**: Whether to include task details in the response
    """
    try:
        query = select(AISolution)
        
        if include_task:
            query = query.options(selectinload(AISolution.task))
        
        query = query.where(AISolution.id == ai_solution_id)
        result = await db.execute(query)
        ai_solution = result.scalar_one_or_none()
        
        if not ai_solution:
            raise HTTPException(
                status_code=404,
                detail="AI solution not found"
            )
        
        if include_task:
            return {
                "data": AISolutionWithTask.model_validate(ai_solution),
                "status": "success"
            }
        else:
            return {
                "data": AISolutionRead.model_validate(ai_solution),
                "status": "success"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch AI solution: {str(e)}"
        )


@router.put("/{ai_solution_id}", response_model=dict)
async def update_ai_solution(
    ai_solution_id: int,
    ai_solution_data: AISolutionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update an AI solution (typically used for regenerating solutions).
    
    - **ai_solution_id**: AI Solution ID
    - **code**: Updated code solution
    - **meta**: Updated metadata
    """
    try:
        # Get existing AI solution
        result = await db.execute(select(AISolution).where(AISolution.id == ai_solution_id))
        ai_solution = result.scalar_one_or_none()
        
        if not ai_solution:
            raise HTTPException(
                status_code=404,
                detail="AI solution not found"
            )
        
        # Update AI solution fields
        update_data = ai_solution_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ai_solution, field, value)
        
        await db.commit()
        await db.refresh(ai_solution)
        
        return {
            "data": AISolutionRead.model_validate(ai_solution),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update AI solution: {str(e)}"
        )


@router.delete("/{ai_solution_id}", response_model=dict)
async def delete_ai_solution(
    ai_solution_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an AI solution.
    
    - **ai_solution_id**: AI Solution ID
    """
    try:
        # Get existing AI solution
        result = await db.execute(select(AISolution).where(AISolution.id == ai_solution_id))
        ai_solution = result.scalar_one_or_none()
        
        if not ai_solution:
            raise HTTPException(
                status_code=404,
                detail="AI solution not found"
            )
        
        await db.delete(ai_solution)
        await db.commit()
        
        return {
            "data": {"message": f"AI solution {ai_solution_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete AI solution: {str(e)}"
        )


@router.get("/task/{task_id}/summary", response_model=dict)
async def get_task_ai_solution_summary(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get AI solution summary for a specific task.
    
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
        
        # Get AI solutions for this task
        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        ai_solutions = ai_solutions_result.scalars().all()
        
        # Count by provider
        openai_count = sum(1 for sol in ai_solutions if sol.provider == AIProvider.OPENAI)
        anthropic_count = sum(1 for sol in ai_solutions if sol.provider == AIProvider.ANTHROPIC)
        
        # Calculate average code length
        avg_code_length = 0
        if ai_solutions:
            avg_code_length = sum(len(sol.code) for sol in ai_solutions) / len(ai_solutions)
        
        return {
            "data": TaskAISolutionSummary(
                task_id=task_id,
                total_solutions=len(ai_solutions),
                openai_solutions=openai_count,
                anthropic_solutions=anthropic_count,
                average_code_length=round(avg_code_length),
                has_complete_set=len(ai_solutions) >= 4  # 3 OpenAI + 1 Anthropic
            ),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch AI solution summary: {str(e)}"
        )


@router.post("/task/{task_id}/generate", response_model=dict)
async def generate_ai_solutions_for_task(
    task_id: int,
    regenerate: bool = Query(False, description="Regenerate existing solutions"),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger AI solution generation for a specific task.
    
    - **task_id**: Task ID
    - **regenerate**: Whether to regenerate existing solutions
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
        
        # Check if AI solutions already exist
        existing_solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        existing_count = len(existing_solutions.scalars().all())
        
        if existing_count > 0 and not regenerate:
            raise HTTPException(
                status_code=400,
                detail=f"AI solutions already exist for task {task_id}. Use regenerate=true to overwrite."
            )
        
        # TODO: Trigger Celery task for AI solution generation
        # celery_app.send_task('generate_ai_solutions', args=[task_id, regenerate])
        
        return {
            "data": {
                "message": f"AI solution generation triggered for task {task_id}",
                "task_id": task_id,
                "regenerate": regenerate,
                "existing_solutions": existing_count
            },
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger AI solution generation: {str(e)}"
        )


@router.delete("/task/{task_id}/all", response_model=dict)
async def delete_all_ai_solutions_for_task(
    task_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all AI solutions for a specific task.
    
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
        
        # Get all AI solutions for this task
        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        ai_solutions = ai_solutions_result.scalars().all()
        
        # Delete all AI solutions
        for solution in ai_solutions:
            await db.delete(solution)
        
        await db.commit()
        
        return {
            "data": {
                "message": f"Deleted {len(ai_solutions)} AI solutions for task {task_id}",
                "task_id": task_id,
                "deleted_count": len(ai_solutions)
            },
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete AI solutions: {str(e)}"
        )