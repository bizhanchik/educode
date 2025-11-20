"""
EduCode Backend - AI Task Generation Routes

FastAPI routes for AI-powered task generation from lesson materials.
Teachers use these endpoints to automatically generate tasks from uploaded materials.
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.auth import teacher_required
from app.models.user import User
from app.models.lesson import Lesson
from app.models.lesson_material import LessonMaterial, MaterialType
from app.models.task import Task, ProgrammingLanguage
from app.models.task_test import TaskTest, TestType
from app.models.ai_solution import AISolution
from app.services.file_processor import process_multiple_materials
from app.services.ai_task_generator import ai_task_generator, TaskGenerationError
from pydantic import BaseModel, Field

router = APIRouter(tags=["ai-generation"])


class AIGenerationRequest(BaseModel):
    """Request schema for AI task generation."""
    lesson_id: int = Field(..., description="Lesson ID")
    num_tasks: int = Field(3, ge=1, le=10, description="Number of tasks to generate")
    languages: List[str] = Field(
        default=["python"],
        description="Programming languages for tasks"
    )
    use_openai: bool = Field(True, description="Use OpenAI (true) or Anthropic (false)")
    material_ids: Optional[List[int]] = Field(
        None,
        description="Specific material IDs to use (if not provided, uses all with use_for_ai_generation=true)"
    )


class AIGenerationResponse(BaseModel):
    """Response schema for AI task generation."""
    lesson_id: int
    tasks_created: int
    tasks: List[dict]
    generation_time_seconds: float
    ai_provider: str


@router.post("/generate-tasks", response_model=dict)
async def generate_tasks_from_materials(
    request: AIGenerationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Generate coding tasks from lesson materials using AI.

    This endpoint:
    1. Extracts text from selected lesson materials (PDF, PPTX, DOCX)
    2. Sends the text to AI (OpenAI or Anthropic) with generation instructions
    3. Creates tasks with descriptions, reference solutions, and test structures
    4. Stores everything in the database

    **Requirements:**
    - Lesson must belong to the current teacher
    - At least one material with use_for_ai_generation=true (or specify material_ids)
    - Materials must be text-extractable (PDF, PPTX, DOCX, TEXT)

    **Note:** YouTube materials cannot be used for AI generation.

    - **lesson_id**: Lesson ID
    - **num_tasks**: Number of tasks to generate (1-10)
    - **languages**: Programming languages (e.g., ["python", "javascript"])
    - **use_openai**: Use OpenAI (true) or Anthropic Claude (false)
    - **material_ids**: Optional specific material IDs to use
    """
    import time
    start_time = time.time()

    try:
        # Verify lesson exists and belongs to teacher
        lesson_result = await db.execute(
            select(Lesson)
            .options(selectinload(Lesson.subject))
            .where(Lesson.id == request.lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role.value == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only generate tasks for your own lessons"
            )

        # Get materials for AI generation
        if request.material_ids:
            # Use specific materials
            materials_result = await db.execute(
                select(LessonMaterial).where(
                    and_(
                        LessonMaterial.lesson_id == request.lesson_id,
                        LessonMaterial.id.in_(request.material_ids)
                    )
                )
            )
        else:
            # Use all materials marked for AI generation
            materials_result = await db.execute(
                select(LessonMaterial).where(
                    and_(
                        LessonMaterial.lesson_id == request.lesson_id,
                        LessonMaterial.use_for_ai_generation == True
                    )
                )
            )

        materials = materials_result.scalars().all()

        if not materials:
            raise HTTPException(
                status_code=400,
                detail="No materials available for AI generation. Please mark materials with use_for_ai_generation=true"
            )

        # Validate materials are text-extractable
        non_extractable = [
            m for m in materials
            if m.material_type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX, MaterialType.TEXT]
        ]
        if non_extractable:
            types = [m.material_type.value for m in non_extractable]
            raise HTTPException(
                status_code=400,
                detail=f"Cannot extract text from materials of type: {', '.join(types)}. Only PDF, PPTX, DOCX, and TEXT are supported."
            )

        # Extract text from materials
        combined_text = await process_multiple_materials(materials)

        if not combined_text or len(combined_text.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient text content in materials for AI generation. Minimum 100 characters required."
            )

        # Validate and convert programming languages
        valid_languages = []
        for lang in request.languages:
            try:
                valid_languages.append(ProgrammingLanguage(lang.lower()))
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid programming language: {lang}. Supported: python, java, javascript, cpp, c, csharp, go, rust"
                )

        # Generate tasks using AI
        try:
            generated_tasks = await ai_task_generator.generate_tasks_from_materials(
                material_text=combined_text,
                subject_name=lesson.subject.name,
                lesson_title=lesson.title,
                num_tasks=request.num_tasks,
                languages=valid_languages,
                use_openai=request.use_openai
            )
        except TaskGenerationError as e:
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {str(e)}"
            )

        # Create tasks in database
        created_tasks = []
        for task_data in generated_tasks:
            # Create task
            task = Task(
                lesson_id=request.lesson_id,
                title=task_data["title"],
                body=task_data["body"],
                language=ProgrammingLanguage(task_data["language"].lower()),
                deadline_at=datetime.now(timezone.utc)  # Temporary deadline
            )
            db.add(task)
            await db.flush()  # Get task ID

            # Create AI solution (reference solution)
            ai_solution = AISolution(
                task_id=task.id,
                code=task_data["reference_solution"],
                language=task_data["language"].lower()
            )
            db.add(ai_solution)

            # Create test cases
            for test_data in task_data["tests"]:
                test = TaskTest(
                    task_id=task.id,
                    test_name=test_data["test_name"],
                    test_input=test_data["test_input"],
                    expected_output=test_data["expected_output"],
                    test_type=TestType(test_data.get("test_type", "UNIT")),
                    weight=test_data.get("weight", 1),
                    timeout_seconds=test_data.get("timeout_seconds", 5)
                )
                db.add(test)

            created_tasks.append({
                "task_id": task.id,
                "title": task.title,
                "language": task.language.value,
                "test_count": len(task_data["tests"])
            })

        # Commit all changes
        await db.commit()

        generation_time = time.time() - start_time

        return {
            "data": AIGenerationResponse(
                lesson_id=request.lesson_id,
                tasks_created=len(created_tasks),
                tasks=created_tasks,
                generation_time_seconds=round(generation_time, 2),
                ai_provider="openai" if request.use_openai else "anthropic"
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate tasks: {str(e)}"
        )


@router.post("/extract-material-text/{material_id}", response_model=dict)
async def extract_material_text(
    material_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Extract and store text from a lesson material file.

    This endpoint processes a material file (PDF, PPTX, DOCX) and extracts
    the text content, storing it in the extracted_text field.

    Useful for previewing what text will be sent to AI for generation.

    - **material_id**: Material ID
    """
    try:
        # Get material
        material_result = await db.execute(
            select(LessonMaterial)
            .options(selectinload(LessonMaterial.lesson))
            .where(LessonMaterial.id == material_id)
        )
        material = material_result.scalar_one_or_none()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Verify access
        if current_user.role.value == "teacher" and material.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only extract text from your own lesson materials"
            )

        # Check if material type is extractable
        if material.material_type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot extract text from {material.material_type.value} materials"
            )

        # Extract text
        from app.services.file_processor import process_lesson_material

        extracted_text = await process_lesson_material(
            material.file_path,
            material.material_type.value
        )

        # Update material with extracted text
        material.extracted_text = extracted_text
        await db.commit()
        await db.refresh(material)

        return {
            "data": {
                "material_id": material.id,
                "material_type": material.material_type.value,
                "extracted_text": extracted_text,
                "text_length": len(extracted_text),
                "preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract text: {str(e)}"
        )


@router.get("/preview-generation/{lesson_id}", response_model=dict)
async def preview_generation_materials(
    lesson_id: int,
    material_ids: Optional[str] = Query(None, description="Comma-separated material IDs"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    """
    Preview what materials will be used for AI generation.

    Shows combined text that will be sent to AI, useful for verification before generation.

    - **lesson_id**: Lesson ID
    - **material_ids**: Optional comma-separated material IDs (e.g., "1,2,3")
    """
    try:
        # Verify lesson exists and belongs to teacher
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role.value == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        # Get materials
        if material_ids:
            ids = [int(id.strip()) for id in material_ids.split(",")]
            materials_result = await db.execute(
                select(LessonMaterial).where(
                    and_(
                        LessonMaterial.lesson_id == lesson_id,
                        LessonMaterial.id.in_(ids)
                    )
                )
            )
        else:
            materials_result = await db.execute(
                select(LessonMaterial).where(
                    and_(
                        LessonMaterial.lesson_id == lesson_id,
                        LessonMaterial.use_for_ai_generation == True
                    )
                )
            )

        materials = materials_result.scalars().all()

        if not materials:
            raise HTTPException(
                status_code=400,
                detail="No materials found for preview"
            )

        # Process materials
        combined_text = await process_multiple_materials(materials)

        material_info = [
            {
                "id": m.id,
                "title": m.title,
                "type": m.material_type.value,
                "has_extracted_text": bool(m.extracted_text),
                "text_length": len(m.extracted_text) if m.extracted_text else 0
            }
            for m in materials
        ]

        return {
            "data": {
                "lesson_id": lesson_id,
                "materials": material_info,
                "total_materials": len(materials),
                "combined_text_length": len(combined_text),
                "preview": combined_text[:1000] + "..." if len(combined_text) > 1000 else combined_text
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview materials: {str(e)}"
        )
