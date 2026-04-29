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
    import time
    start_time = time.time()

    try:
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

        if request.material_ids:
            materials_result = await db.execute(
                select(LessonMaterial).where(
                    and_(
                        LessonMaterial.lesson_id == request.lesson_id,
                        LessonMaterial.id.in_(request.material_ids)
                    )
                )
            )
        else:
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

        combined_text = await process_multiple_materials(materials)

        if not combined_text or len(combined_text.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail="Insufficient text content in materials for AI generation. Minimum 100 characters required."
            )

        valid_languages = []
        for lang in request.languages:
            try:
                valid_languages.append(ProgrammingLanguage(lang.lower()))
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid programming language: {lang}. Supported: python, java, javascript, cpp, c, csharp, go, rust"
                )

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

        created_tasks = []
        for task_data in generated_tasks:
            task = Task(
                lesson_id=request.lesson_id,
                title=task_data["title"],
                body=task_data["body"],
                language=ProgrammingLanguage(task_data["language"].lower()),
                deadline_at=datetime.now(timezone.utc)
            )
            db.add(task)
            await db.flush()

            ai_solution = AISolution(
                task_id=task.id,
                code=task_data["reference_solution"],
                language=task_data["language"].lower()
            )
            db.add(ai_solution)


            for idx, test_data in enumerate(task_data["tests"]):
                test = TaskTest(
                    task_id=task.id,
                    test_name=test_data["test_name"],
                    test_input=test_data["test_input"],
                    expected_output=test_data["expected_output"],
                    test_type=TestType(test_data.get("test_type", "UNIT")),
                    weight=test_data.get("weight", 1),
                    timeout_seconds=test_data.get("timeout_seconds", 5),
                    is_public=idx < 2
                )
                db.add(test)

            created_tasks.append({
                "task_id": task.id,
                "title": task.title,
                "language": task.language.value,
                "test_count": len(task_data["tests"])
            })

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
    try:
        material_result = await db.execute(
            select(LessonMaterial)
            .options(selectinload(LessonMaterial.lesson))
            .where(LessonMaterial.id == material_id)
        )
        material = material_result.scalar_one_or_none()

        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        if current_user.role.value == "teacher" and material.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only extract text from your own lesson materials"
            )

        if material.material_type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot extract text from {material.material_type.value} materials"
            )

        from app.services.file_processor import process_lesson_material

        extracted_text = await process_lesson_material(
            material.file_path,
            material.material_type.value
        )

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
    try:
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


class GenerateTestsRequest(BaseModel):
    use_openai: bool = Field(True, description="Use OpenAI (true) or Anthropic (false)")


@router.post("/batch-generate-tests", response_model=dict)
async def batch_generate_tests_for_all_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    from openai import AsyncOpenAI
    import json

    try:
        tasks_result = await db.execute(
            select(Task)
            .options(selectinload(Task.lesson))
            .outerjoin(TaskTest, Task.id == TaskTest.task_id)
            .where(TaskTest.id == None)
        )
        tasks_without_tests = tasks_result.scalars().all()

        if not tasks_without_tests:
            return {
                "data": {"message": "All tasks already have tests", "processed": 0},
                "status": "success"
            }

        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        processed = 0
        failed = []

        for task in tasks_without_tests:
            try:
                prompt = f"""Create 5 test cases for this coding task. Use STDIN/STDOUT format.

Task: {task.title}
Language: {task.language.value}
Description: {task.body}

Return JSON array:
[{{"test_name": "...", "test_input": "raw stdin", "expected_output": "exact stdout"}}]

IMPORTANT: test_input and expected_output are raw text, NOT JSON.
For numbers: just "42", for multiple inputs: "5\\n10"

Return ONLY the JSON array."""

                response = await client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {"role": "system", "content": "You create test cases. Respond with valid JSON array only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=2000,
                    response_format={"type": "json_object"}
                )

                content = response.choices[0].message.content
                result = json.loads(content)
                tests_data = result.get("tests", result) if isinstance(result, dict) else result

                if not tests_data or not isinstance(tests_data, list):
                    failed.append({"task_id": task.id, "error": "Invalid response format"})
                    continue

                for idx, test_data in enumerate(tests_data[:5]):
                    test = TaskTest(
                        task_id=task.id,
                        test_name=test_data.get("test_name", f"Test {idx + 1}"),
                        test_input=str(test_data.get("test_input", "")),
                        expected_output=str(test_data.get("expected_output", "")),
                        test_type=TestType.UNIT,
                        weight=1,
                        timeout_seconds=5,
                        is_public=idx < 2
                    )
                    db.add(test)

                processed += 1

            except Exception as e:
                failed.append({"task_id": task.id, "error": str(e)})
                continue

        await db.commit()

        return {
            "data": {
                "message": f"Generated tests for {processed} tasks",
                "processed": processed,
                "failed": len(failed),
                "failed_tasks": failed[:10]
            },
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Batch generation failed: {str(e)}")


@router.post("/tasks/{task_id}/generate-tests", response_model=dict)
async def generate_tests_for_task(
    task_id: int,
    request: GenerateTestsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    from openai import AsyncOpenAI
    from anthropic import AsyncAnthropic

    try:
        task_result = await db.execute(
            select(Task)
            .options(selectinload(Task.lesson))
            .where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        if current_user.role.value == "teacher" and task.lesson.teacher_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You can only generate tests for your own tasks"
            )

        existing_tests = await db.execute(
            select(func.count(TaskTest.id)).where(TaskTest.task_id == task_id)
        )
        test_count = existing_tests.scalar()
        if test_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Task already has {test_count} tests. Delete them first if you want to regenerate."
            )

        prompt = f"""You are an expert programming instructor creating test cases for an automated Judge0 testing system.

**Task to create tests for:**
Title: {task.title}
Language: {task.language.value}
Description:
{task.body}

**CRITICAL: Input/Output Format**
Tests will be run using STDIN/STDOUT:
- test_input: Raw text that will be sent to STDIN (what the user types)
- expected_output: Exact text expected on STDOUT (what print() outputs)

**Requirements:**
1. Create exactly 5 test cases
2. Include basic tests, edge cases, and boundary conditions
3. Test input/output should be plain text, NOT JSON
4. For numbers: just the number (e.g., "42")
5. For multiple inputs: separate with newlines (e.g., "5\\n10")

**Output Format (JSON array):**
[
    {{
        "test_name": "Basic test - positive number",
        "test_input": "4",
        "expected_output": "even"
    }},
    {{
        "test_name": "Edge case - zero",
        "test_input": "0",
        "expected_output": "even"
    }}
]

Return ONLY the JSON array, no additional text."""

        tests_data = []
        if request.use_openai:
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You create test cases. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            import json
            result = json.loads(content)
            tests_data = result.get("tests", result) if isinstance(result, dict) else result
        else:
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.5,
                messages=[{"role": "user", "content": prompt}]
            )
            content = response.content[0].text
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            import json
            result = json.loads(content)
            tests_data = result.get("tests", result) if isinstance(result, dict) else result

        created_count = 0
        for idx, test_data in enumerate(tests_data):
            test = TaskTest(
                task_id=task_id,
                test_name=test_data.get("test_name", f"Test {idx + 1}"),
                test_input=test_data["test_input"],
                expected_output=test_data["expected_output"],
                test_type=TestType.UNIT,
                weight=1,
                timeout_seconds=5,
                is_public=idx < 2
            )
            db.add(test)
            created_count += 1

        await db.commit()

        return {
            "data": {
                "task_id": task_id,
                "tests_created": created_count,
                "public_tests": min(2, created_count),
                "hidden_tests": max(0, created_count - 2)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate tests: {str(e)}"
        )
