"""
EduCode Backend - Subject Routes

FastAPI routes for Subject CRUD operations.
Handles academic subject management for organizing lessons.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.subject import Subject
from app.models.lesson import Lesson
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate, SubjectList, SubjectWithLessons

router = APIRouter(tags=["subjects"])


@router.post("/", response_model=dict)
async def create_subject(
    subject_data: SubjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new subject.
    
    - **name**: Subject name (e.g., "Algorithms", "Object-Oriented Programming")
    """
    try:
        # Check if subject name already exists
        existing_subject = await db.execute(
            select(Subject).where(Subject.name == subject_data.name)
        )
        if existing_subject.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Subject name already exists"
            )
        
        # Create new subject
        subject = Subject(**subject_data.model_dump())
        db.add(subject)
        await db.commit()
        await db.refresh(subject)
        
        return {
            "data": SubjectRead.model_validate(subject),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create subject: {str(e)}"
        )


@router.get("/", response_model=dict)
async def get_subjects(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of subjects.
    
    - **page**: Page number (starts from 1)
    - **size**: Number of subjects per page
    """
    try:
        # Get total count
        count_result = await db.execute(select(func.count(Subject.id)))
        total = count_result.scalar()
        
        # Get paginated results
        offset = (page - 1) * size
        query = select(Subject).offset(offset).limit(size).order_by(Subject.created_at.desc())
        
        result = await db.execute(query)
        subjects = result.scalars().all()
        
        return {
            "data": SubjectList(
                subjects=[
                    SubjectRead(
                        id=subject.id,
                        name=subject.name,
                        created_at=subject.created_at,
                        updated_at=subject.updated_at,
                        lesson_count=0,  # Temporary fix
                        task_count=0     # Temporary fix
                    ) for subject in subjects
                ],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch subjects: {str(e)}"
        )


@router.get("/{subject_id}", response_model=dict)
async def get_subject(
    subject_id: int,
    include_lessons: bool = Query(False, description="Include lessons in response"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific subject by ID.
    
    - **subject_id**: Subject ID
    - **include_lessons**: Whether to include lessons in the response
    """
    try:
        if include_lessons:
            query = select(Subject).options(selectinload(Subject.lessons)).where(Subject.id == subject_id)
        else:
            query = select(Subject).where(Subject.id == subject_id)
        
        result = await db.execute(query)
        subject = result.scalar_one_or_none()
        
        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )
        
        if include_lessons:
            return {
                "data": SubjectWithLessons.model_validate(subject),
                "status": "success"
            }
        else:
            return {
                "data": SubjectRead.model_validate(subject),
                "status": "success"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch subject: {str(e)}"
        )


@router.put("/{subject_id}", response_model=dict)
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update a subject.
    
    - **subject_id**: Subject ID
    - **name**: Updated subject name
    """
    try:
        # Get existing subject
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()
        
        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )
        
        # Check name uniqueness if name is being updated
        if subject_data.name and subject_data.name != subject.name:
            existing_subject = await db.execute(
                select(Subject).where(Subject.name == subject_data.name)
            )
            if existing_subject.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Subject name already exists"
                )
        
        # Update subject fields
        update_data = subject_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(subject, field, value)
        
        await db.commit()
        await db.refresh(subject)
        
        return {
            "data": SubjectRead.model_validate(subject),
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update subject: {str(e)}"
        )


@router.delete("/{subject_id}", response_model=dict)
async def delete_subject(
    subject_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a subject.
    
    - **subject_id**: Subject ID
    """
    try:
        # Check if subject has lessons
        lessons_result = await db.execute(
            select(func.count(Lesson.id)).where(Lesson.subject_id == subject_id)
        )
        lesson_count = lessons_result.scalar()
        
        if lesson_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete subject with {lesson_count} lessons. Remove lessons first."
            )
        
        # Get existing subject
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()
        
        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )
        
        await db.delete(subject)
        await db.commit()
        
        return {
            "data": {"message": f"Subject {subject_id} deleted successfully"},
            "status": "success"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete subject: {str(e)}"
        )