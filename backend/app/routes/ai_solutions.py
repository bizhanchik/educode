from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_or_admin_required
from app.models.ai_solution import AISolution, AIProvider
from app.models.task import Task
from app.models.user import User
from app.schemas.ai_solution import (
    AISolutionCreate, AISolutionRead, AISolutionUpdate, AISolutionList,
    AISolutionWithTask, TaskAISolutionSummary
)

router = APIRouter(prefix="/api/ai-solutions", tags=["ai-solutions"])


@router.post("", response_model=dict)
async def create_ai_solution(
    ai_solution_data: AISolutionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(select(Task).where(Task.id == ai_solution_data.task_id))
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

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


@router.get("", response_model=dict)
async def get_ai_solutions(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    task_id: Optional[int] = Query(None, description="Filter by task"),
    provider: Optional[AIProvider] = Query(None, description="Filter by AI provider"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    try:
        query = select(AISolution).options(selectinload(AISolution.task))

        if task_id:
            query = query.where(AISolution.task_id == task_id)
        if provider:
            query = query.where(AISolution.provider == provider)

        count_query = select(func.count(AISolution.id))
        if task_id:
            count_query = count_query.where(AISolution.task_id == task_id)
        if provider:
            count_query = count_query.where(AISolution.provider == provider)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        result = await db.execute(select(AISolution).where(AISolution.id == ai_solution_id))
        ai_solution = result.scalar_one_or_none()

        if not ai_solution:
            raise HTTPException(
                status_code=404,
                detail="AI solution not found"
            )

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        ai_solutions = ai_solutions_result.scalars().all()

        openai_count = sum(1 for sol in ai_solutions if sol.provider == AIProvider.OPENAI)
        anthropic_count = sum(1 for sol in ai_solutions if sol.provider == AIProvider.ANTHROPIC)

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
                has_complete_set=len(ai_solutions) >= 4
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        existing_solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        existing_count = len(existing_solutions.scalars().all())

        if existing_count > 0 and not regenerate:
            raise HTTPException(
                status_code=400,
                detail=f"AI solutions already exist for task {task_id}. Use regenerate=true to overwrite."
            )

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):

    try:
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )

        ai_solutions_result = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        ai_solutions = ai_solutions_result.scalars().all()

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