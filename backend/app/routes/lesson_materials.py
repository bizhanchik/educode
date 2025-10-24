"""
EduCode Backend - Lesson Materials Routes

FastAPI routes for Lesson Material CRUD operations.
Handles material attachments (text, files, YouTube) for lessons.
"""

import uuid
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, require_roles
from app.core.storage import storage_client, validate_material_file
from app.models.lesson import Lesson
from app.models.lesson_material import LessonMaterial, MaterialType
from app.models.user import User, UserRole
from app.schemas.lesson_material import LessonMaterialRead

router = APIRouter(prefix="/api/v1", tags=["lesson-materials"])


@router.post("/lessons/{lesson_id}/materials", response_model=dict, status_code=201)
async def create_lesson_material(
    lesson_id: int,
    title: str = Form(..., description="Material title"),
    type: str = Form(..., description="Material type: text, file, or youtube"),
    content: Optional[str] = Form(None, description="Text content (for type=text)"),
    youtube_url: Optional[str] = Form(None, description="YouTube URL (for type=youtube)"),
    file: Optional[UploadFile] = File(None, description="File upload (for type=file)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Create a new lesson material.

    **Teacher only**. Attach text, file, or YouTube materials to a lesson.

    - **type=text**: Requires `content` field
    - **type=file**: Requires `file` upload
    - **type=youtube**: Requires `youtube_url` field

    File validation:
    - Max size: 50 MB
    - Allowed types: PDF, DOCX, PPTX, images, videos, archives, code files
    """
    try:
        # Validate material type
        try:
            material_type = MaterialType(type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid material type '{type}'. Must be: text, file, or youtube"
            )

        # Check if lesson exists and teacher owns it
        result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Verify ownership (teacher must own the lesson, or be admin)
        if current_user.role == UserRole.TEACHER and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only add materials to your own lessons"
            )

        # Validate type-specific requirements
        file_url = None

        if material_type == MaterialType.TEXT:
            if not content or not content.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Content is required for text materials"
                )

        elif material_type == MaterialType.FILE:
            if not file:
                raise HTTPException(
                    status_code=400,
                    detail="File upload is required for file materials"
                )

            # Validate file
            validate_material_file(file)

            # Upload to MinIO
            file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"lesson_{lesson_id}/{uuid.uuid4()}.{file_ext}"

            try:
                # Upload file to MinIO
                storage_client.upload_file(
                    file_data=file.file,
                    object_name=unique_filename,
                    content_type=file.content_type or "application/octet-stream"
                )
                file_url = unique_filename
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to upload file: {str(e)}"
                )

        elif material_type == MaterialType.YOUTUBE:
            if not youtube_url:
                raise HTTPException(
                    status_code=400,
                    detail="YouTube URL is required for youtube materials"
                )

            # Basic YouTube URL validation
            youtube_url = youtube_url.strip()
            if not (
                youtube_url.startswith('https://www.youtube.com/') or
                youtube_url.startswith('https://youtu.be/') or
                youtube_url.startswith('http://www.youtube.com/') or
                youtube_url.startswith('http://youtu.be/')
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid YouTube URL. Must start with https://www.youtube.com/ or https://youtu.be/"
                )

        # Create material
        material = LessonMaterial(
            lesson_id=lesson_id,
            type=material_type,
            title=title,
            content=content if material_type == MaterialType.TEXT else None,
            file_url=file_url if material_type == MaterialType.FILE else None,
            youtube_url=youtube_url if material_type == MaterialType.YOUTUBE else None
        )

        db.add(material)
        await db.commit()
        await db.refresh(material)

        return {
            "data": LessonMaterialRead.model_validate(material),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create material: {str(e)}"
        )


@router.get("/lessons/{lesson_id}/materials", response_model=dict)
async def get_lesson_materials(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all materials for a lesson.

    **Teacher or Student** can access. Returns all materials attached to the lesson.
    """
    try:
        # Check if lesson exists
        result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Teachers can only see materials from their own lessons (unless admin)
        if current_user.role == UserRole.TEACHER and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view materials from your own lessons"
            )

        # Get all materials for this lesson
        materials_result = await db.execute(
            select(LessonMaterial)
            .where(LessonMaterial.lesson_id == lesson_id)
            .order_by(LessonMaterial.created_at.asc())
        )
        materials = materials_result.scalars().all()

        # For file materials, generate presigned URLs
        materials_data = []
        for material in materials:
            material_dict = LessonMaterialRead.model_validate(material).model_dump()

            # Generate presigned URL for file materials
            if material.type == MaterialType.FILE and material.file_url:
                try:
                    presigned_url = storage_client.get_presigned_url(
                        material.file_url,
                        expires=timedelta(hours=1)
                    )
                    material_dict['file_download_url'] = presigned_url
                except Exception as e:
                    # If presigned URL generation fails, log but don't fail the request
                    material_dict['file_download_url'] = None

            materials_data.append(material_dict)

        return {
            "data": {
                "materials": materials_data,
                "total": len(materials_data)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch materials: {str(e)}"
        )


@router.delete("/materials/{material_id}", response_model=dict)
async def delete_lesson_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Delete a lesson material.

    **Teacher only**. Teacher must own the lesson to delete its materials.
    Also deletes the file from MinIO if it's a file material.
    """
    try:
        # Get material with lesson relationship
        result = await db.execute(
            select(LessonMaterial)
            .options(selectinload(LessonMaterial.lesson))
            .where(LessonMaterial.id == material_id)
        )
        material = result.scalar_one_or_none()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Verify ownership (teacher must own the lesson, or be admin)
        if current_user.role == UserRole.TEACHER and material.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only delete materials from your own lessons"
            )

        # If it's a file material, delete from MinIO
        if material.type == MaterialType.FILE and material.file_url:
            try:
                storage_client.delete_file(material.file_url)
            except Exception as e:
                # Log error but continue with deletion from DB
                # File might already be deleted or not exist
                pass

        # Delete material from database
        await db.delete(material)
        await db.commit()

        return {
            "data": {"message": f"Material {material_id} deleted successfully"},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete material: {str(e)}"
        )
