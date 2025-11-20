"""
EduCode Backend - AI Generation Celery Tasks

Background tasks for file text extraction and AI-powered task generation.
These tasks run asynchronously to avoid blocking API requests.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime, timezone

from celery import Task as CeleryTask
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.models.lesson import Lesson
from app.models.lesson_material import LessonMaterial, MaterialType
from app.models.task import Task, ProgrammingLanguage
from app.models.task_test import TaskTest, TestType
from app.models.ai_solution import AISolution
from app.models.subject import Subject
from app.services.file_processor import process_lesson_material, process_multiple_materials
from app.services.ai_task_generator import ai_task_generator, TaskGenerationError
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)
settings = get_settings()


# Create async database session for Celery tasks
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@celery_app.task(
    name="app.tasks.ai_generation_tasks.extract_material_text_task",
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def extract_material_text_task(self: CeleryTask, material_id: int) -> Dict[str, Any]:
    """
    Extract text content from a lesson material file (PDF, PPTX, DOCX).

    This task runs in the background after a material is uploaded.
    Updates the material's extracted_text field with the extracted content.

    Args:
        material_id: ID of the lesson material to process

    Returns:
        dict: Result with status, material_id, and extracted text info

    Raises:
        Exception: If extraction fails after retries
    """
    import asyncio

    async def _extract():
        async with async_session_maker() as session:
            try:
                # Get material
                result = await session.execute(
                    select(LessonMaterial).where(LessonMaterial.id == material_id)
                )
                material = result.scalar_one_or_none()

                if not material:
                    raise ValueError(f"Material {material_id} not found")

                # Check if material type is extractable
                if material.material_type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX]:
                    return {
                        "status": "skipped",
                        "material_id": material_id,
                        "reason": f"Material type {material.material_type.value} not extractable"
                    }

                # Extract text
                logger.info(f"Extracting text from material {material_id} ({material.material_type.value})")
                extracted_text = await process_lesson_material(
                    material.file_path,
                    material.material_type.value
                )

                # Update material
                material.extracted_text = extracted_text
                await session.commit()

                logger.info(f"Successfully extracted {len(extracted_text)} characters from material {material_id}")

                return {
                    "status": "success",
                    "material_id": material_id,
                    "material_type": material.material_type.value,
                    "text_length": len(extracted_text),
                    "preview": extracted_text[:200] + "..." if len(extracted_text) > 200 else extracted_text
                }

            except Exception as e:
                logger.error(f"Failed to extract text from material {material_id}: {str(e)}")
                await session.rollback()
                raise

    try:
        return asyncio.run(_extract())
    except Exception as exc:
        logger.error(f"Task failed for material {material_id}: {str(exc)}")
        raise self.retry(exc=exc)


@celery_app.task(
    name="app.tasks.ai_generation_tasks.generate_tasks_from_materials_task",
    bind=True,
    max_retries=2,
    default_retry_delay=120
)
def generate_tasks_from_materials_task(
    self: CeleryTask,
    lesson_id: int,
    num_tasks: int = 3,
    languages: List[str] = None,
    use_openai: bool = True,
    material_ids: List[int] = None
) -> Dict[str, Any]:
    """
    Generate coding tasks from lesson materials using AI.

    This task runs in the background to avoid blocking the API.
    Creates tasks with descriptions, reference solutions, and test structures.

    Args:
        lesson_id: Lesson ID
        num_tasks: Number of tasks to generate (default: 3)
        languages: Programming languages (default: ["python"])
        use_openai: Use OpenAI (True) or Anthropic (False)
        material_ids: Optional specific material IDs to use

    Returns:
        dict: Result with status, lesson_id, and created tasks info

    Raises:
        Exception: If generation fails after retries
    """
    import asyncio
    import time

    if languages is None:
        languages = ["python"]

    async def _generate():
        start_time = time.time()

        async with async_session_maker() as session:
            try:
                # Get lesson with subject
                result = await session.execute(
                    select(Lesson).where(Lesson.id == lesson_id)
                )
                lesson = result.scalar_one_or_none()

                if not lesson:
                    raise ValueError(f"Lesson {lesson_id} not found")

                # Get subject
                subject_result = await session.execute(
                    select(Subject).where(Subject.id == lesson.subject_id)
                )
                subject = subject_result.scalar_one_or_none()

                if not subject:
                    raise ValueError(f"Subject {lesson.subject_id} not found")

                # Get materials
                if material_ids:
                    materials_result = await session.execute(
                        select(LessonMaterial).where(
                            and_(
                                LessonMaterial.lesson_id == lesson_id,
                                LessonMaterial.id.in_(material_ids)
                            )
                        )
                    )
                else:
                    materials_result = await session.execute(
                        select(LessonMaterial).where(
                            and_(
                                LessonMaterial.lesson_id == lesson_id,
                                LessonMaterial.use_for_ai_generation == True
                            )
                        )
                    )

                materials = materials_result.scalars().all()

                if not materials:
                    raise ValueError("No materials available for AI generation")

                logger.info(f"Generating {num_tasks} tasks for lesson {lesson_id} using {len(materials)} materials")

                # Extract text from materials
                combined_text = await process_multiple_materials(materials)

                if not combined_text or len(combined_text.strip()) < 100:
                    raise ValueError("Insufficient text content in materials")

                # Validate programming languages
                valid_languages = []
                for lang in languages:
                    try:
                        valid_languages.append(ProgrammingLanguage(lang.lower()))
                    except ValueError:
                        logger.warning(f"Invalid language {lang}, skipping")
                        continue

                if not valid_languages:
                    valid_languages = [ProgrammingLanguage.PYTHON]

                # Generate tasks using AI
                generated_tasks = await ai_task_generator.generate_tasks_from_materials(
                    material_text=combined_text,
                    subject_name=subject.name,
                    lesson_title=lesson.title,
                    num_tasks=num_tasks,
                    languages=valid_languages,
                    use_openai=use_openai
                )

                # Create tasks in database
                created_tasks = []
                for task_data in generated_tasks:
                    # Create task
                    task = Task(
                        lesson_id=lesson_id,
                        title=task_data["title"],
                        body=task_data["body"],
                        language=ProgrammingLanguage(task_data["language"].lower()),
                        deadline_at=datetime.now(timezone.utc)  # Temporary deadline
                    )
                    session.add(task)
                    await session.flush()  # Get task ID

                    # Create AI solution (reference solution)
                    ai_solution = AISolution(
                        task_id=task.id,
                        code=task_data["reference_solution"],
                        language=task_data["language"].lower()
                    )
                    session.add(ai_solution)

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
                        session.add(test)

                    created_tasks.append({
                        "task_id": task.id,
                        "title": task.title,
                        "language": task.language.value,
                        "test_count": len(task_data["tests"])
                    })

                # Commit all changes
                await session.commit()

                generation_time = time.time() - start_time

                logger.info(f"Successfully generated {len(created_tasks)} tasks for lesson {lesson_id} in {generation_time:.2f}s")

                return {
                    "status": "success",
                    "lesson_id": lesson_id,
                    "tasks_created": len(created_tasks),
                    "tasks": created_tasks,
                    "generation_time_seconds": round(generation_time, 2),
                    "ai_provider": "openai" if use_openai else "anthropic"
                }

            except TaskGenerationError as e:
                logger.error(f"AI generation failed for lesson {lesson_id}: {str(e)}")
                await session.rollback()
                raise

            except Exception as e:
                logger.error(f"Failed to generate tasks for lesson {lesson_id}: {str(e)}")
                await session.rollback()
                raise

    try:
        return asyncio.run(_generate())
    except Exception as exc:
        logger.error(f"Task generation failed for lesson {lesson_id}: {str(exc)}")
        # Only retry for specific errors (not validation errors)
        if isinstance(exc, (TaskGenerationError, ConnectionError)):
            raise self.retry(exc=exc)
        else:
            raise


@celery_app.task(
    name="app.tasks.ai_generation_tasks.bulk_extract_materials_task",
    bind=True
)
def bulk_extract_materials_task(self: CeleryTask, material_ids: List[int]) -> Dict[str, Any]:
    """
    Extract text from multiple materials in bulk.

    Useful for processing all materials in a lesson at once.

    Args:
        material_ids: List of material IDs to process

    Returns:
        dict: Result with success/failure counts and details
    """
    results = {
        "total": len(material_ids),
        "success": 0,
        "failed": 0,
        "skipped": 0,
        "details": []
    }

    for material_id in material_ids:
        try:
            result = extract_material_text_task.apply(args=[material_id])
            task_result = result.get(timeout=300)  # 5 minute timeout per material

            if task_result["status"] == "success":
                results["success"] += 1
            elif task_result["status"] == "skipped":
                results["skipped"] += 1

            results["details"].append(task_result)

        except Exception as e:
            results["failed"] += 1
            results["details"].append({
                "status": "error",
                "material_id": material_id,
                "error": str(e)
            })
            logger.error(f"Failed to extract material {material_id}: {str(e)}")

    return results
