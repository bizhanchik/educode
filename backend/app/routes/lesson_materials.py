
import uuid
import io
import json
import base64
import tempfile
import os
import logging
from typing import Optional
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, Body
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["lesson-materials"])


@router.post("/lessons/{lesson_id}/materials", response_model=dict, status_code=201)
async def create_lesson_material(
    lesson_id: int,
    title: str = Form(..., description="Material title"),
    type: str = Form(..., description="Material type: text, file, or youtube"),
    content: Optional[str] = Form(None, description="Text content (for type=text)"),
    youtube_url: Optional[str] = Form(None, description="YouTube URL (for type=youtube)"),
    file: Optional[UploadFile] = File(None, description="File upload (for type=file)"),
    use_for_ai_generation: Optional[str] = Form("false", description="Use material for AI generation (true/false)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        try:
            material_type = MaterialType(type.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid material type '{type}'. Must be: text, file, pdf, docx, pptx, or youtube"
            )

        result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == UserRole.TEACHER and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only add materials to your own lessons"
            )

        file_url = None

        if material_type == MaterialType.TEXT:
            if not content or not content.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Content is required for text materials"
                )

        elif material_type in [MaterialType.FILE, MaterialType.PDF, MaterialType.DOCX, MaterialType.PPTX, MaterialType.TXT]:
            if not file:
                raise HTTPException(
                    status_code=400,
                    detail=f"File upload is required for {material_type.value} materials"
                )

            validate_material_file(file)

            file_ext = file.filename.split('.')[-1] if '.' in file.filename else ''
            unique_filename = f"lesson_{lesson_id}/{uuid.uuid4()}.{file_ext}"

            try:
                storage_client.upload_file(
                    file_data=file.file,
                    object_name=unique_filename,
                    content_type=file.content_type or "application/octet-stream"
                )
                file_url = unique_filename
                logger.info(f"Successfully uploaded {material_type.value} file to MinIO: {unique_filename}")
            except Exception as e:
                logger.error(f"Failed to upload {material_type.value} file: {str(e)}")
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

        use_for_ai = False
        if isinstance(use_for_ai_generation, str):
            use_for_ai = use_for_ai_generation.lower() == "true"
        elif isinstance(use_for_ai_generation, bool):
            use_for_ai = use_for_ai_generation

        extracted_text = None
        extracted_images_json = None

        if material_type in [MaterialType.PDF, MaterialType.DOCX, MaterialType.PPTX, MaterialType.TXT] and file_url:
            try:
                from app.services.file_processor import process_lesson_material

                logger.info(f"Starting text extraction for {material_type.value} file: {file_url}")

                with tempfile.NamedTemporaryFile(delete=False, suffix=f".{material_type.value}") as tmp_file:
                    tmp_path = tmp_file.name

                    try:
                        logger.info(f"Downloading file from MinIO: {file_url}")
                        file_data = storage_client.download_file(file_url)
                        logger.info(f"File downloaded successfully, size: {len(file_data)} bytes")

                        tmp_file.write(file_data)
                        tmp_file.flush()
                        logger.info(f"File written to temporary location: {tmp_path}")

                        logger.info(f"Starting text extraction from {material_type.value} file: {tmp_path}")
                        try:
                            extracted_text, images = await process_lesson_material(
                                tmp_path,
                                material_type.value,
                                extract_images=True
                            )

                            if extracted_text and extracted_text.strip():
                                logger.info(f"✓ Successfully extracted {len(extracted_text)} characters from {material_type.value} file")
                            else:
                                logger.error(f"✗ WARNING: No text extracted from {material_type.value} file! File might be empty, corrupted, or extraction failed.")
                                try:
                                    file_size = os.path.getsize(tmp_path)
                                    logger.error(f"File size: {file_size} bytes - file exists but contains no extractable text")
                                except Exception as size_error:
                                    logger.error(f"Could not get file size: {str(size_error)}")
                        except Exception as extract_error:
                            logger.error(f"✗ EXCEPTION during text extraction: {str(extract_error)}", exc_info=True)
                            extracted_text = None
                            images = []

                        if images:
                            image_urls = []
                            for img_index, img_data in enumerate(images):
                                try:
                                    image_bytes = base64.b64decode(img_data["data"])
                                    image_ext = img_data.get("format", "png")

                                    image_filename = f"lesson_{lesson_id}/images/{uuid.uuid4()}.{image_ext}"
                                    storage_client.upload_file(
                                        file_data=io.BytesIO(image_bytes),
                                        object_name=image_filename,
                                        content_type=f"image/{image_ext}"
                                    )

                                    image_urls.append({
                                        "url": image_filename,
                                        "description": img_data.get("description", f"Image {img_index + 1}"),
                                        "format": image_ext
                                    })
                                except Exception as img_error:
                                    logger.warning(f"Failed to save image {img_index}: {str(img_error)}")

                            if image_urls:
                                extracted_images_json = json.dumps(image_urls)
                    finally:
                        if os.path.exists(tmp_path):
                            os.unlink(tmp_path)
            except Exception as e:
                logger.error(f"Failed to extract text/images from document: {str(e)}", exc_info=True)

        material = LessonMaterial(
            lesson_id=lesson_id,
            type=material_type,
            title=title,
            content=content if material_type == MaterialType.TEXT else None,
            file_url=file_url if material_type in [MaterialType.FILE, MaterialType.PDF, MaterialType.DOCX, MaterialType.PPTX, MaterialType.TXT] else None,
            youtube_url=youtube_url if material_type == MaterialType.YOUTUBE else None,
            extracted_text=extracted_text,
            extracted_images=extracted_images_json,
            use_for_ai_generation=use_for_ai
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
    try:
        result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == UserRole.TEACHER and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only view materials from your own lessons"
            )

        materials_result = await db.execute(
            select(LessonMaterial)
            .where(LessonMaterial.lesson_id == lesson_id)
            .order_by(LessonMaterial.created_at.asc())
        )
        materials = materials_result.scalars().all()

        materials_data = []
        for material in materials:
            material_dict = LessonMaterialRead.model_validate(material).model_dump()

            if material.type in [MaterialType.FILE, MaterialType.PDF, MaterialType.DOCX, MaterialType.PPTX, MaterialType.TXT] and material.file_url:
                try:
                    presigned_url = storage_client.get_presigned_url(
                        material.file_url,
                        expires=timedelta(hours=1)
                    )
                    material_dict['file_download_url'] = presigned_url
                except Exception as e:
                    logger.warning(f"Failed to generate presigned URL for material {material.id}: {str(e)}")
                    material_dict['file_download_url'] = None

            if material.extracted_images:
                try:
                    images_data = json.loads(material.extracted_images)
                    for img in images_data:
                        if "url" in img:
                            try:
                                img["presigned_url"] = storage_client.get_presigned_url(
                                    img["url"],
                                    expires=timedelta(hours=1)
                                )
                            except Exception as e:
                                logger.warning(f"Failed to generate presigned URL for image: {str(e)}")
                                img["presigned_url"] = None
                    material_dict["extracted_images"] = images_data
                except Exception as e:
                    logger.warning(f"Failed to parse extracted images for material {material.id}: {str(e)}")
                    material_dict["extracted_images"] = []

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


@router.patch("/materials/{material_id}", response_model=dict)
async def update_lesson_material(
    material_id: int,
    body: dict = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        result = await db.execute(
            select(LessonMaterial)
            .options(selectinload(LessonMaterial.lesson))
            .where(LessonMaterial.id == material_id)
        )
        material = result.scalar_one_or_none()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        if current_user.role == UserRole.TEACHER and material.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only update materials in your own lessons"
            )

        if "use_for_ai_generation" in body and body["use_for_ai_generation"] is not None:
            material.use_for_ai_generation = bool(body["use_for_ai_generation"])

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
            detail=f"Failed to update material: {str(e)}"
        )


@router.delete("/materials/{material_id}", response_model=dict)
async def delete_lesson_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        result = await db.execute(
            select(LessonMaterial)
            .options(selectinload(LessonMaterial.lesson))
            .where(LessonMaterial.id == material_id)
        )
        material = result.scalar_one_or_none()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        if current_user.role == UserRole.TEACHER and material.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only delete materials from your own lessons"
            )

        if material.type == MaterialType.FILE and material.file_url:
            try:
                storage_client.delete_file(material.file_url)
            except Exception as e:
                pass

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
