
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
import json
import httpx
import asyncio
import logging

from app.core.database import get_db
from app.core.auth import get_current_user, teacher_required, admin_required, teacher_or_admin_required
from app.core.config import settings
from app.models.lesson import Lesson
from app.models.task import Task
from app.models.user import User, UserRole
from app.models.teacher_subject_group import TeacherSubjectGroup
from app.models.lesson_material import LessonMaterial, MaterialType
from app.models.test_question import TestQuestion
from app.schemas.test_question import TestQuestionCreate
from app.schemas.lesson import LessonCreate, LessonRead, LessonUpdate, LessonList, LessonWithTasks, LessonWithRelations
from app.services.file_processor import process_multiple_materials

logger = logging.getLogger(__name__)

router = APIRouter(tags=["lessons"])


@router.post("", response_model=dict)
async def create_lesson(
    lesson_data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        lesson_dict = lesson_data.model_dump()
        if current_user.role == "teacher":
            lesson_dict["teacher_id"] = current_user.id

        lesson = Lesson(**lesson_dict)
        db.add(lesson)
        await db.commit()
        await db.refresh(lesson)

        return {
            "data": LessonRead(
                id=lesson.id,
                title=lesson.title,
                description=lesson.description,
                subject_id=lesson.subject_id,
                teacher_id=lesson.teacher_id,
                created_at=lesson.created_at,
                updated_at=lesson.updated_at,
            ),
            "status": "success"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create lesson: {str(e)}"
        )


@router.get("", response_model=dict)
async def get_lessons(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    subject_id: Optional[int] = Query(None, description="Filter by subject"),
    teacher_id: Optional[int] = Query(None, description="Filter by teacher"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Lesson).options(
            selectinload(Lesson.subject),
            selectinload(Lesson.teacher)
        )

        if current_user.role == "teacher":
            query = query.where(Lesson.teacher_id == current_user.id)
        elif current_user.role == "student":
            pass

        if subject_id:
            query = query.where(Lesson.subject_id == subject_id)
        if teacher_id and current_user.role == "admin":
            query = query.where(Lesson.teacher_id == teacher_id)

        count_query = select(func.count(Lesson.id))
        if subject_id:
            count_query = count_query.where(Lesson.subject_id == subject_id)
        if teacher_id:
            count_query = count_query.where(Lesson.teacher_id == teacher_id)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * size
        query = query.offset(offset).limit(size).order_by(
            Lesson.order.asc().nulls_last(),
            Lesson.created_at.asc()
        )

        result = await db.execute(query)
        lessons = result.scalars().all()

        return {
            "data": LessonList(
                lessons=[LessonRead.model_validate(lesson) for lesson in lessons],
                total=total,
                page=page,
                size=size
            ),
            "status": "success"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lessons: {str(e)}"
        )


@router.get("/{lesson_id}", response_model=dict)
async def get_lesson(
    lesson_id: int,
    include_tasks: bool = Query(False, description="Include tasks in response"),
    include_relations: bool = Query(False, description="Include subject and teacher details"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(Lesson)

        if include_tasks and include_relations:
            query = query.options(
                selectinload(Lesson.tasks),
                selectinload(Lesson.subject),
                selectinload(Lesson.teacher)
            )
        elif include_tasks:
            query = query.options(selectinload(Lesson.tasks))
        elif include_relations:
            query = query.options(
                selectinload(Lesson.subject),
                selectinload(Lesson.teacher)
            )

        query = query.where(Lesson.id == lesson_id)
        result = await db.execute(query)
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )

        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only access your own lessons")
        elif current_user.role == "student":
            pass

        if include_tasks and include_relations:
            return {
                "data": LessonWithRelations.model_validate(lesson),
                "status": "success"
            }
        elif include_tasks:
            return {
                "data": LessonWithTasks.model_validate(lesson),
                "status": "success"
            }
        else:
            return {
                "data": LessonRead.model_validate(lesson),
                "status": "success"
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch lesson: {str(e)}"
        )


@router.put("/{lesson_id}", response_model=dict)
async def update_lesson(
    lesson_id: int,
    lesson_data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )

        if current_user.role == "teacher" and lesson.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied: You can only update your own lessons")

        update_data = lesson_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lesson, field, value)

        await db.commit()
        await db.refresh(lesson)

        return {
            "data": LessonRead.model_validate(lesson),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update lesson: {str(e)}"
        )


@router.delete("/{lesson_id}", response_model=dict)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_or_admin_required)
):
    try:
        tasks_result = await db.execute(
            select(func.count(Task.id)).where(Task.lesson_id == lesson_id)
        )
        task_count = tasks_result.scalar()

        if task_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete lesson with {task_count} tasks. Remove tasks first."
            )

        result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(
                status_code=404,
                detail="Lesson not found"
            )

        if current_user.role == UserRole.TEACHER:
            can_delete = False

            if lesson.teacher_id == current_user.id:
                can_delete = True
            else:
                assignment_check = await db.execute(
                    select(TeacherSubjectGroup).where(
                        TeacherSubjectGroup.subject_id == lesson.subject_id,
                        TeacherSubjectGroup.teacher_id == current_user.id
                    )
                )
                if assignment_check.scalar_one_or_none():
                    can_delete = True

            if not can_delete:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You can only delete lessons from courses you teach"
                )

        await db.delete(lesson)
        await db.commit()

        return {
            "data": {"message": f"Lesson {lesson_id} deleted successfully"},
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete lesson: {str(e)}"
        )


@router.post("/{lesson_id}/generate-questions", response_model=dict)
async def generate_questions_from_materials(
    lesson_id: int,
    request: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        count = request.get("count", 40)
        if count < 1 or count > 100:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 100")

        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == UserRole.TEACHER:
            if lesson.teacher_id != current_user.id:
                assignment_check = await db.execute(
                    select(TeacherSubjectGroup).where(
                        TeacherSubjectGroup.subject_id == lesson.subject_id,
                        TeacherSubjectGroup.teacher_id == current_user.id
                    )
                )
                if not assignment_check.scalar_one_or_none():
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: You can only generate questions for lessons you teach"
                    )

        old_questions_result = await db.execute(
            select(TestQuestion).where(TestQuestion.lesson_id == lesson_id)
        )
        old_questions = old_questions_result.scalars().all()
        if old_questions:
            logger.info(f"Deleting {len(old_questions)} old questions for lesson {lesson_id} before generating new ones")
            for old_q in old_questions:
                await db.delete(old_q)
            await db.commit()
            logger.info(f"Deleted {len(old_questions)} old questions")

        materials_result = await db.execute(
            select(LessonMaterial).where(
                and_(
                    LessonMaterial.lesson_id == lesson_id,
                    LessonMaterial.use_for_ai_generation == True
                )
            )
        )
        materials = materials_result.scalars().all()

        logger.info(f"Found {len(materials)} materials with use_for_ai_generation=True for lesson {lesson_id}")
        for m in materials:
            logger.info(f"Material {m.id}: type={m.type.value}, title={m.title}, has_content={bool(m.content)}, has_extracted_text={bool(m.extracted_text)}, has_file_url={bool(m.file_url)}")

        if not materials:
            all_materials_result = await db.execute(
                select(LessonMaterial).where(LessonMaterial.lesson_id == lesson_id)
            )
            all_materials = all_materials_result.scalars().all()
            logger.warning(f"Lesson {lesson_id} has {len(all_materials)} total materials, but none marked for AI generation")
            if all_materials:
                material_info = [f"{m.title} (use_for_ai={m.use_for_ai_generation})" for m in all_materials]
                raise HTTPException(
                    status_code=400,
                    detail=f"No materials available for AI generation. Found {len(all_materials)} materials but none marked with use_for_ai_generation=true. Materials: {', '.join(material_info)}"
                )
            raise HTTPException(
                status_code=400,
                detail="No materials available for AI generation. Please add materials (text or documents) to the lesson first."
            )

        non_extractable = [
            m for m in materials
            if m.type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX, MaterialType.TXT, MaterialType.TEXT]
        ]
        if non_extractable:
            types = [m.type.value for m in non_extractable]
            raise HTTPException(
                status_code=400,
                detail=f"Cannot extract text from materials of type: {', '.join(types)}. Only PDF, PPTX, DOCX, TXT, and TEXT are supported."
            )

        combined_text = await process_multiple_materials(materials, db_session=db)

        logger.info(f"Extracted text length: {len(combined_text) if combined_text else 0} characters")

        if not combined_text or len(combined_text.strip()) < 100:
            material_info = [
                f"{m.title} (type: {m.type.value}, has_content: {bool(m.content)}, has_extracted_text: {bool(m.extracted_text)}, has_file_url: {bool(m.file_url)})"
                for m in materials
            ]
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient text content in materials for AI generation. Minimum 100 characters required. "
                       f"Found {len(combined_text.strip()) if combined_text else 0} characters. "
                       f"Materials: {', '.join(material_info)}"
            )

        if not settings.OPENAI_API_KEY:
            logger.error(f"CRITICAL: OPENAI_API_KEY is not set in settings! Generation will fail.")
        else:
            logger.info(f"OPENAI_API_KEY is present (length: {len(settings.OPENAI_API_KEY)})")

        try:
            questions = await _generate_questions_with_ai(
                material_text=combined_text,
                lesson_title=lesson.title,
                lesson_description=lesson.description or "",
                count=count
            )
        except Exception as e:
            logger.error(f"Failed to generate questions: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {str(e)}"
            )

        return {
            "data": {
                "lesson_id": lesson_id,
                "questions": questions,
                "count": len(questions)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate questions: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate questions: {str(e)}"
        )


async def _generate_questions_with_ai(
    material_text: str,
    lesson_title: str,
    lesson_description: str,
    count: int = 40
) -> List[dict]:
    num_batches = min(5, max(2, (count + 9) // 10))
    batch_size = count // num_batches
    batches = [batch_size] * (num_batches - 1)
    batches.append(count - sum(batches))

    async def generate_batch(batch_count: int, batch_num: int) -> List[dict]:
        material_chunk = material_text[:5000] if len(material_text) > 5000 else material_text

        prompt = f"""Сгенерируй {batch_count} академически правильных вопросов с множественным выбором на русском языке.

Тема урока: {lesson_title}
Описание: {lesson_description or 'Не указано'}
Теоретический материал: {material_chunk}

ТРЕБОВАНИЯ К КАЧЕСТВУ:
- Вопросы должны быть академически корректными, четко сформулированными и понятными
- Каждый вопрос должен проверять понимание конкретной концепции из материала
- Варианты ответов должны быть логичными и содержательными
- Правильный ответ должен быть однозначно верным
- Неправильные ответы должны быть правдоподобными, но явно неверными
- Сложность: средняя (не слишком простые, не слишком сложные)
- Язык: грамотный русский, академический стиль

Формат JSON (строго соблюдай):
[{{"question_text": "Четко сформулированный вопрос", "options": ["Вариант A", "Вариант B", "Вариант C", "Вариант D"], "correct_answer_index": 0, "explanation": "Краткое объяснение правильного ответа"}}]

ВАЖНО: Отвечай ТОЛЬКО валидным JSON массивом без markdown, без дополнительного текста."""

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "Ты опытный преподаватель и эксперт по созданию академических тестов. Твои вопросы должны быть академически безупречными, четко сформулированными и проверять реальное понимание материала. Отвечай ТОЛЬКО валидным JSON массивом без markdown. Все на русском языке."
                },
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 4000,
            "temperature": 0.3
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            for attempt in range(2):
                try:
                    response = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()

                    data = response.json()
                    content = data["choices"][0]["message"]["content"].strip()

                    if content.startswith("```json"):
                        content = content[7:]
                    if content.startswith("```"):
                        content = content[3:]
                    if content.endswith("```"):
                        content = content[:-3]
                    content = content.strip()

                    questions = json.loads(content)

                    formatted = []
                    for q in questions:
                        if not isinstance(q, dict):
                            continue
                        question_text = q.get("question_text") or q.get("question") or q.get("text")
                        options = q.get("options") or q.get("answers") or []
                        correct_index = q.get("correct_answer_index") or q.get("correct_index") or 0
                        explanation = q.get("explanation") or ""

                        if question_text and len(options) == 4:
                            formatted.append({
                                "question_text": question_text,
                                "options": options[:4],
                                "correct_answer_index": int(correct_index) % 4,
                                "explanation": explanation
                            })

                    logger.info(f"Batch {batch_num}: Generated {len(formatted)} questions")
                    return formatted

                except Exception as e:
                    if attempt == 1:
                        logger.exception(f"Batch {batch_num} failed permanently after 2 attempts.")
                        if hasattr(e, 'response') and e.response:
                            logger.error(f"Error Response Status: {e.response.status_code}")
                            logger.error(f"Error Response Body: {e.response.text}")
                        return []
                    await asyncio.sleep(0.3)

        return []

    batch_results = await asyncio.gather(
        *[generate_batch(batches[i], i + 1) for i in range(num_batches)],
        return_exceptions=True
    )

    all_questions = []
    for result in batch_results:
        if isinstance(result, list):
            all_questions.extend(result)
        elif isinstance(result, Exception):
            logger.error(f"Batch failed with exception: {str(result)}")

    if len(all_questions) < count * 0.8:
        logger.warning(f"Only got {len(all_questions)} questions, generating more...")
        additional = await generate_batch(count - len(all_questions), num_batches + 1)
        all_questions.extend(additional)

    logger.info(f"Total generated: {len(all_questions)} questions in {num_batches} parallel batches")
    return all_questions[:count]


@router.post("/{lesson_id}/questions", response_model=dict, status_code=201)
async def create_question(
    lesson_id: int,
    question_data: TestQuestionCreate,
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

        if current_user.role == UserRole.TEACHER:
            if lesson.teacher_id != current_user.id:
                assignment_check = await db.execute(
                    select(TeacherSubjectGroup).where(
                        TeacherSubjectGroup.subject_id == lesson.subject_id,
                        TeacherSubjectGroup.teacher_id == current_user.id
                    )
                )
                if not assignment_check.scalar_one_or_none():
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: You can only create questions for lessons you teach"
                    )

        if len(question_data.options) < 2:
            raise HTTPException(status_code=400, detail="At least 2 options are required")

        if question_data.correct_answer < 0 or question_data.correct_answer >= len(question_data.options):
            raise HTTPException(status_code=400, detail="Invalid correct_answer index")

        question = TestQuestion(
            lesson_id=lesson_id,
            question=question_data.question,
            options=question_data.options,
            correct_answer=question_data.correct_answer,
            explanation=question_data.explanation,
            topic=question_data.topic,
            difficulty=question_data.difficulty or "medium"
        )

        db.add(question)
        await db.commit()
        await db.refresh(question)

        logger.info(f"Created question {question.id} for lesson {lesson_id}")

        return {
            "data": {
                "id": question.id,
                "question": question.question,
                "options": question.options,
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
                "topic": question.topic,
                "difficulty": question.difficulty
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create question: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create question: {str(e)}"
        )


@router.get("/{lesson_id}/questions", response_model=dict)
async def get_lesson_questions(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == UserRole.STUDENT:
            raise HTTPException(
                status_code=403,
                detail="Access denied: Students should use /tests/lessons/{lesson_id}/questions for random questions"
            )

        if current_user.role == UserRole.TEACHER:
            if lesson.teacher_id != current_user.id:
                assignment_check = await db.execute(
                    select(TeacherSubjectGroup).where(
                        TeacherSubjectGroup.subject_id == lesson.subject_id,
                        TeacherSubjectGroup.teacher_id == current_user.id
                    )
                )
                if not assignment_check.scalar_one_or_none():
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: You can only view questions for lessons you teach"
                    )

        questions_result = await db.execute(
            select(TestQuestion).where(TestQuestion.lesson_id == lesson_id)
        )
        questions = questions_result.scalars().all()

        logger.info(f"Retrieved {len(questions)} questions for lesson {lesson_id}")

        return {
            "data": {
                "questions": [
                    {
                        "id": q.id,
                        "question": q.question,
                        "options": q.options,
                        "correct_answer": q.correct_answer,
                        "explanation": q.explanation,
                        "topic": q.topic,
                        "difficulty": q.difficulty
                    }
                    for q in questions
                ],
                "total": len(questions)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get questions for lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get questions: {str(e)}"
        )


async def _generate_practice_tasks_with_ai(
    material_text: str,
    lesson_title: str,
    lesson_description: str,
    count: int = 30
) -> List[dict]:
    prompt = f"""Ты - эксперт по созданию образовательного контента. Сгенерируй {count} высококачественных практических заданий по программированию на основе следующих материалов урока.

Название урока: {lesson_title}
Описание урока: {lesson_description}

Материалы:
{material_text[:8000]}

Требования:
1. Задания должны быть академически правильными и полными
2. Каждое задание должно быть конкретным и понятным
3. Задания должны быть связаны с темой и теорией урока (если тема про массивы, то задания про массивы; если про функции, то про функции и т.д.)
4. Каждое задание должно содержать:
   - Номер и название задания (например, "Задание 1. Работа с массивами")
   - Четкое описание задачи в виде ЕДИНОГО ТЕКСТА БЕЗ НУМЕРАЦИИ (НЕ используй нумерованные списки 1., 2., 3. и т.д.)
5. НЕ упоминай создание файлов! Студенты работают в онлайн компиляторе. Вместо "Создай файл" используй формулировки:
   - "Напишите программу, которая..."
   - "Напишите код, который..."
   - "Реализуйте программу, которая..."
   - "Создайте программу, которая..."
6. Задания должны быть разного уровня сложности (от простых к более сложным)
7. Задания должны проверять понимание и практическое применение материала
8. ВСЕ задания должны быть на РУССКОМ ЯЗЫКЕ
9. Задания должны быть для языка программирования Python (если не указано иное)
10. ВАЖНО: Описание задания должно быть единым текстом, без нумерованных списков. Все требования должны быть описаны в одном абзаце.

Пример хорошего задания:
Задание 1. Проверка существования треугольника

Напишите программу, которая запрашивает у пользователя три числа и определяет, может ли быть составлен треугольник с такими сторонами (используя теорему существования треугольника: сумма любых двух сторон должна быть больше третьей).

Верни ТОЛЬКО валидный JSON массив с такой структурой:
[
  {{
    "title": "Задание 1. Название задания",
    "body": "Полное описание задания единым текстом без нумерации (без 1., 2., 3. и т.д.)",
    "language": "python"
  }},
  {{
    "title": "Задание 2. Название задания",
    "body": "Полное описание задания единым текстом без нумерации (без 1., 2., 3. и т.д.)",
    "language": "python"
  }},
  ...
]

ВАЖНО: Поле "body" должно содержать описание задания как ЕДИНЫЙ ТЕКСТ без нумерованных списков. Не используй 1., 2., 3. и т.д. Все требования должны быть описаны в одном абзаце.

Не включай никакого markdown форматирования, блоков кода или дополнительного текста. Верни ТОЛЬКО JSON массив."""

    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "Ты эксперт по созданию образовательного контента. Всегда отвечай только валидным JSON без markdown форматирования или дополнительного текста. Все задания должны быть на русском языке, полными и понятными. НИКОГДА не упоминай создание файлов - студенты работают в онлайн компиляторе. Используй формулировки: 'Напишите программу', 'Напишите код', 'Реализуйте программу' и т.д. ВАЖНО: Описание задания (поле 'body') должно быть ЕДИНЫМ ТЕКСТОМ без нумерованных списков (1., 2., 3. и т.д.). Все требования должны быть описаны в одном абзаце."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 8000,
        "temperature": 0.7
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        for attempt in range(3):
            try:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()

                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()

                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()

                tasks = json.loads(content)

                formatted_tasks = []
                for task in tasks:
                    if not isinstance(task, dict):
                        continue

                    title = task.get("title") or task.get("name") or ""
                    body = task.get("body") or task.get("description") or task.get("text") or ""
                    language = task.get("language") or "python"

                    if not title or not body:
                        continue

                    formatted_tasks.append({
                        "title": title,
                        "body": body,
                        "language": language
                    })

                logger.info(f"Generated {len(formatted_tasks)} practice tasks")
                return formatted_tasks

            except json.JSONDecodeError as e:
                logger.warning(f"JSON decode error on attempt {attempt + 1}: {str(e)}")
                logger.warning(f"Response content: {content[:500]}")
                if attempt == 2:
                    raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
                await asyncio.sleep(2 ** attempt)
            except Exception as e:
                logger.warning(f"API call failed on attempt {attempt + 1}: {str(e)}")
                if attempt == 2:
                    logger.exception("AI generation for practice tasks failed after 3 attempts.")
                    if hasattr(e, 'response') and e.response:
                        logger.error(f"Error Response Status: {e.response.status_code}")
                        logger.error(f"Error Response Body: {e.response.text}")
                    raise
                await asyncio.sleep(2 ** attempt)

    raise Exception("Failed to generate practice tasks after 3 attempts")


@router.post("/{lesson_id}/generate-practice-tasks", response_model=dict)
async def generate_practice_tasks_from_materials(
    lesson_id: int,
    request: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(teacher_required)
):
    try:
        count = request.get("count", 20)
        if count < 1 or count > 50:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 50")

        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()

        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        if current_user.role == UserRole.TEACHER:
            if lesson.teacher_id != current_user.id:
                assignment_check = await db.execute(
                    select(TeacherSubjectGroup).where(
                        TeacherSubjectGroup.subject_id == lesson.subject_id,
                        TeacherSubjectGroup.teacher_id == current_user.id
                    )
                )
                if not assignment_check.scalar_one_or_none():
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: You can only generate tasks for lessons you teach"
                    )

        materials_result = await db.execute(
            select(LessonMaterial).where(
                and_(
                    LessonMaterial.lesson_id == lesson_id,
                    LessonMaterial.use_for_ai_generation == True
                )
            )
        )
        materials = materials_result.scalars().all()

        logger.info(f"Found {len(materials)} materials marked for AI generation for lesson {lesson_id}")

        if not materials:
            raise HTTPException(
                status_code=400,
                detail="No materials available for AI generation. Please ensure materials are marked with 'use_for_ai_generation=true' and contain sufficient text."
            )

        non_extractable = [
            m for m in materials
            if m.type not in [MaterialType.PDF, MaterialType.PPTX, MaterialType.DOCX, MaterialType.TXT, MaterialType.TEXT]
        ]
        if non_extractable:
            types = [m.type.value for m in non_extractable]
            raise HTTPException(
                status_code=400,
                detail=f"Cannot extract text from materials of type: {', '.join(types)}. Only PDF, PPTX, DOCX, TXT, and TEXT are supported."
            )

        combined_text = await process_multiple_materials(materials, db_session=db)

        logger.info(f"Extracted text length: {len(combined_text) if combined_text else 0} characters")

        for material in materials:
            logger.info(f"Material {material.id} (type={material.type.value}, title={material.title}): "
                       f"has_extracted_text={bool(material.extracted_text)}, "
                       f"extracted_text_length={len(material.extracted_text) if material.extracted_text else 0}, "
                       f"use_for_ai={material.use_for_ai_generation}")

        if not combined_text or len(combined_text.strip()) < 100:
            error_details = []
            for material in materials:
                has_content = bool(material.content and material.content.strip())
                has_extracted_text = bool(material.extracted_text and material.extracted_text.strip())
                has_file_url = bool(material.file_url)
                error_details.append(
                    f"{material.title} (type: {material.type.value}, "
                    f"has_content: {has_content}, "
                    f"has_extracted_text: {has_extracted_text}, "
                    f"has_file_url: {has_file_url})"
                )

            detail_msg = (
                f"Insufficient text content in materials for AI generation. "
                f"Minimum 100 characters required. Found {len(combined_text.strip()) if combined_text else 0} characters. "
                f"Materials: {', '.join(error_details)}"
            )

            raise HTTPException(
                status_code=400,
                detail=detail_msg
            )

        try:
            tasks = await _generate_practice_tasks_with_ai(
                material_text=combined_text,
                lesson_title=lesson.title,
                lesson_description=lesson.description or "",
                count=count
            )
            logger.info(f"Successfully generated {len(tasks)} practice tasks for lesson {lesson_id}")
        except Exception as e:
            logger.error(f"AI generation failed for lesson {lesson_id}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {str(e)}"
            )

        return {
            "data": {
                "lesson_id": lesson_id,
                "tasks": tasks,
                "count": len(tasks)
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate practice tasks for lesson {lesson_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate practice tasks: {str(e)}"
        )