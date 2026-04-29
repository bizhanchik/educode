
from typing import List, Optional
import logging
import json
import uuid
import io
from fastapi import APIRouter, Depends, HTTPException, Query, Body, Request, UploadFile, File, Form, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.storage import storage_client
from app.models.subject import Subject
from app.models.lesson import Lesson
from app.models.user import User, UserRole
from app.models.teacher_subject_group import TeacherSubjectGroup
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate, SubjectList, SubjectWithLessons
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(tags=["subjects"])


class DeleteSubjectRequest(BaseModel):
    password: str


@router.post("", response_model=dict)
async def create_subject(
    subject_data: SubjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        existing_subject = await db.execute(
            select(Subject).where(Subject.name == subject_data.name)
        )
        if existing_subject.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Subject name already exists"
            )

        subject = Subject(**subject_data.model_dump(), created_by=current_user.id)
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


@router.get("", response_model=dict)
async def get_subjects(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.role == UserRole.ADMIN:
            count_query = select(func.count(Subject.id))
            subjects_query = select(Subject).offset((page - 1) * size).limit(size).order_by(Subject.created_at.desc())
        elif current_user.role == UserRole.TEACHER:
            teacher_condition = or_(
                Subject.created_by == current_user.id,
                Subject.id.in_(
                    select(TeacherSubjectGroup.subject_id)
                    .where(TeacherSubjectGroup.teacher_id == current_user.id)
                )
            )
            count_query = (
                select(func.count(func.distinct(Subject.id)))
                .where(teacher_condition)
            )
            subjects_query = (
                select(Subject)
                .where(teacher_condition)
                .distinct()
                .offset((page - 1) * size)
                .limit(size)
                .order_by(Subject.created_at.desc())
            )
        elif current_user.role == UserRole.STUDENT:
            if not current_user.group_id:
                return {
                    "data": SubjectList(
                        subjects=[],
                        total=0,
                        page=page,
                        size=size
                    ),
                    "status": "success"
                }

            count_query = (
                select(func.count(func.distinct(Subject.id)))
                .join(TeacherSubjectGroup, Subject.id == TeacherSubjectGroup.subject_id)
                .where(
                    TeacherSubjectGroup.group_id == current_user.group_id,
                    or_(
                        Subject.status.is_(None),
                        and_(
                            Subject.status != "Архив",
                            Subject.status != "Archive",
                            Subject.status != "архив",
                            Subject.status != "archive"
                        )
                    )
                )
            )
            subjects_query = (
                select(Subject)
                .join(TeacherSubjectGroup, Subject.id == TeacherSubjectGroup.subject_id)
                .where(
                    TeacherSubjectGroup.group_id == current_user.group_id,
                    or_(
                        Subject.status.is_(None),
                        and_(
                            Subject.status != "Архив",
                            Subject.status != "Archive",
                            Subject.status != "архив",
                            Subject.status != "archive"
                        )
                    )
                )
                .distinct()
                .offset((page - 1) * size)
                .limit(size)
                .order_by(Subject.created_at.desc())
            )
        else:
            raise HTTPException(status_code=403, detail="Access denied")

        count_result = await db.execute(count_query)
        total = count_result.scalar()

        result = await db.execute(subjects_query)
        subjects = result.scalars().all()

        from datetime import timedelta
        subjects_data = []
        for subject in subjects:
            subject_dict = SubjectRead.model_validate(subject).model_dump()

            if subject.image:
                logger.info(f"Subject {subject.id} has image: {subject.image}")
                try:
                    presigned_url = storage_client.get_presigned_url(
                        subject.image,
                        expires=timedelta(hours=24)
                    )
                    logger.info(f"Generated presigned URL for subject {subject.id}: {presigned_url[:80]}...")
                    subject_dict['image_presigned_url'] = presigned_url
                    subject_dict['header_image_presigned_url'] = presigned_url
                    if 'image_presigned_url' not in subject_dict:
                        logger.error(f"Failed to add presigned URL to subject_dict for subject {subject.id}")
                except Exception as e:
                    logger.error(f"Failed to generate presigned URL for subject {subject.id} image: {str(e)}", exc_info=True)
                    subject_dict['image_presigned_url'] = None
                    subject_dict['header_image_presigned_url'] = None
            else:
                logger.debug(f"Subject {subject.id} has no image")
                subject_dict['image_presigned_url'] = None
                subject_dict['header_image_presigned_url'] = None

            if subject.image and not subject_dict.get('image_presigned_url'):
                logger.warning(f"Subject {subject.id} has image but no presigned URL was set")

            subjects_data.append(subject_dict)

        subjects_with_images = [s for s in subjects_data if s.get('image') or s.get('image_url')]
        subjects_with_presigned = [s for s in subjects_data if s.get('image_presigned_url')]
        logger.info(f"Returning {len(subjects_data)} subjects. {len(subjects_with_images)} have images, {len(subjects_with_presigned)} have presigned URLs")

        return {
            "data": {
                "subjects": subjects_data,
                "total": total,
                "page": page,
                "size": size
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch subjects: {str(e)}"
        )


@router.get("/{subject_id}/image", response_class=Response)
async def get_subject_image(
    subject_id: int,
    db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()

        if not subject or not subject.image:
            raise HTTPException(status_code=404, detail="Subject image not found")

        try:
            image_data = storage_client.download_file(subject.image)

            content_type = "image/jpeg"
            if subject.image.endswith('.png'):
                content_type = "image/png"
            elif subject.image.endswith('.gif'):
                content_type = "image/gif"
            elif subject.image.endswith('.webp'):
                content_type = "image/webp"

            return Response(
                content=image_data,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Content-Disposition": f'inline; filename="{subject.image.split("/")[-1]}"'
                }
            )
        except Exception as e:
            logger.error(f"Failed to download image for subject {subject_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to load image: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get subject image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get subject image: {str(e)}")


@router.get("/{subject_id}", response_model=dict)
async def get_subject(
    subject_id: int,
    include_lessons: bool = Query(False, description="Include lessons in response"),
    db: AsyncSession = Depends(get_db)
):
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
            if subject.lessons:
                subject.lessons.sort(key=lambda l: (l.order if l.order is not None else 999999, l.created_at))
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


@router.post("/{subject_id}/image", response_model=dict)
async def upload_subject_image(
    subject_id: int,
    image: UploadFile = File(..., description="Subject header image"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"[upload_subject_image] Received request to upload image for subject {subject_id} from user {current_user.id}")
    logger.info(f"[upload_subject_image] Image file: {image.filename}, content_type: {image.content_type}, size: {image.size if hasattr(image, 'size') else 'unknown'}")
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.TEACHER]:
            raise HTTPException(
                status_code=403,
                detail="Only admins and teachers can upload subject images"
            )

        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )

        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )

        image.file.seek(0, 2)
        file_size = image.file.tell()
        image.file.seek(0)

        MAX_IMAGE_SIZE = 5 * 1024 * 1024
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Image size ({file_size / 1024 / 1024:.2f} MB) exceeds maximum allowed size (5 MB)"
            )

        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail="Image file is empty"
            )

        if subject.image:
            try:
                storage_client.delete_file(subject.image)
                logger.info(f"Deleted old image for subject {subject_id}: {subject.image}")
            except Exception as e:
                logger.warning(f"Failed to delete old image for subject {subject_id}: {str(e)}")

        file_ext = image.filename.split('.')[-1] if '.' in image.filename else 'jpg'
        unique_filename = f"subjects/{subject_id}/{uuid.uuid4()}.{file_ext}"

        try:
            storage_client.upload_file(
                file_data=image.file,
                object_name=unique_filename,
                content_type=image.content_type or "image/jpeg"
            )
            logger.info(f"Successfully uploaded image for subject {subject_id} to MinIO: {unique_filename}")
        except Exception as e:
            logger.error(f"Failed to upload image for subject {subject_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload image: {str(e)}"
            )

        subject.image = unique_filename
        await db.commit()
        await db.refresh(subject)

        from datetime import timedelta
        try:
            presigned_url = storage_client.get_presigned_url(
                unique_filename,
                expires=timedelta(hours=24)
            )
            logger.info(f"Generated presigned URL for subject {subject_id} image: {presigned_url}")
        except Exception as e:
            logger.warning(f"Failed to generate presigned URL for subject {subject_id} image: {str(e)}")
            presigned_url = None

        response_data = SubjectRead.model_validate(subject)
        response_dict = response_data.model_dump()

        if presigned_url:
            response_dict['image_presigned_url'] = presigned_url
            response_dict['header_image_presigned_url'] = presigned_url

        return {
            "data": response_data,
            "status": "success",
            "image_url": unique_filename,
            "image_presigned_url": presigned_url
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to upload subject image: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload subject image: {str(e)}"
        )


@router.put("/{subject_id}", response_model=dict)
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        pass
    elif current_user.role == UserRole.TEACHER:
        assignment_result = await db.execute(
            select(TeacherSubjectGroup).where(
                TeacherSubjectGroup.subject_id == subject_id,
                TeacherSubjectGroup.teacher_id == current_user.id
            )
        )
        assignment = assignment_result.scalars().first()
        pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Only admins and teachers can update subjects"
        )
    try:
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )

        logger.info(f"DB BEFORE - Subject {subject_id}: color={subject.color}, image={subject.image}")

        db_check = await db.execute(
            select(Subject.color, Subject.image).where(Subject.id == subject_id)
        )
        db_row = db_check.first()
        if db_row:
            logger.info(f"DB DIRECT QUERY BEFORE - color={db_row.color}, image={db_row.image}")

        if subject_data.name and subject_data.name != subject.name:
            existing_subject = await db.execute(
                select(Subject).where(Subject.name == subject_data.name)
            )
            if existing_subject.scalar_one_or_none():
                raise HTTPException(
                    status_code=400,
                    detail="Subject name already exists"
                )

        try:
            raw_body = await request.body()
            if raw_body:
                raw_json = json.loads(raw_body.decode('utf-8'))
                logger.info(f"Raw request body for subject {subject_id}: {raw_json}")
        except Exception as e:
            logger.warning(f"Could not parse raw request body: {e}")

        logger.info(f"BEFORE UPDATE - Subject {subject_id} state: color={subject.color}, image={subject.image}")

        update_data = subject_data.model_dump(exclude_unset=True, exclude_none=False)

        logger.info(f"STEP 1 - Parsed update data for subject {subject_id}: {update_data}")

        if 'header_color' in update_data:
            header_color_value = update_data.pop('header_color')
            logger.info(f"STEP 2a - Found header_color: {header_color_value}")
            if header_color_value is not None and header_color_value != '':
                update_data['color'] = header_color_value
                logger.info(f"STEP 2b - Mapped header_color -> color: {header_color_value}")
            else:
                update_data['color'] = None
                logger.info(f"STEP 2c - Clearing color (header_color was empty)")

        if 'image_url' in update_data:
            image_url_value = update_data.pop('image_url')
            logger.info(f"STEP 3a - Found image_url: {image_url_value}")
            if image_url_value is not None and image_url_value != '':
                update_data['image'] = image_url_value
                logger.info(f"STEP 3b - Mapped image_url -> image: {image_url_value}")
            else:
                update_data['image'] = None
                logger.info(f"STEP 3c - Clearing image (image_url was empty)")

        if 'color' in update_data:
            if update_data['color'] is None or update_data['color'] == '':
                update_data['color'] = None
            logger.info(f"STEP 4a - Final color value: {update_data.get('color')}")
        if 'image' in update_data:
            if update_data['image'] is None or update_data['image'] == '':
                update_data['image'] = None
            logger.info(f"STEP 4b - Final image value: {update_data.get('image')}")

        logger.info(f"STEP 5 - Final mapped update data: {update_data}")

        for field, value in update_data.items():
            if hasattr(subject, field):
                old_value = getattr(subject, field)
                setattr(subject, field, value)
                new_value = getattr(subject, field)
                logger.info(f"STEP 6 - Setattr {field}: {old_value} -> {new_value} (verify: {getattr(subject, field)})")
            else:
                logger.warning(f"STEP 6 - Field {field} does not exist in Subject model")

        logger.info(f"STEP 7 - BEFORE COMMIT - Subject {subject_id} state: color={subject.color}, image={subject.image}")

        await db.commit()
        logger.info(f"STEP 8 - COMMIT completed")

        db_check_after = await db.execute(
            select(Subject.color, Subject.image).where(Subject.id == subject_id)
        )
        db_row_after = db_check_after.first()
        if db_row_after:
            logger.info(f"DB DIRECT QUERY AFTER COMMIT - color={db_row_after.color}, image={db_row_after.image}")

        await db.refresh(subject)
        logger.info(f"STEP 9 - AFTER REFRESH - Subject {subject_id} state: color={subject.color}, image={subject.image}")

        if subject.color != db_row_after.color or subject.image != db_row_after.image:
            logger.error(f"STEP 9 ERROR - Mismatch! DB: color={db_row_after.color}, image={db_row_after.image} | Object: color={subject.color}, image={subject.image}")

        response_data = SubjectRead.model_validate(subject)
        response_dict = response_data.model_dump()
        logger.info(f"STEP 10 - Response data: color={response_dict.get('color')}, image={response_dict.get('image')}, header_color={response_dict.get('header_color')}, image_url={response_dict.get('image_url')}")

        return {
            "data": response_data,
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
    request: DeleteSubjectRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.auth import verify_password
    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid password. Please enter your password to confirm deletion."
        )

    if current_user.role == UserRole.ADMIN:
        pass
    elif current_user.role == UserRole.TEACHER:
        assignment_result = await db.execute(
            select(TeacherSubjectGroup).where(
                TeacherSubjectGroup.subject_id == subject_id,
                TeacherSubjectGroup.teacher_id == current_user.id
            )
        )
        assignment = assignment_result.scalars().first()
        pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Only admins and teachers can delete subjects"
        )
    try:
        result = await db.execute(select(Subject).where(Subject.id == subject_id))
        subject = result.scalar_one_or_none()

        if not subject:
            raise HTTPException(
                status_code=404,
                detail="Subject not found"
            )

        lessons_result = await db.execute(
            select(Lesson).where(Lesson.subject_id == subject_id)
        )
        lessons = lessons_result.scalars().all()

        from app.models.lesson_material import LessonMaterial
        for lesson in lessons:
            materials_result = await db.execute(
                select(LessonMaterial).where(LessonMaterial.lesson_id == lesson.id)
            )
            materials = materials_result.scalars().all()
            for material in materials:
                await db.delete(material)

        for lesson in lessons:
            await db.delete(lesson)

        assignments_result = await db.execute(
            select(TeacherSubjectGroup).where(TeacherSubjectGroup.subject_id == subject_id)
        )
        assignments = assignments_result.scalars().all()

        for assignment in assignments:
            await db.delete(assignment)

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