import asyncio
import json
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.core.database import get_db
from app.core.auth import get_current_user, student_required
from app.models.practice_result import PracticeResult
from app.models.task import Task
from app.models.lesson import Lesson
from app.models.submission import Submission
from app.models.user import User, UserRole
from app.schemas.practice_result import (
    CodeExecuteRequest,
    CodeExecuteResponse,
    CodeEvaluateRequest,
    CodeEvaluateResponse,
    TestResultDetail,
    PracticeResultCreate,
    PracticeResultRead,
    TaskTestRunRequest,
    TaskTestRunResponse,
    SingleTestResult
)
from app.models.task_test import TaskTest

router = APIRouter(tags=["code-execution"])


@router.post("/execute", response_model=dict)
async def execute_code(
    request: CodeExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        from app.services.judge0_service import (
            Judge0Service,
            Judge0LanguageNotSupported,
            Judge0ServiceError
        )

        judge0_service = Judge0Service()

        try:
            language_id = judge0_service.map_language_to_id(request.language)
        except Judge0LanguageNotSupported:
            raise HTTPException(
                status_code=400,
                detail=f"Language '{request.language}' not supported by Judge0. Supported: python, javascript, java, cpp, csharp, dart"
            )

        result = await judge0_service.submit_code(
            source_code=request.code,
            language_id=language_id,
            stdin=""
        )

        status_id = result.get("status", {}).get("id", 0)
        exit_code = 0 if status_id == 3 else 1

        return {
            "data": CodeExecuteResponse(
                stdout=result.get("stdout", ""),
                stderr=result.get("stderr", "") or result.get("compile_output", ""),
                exit_code=exit_code,
                time=result.get("time"),
                memory=result.get("memory")
            ),
            "status": "success"
        }

    except HTTPException:
        raise
    except Judge0ServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Code execution service unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Execution failed: {str(e)}"
        )


@router.post("/evaluate", response_model=dict)
async def evaluate_code(request: CodeEvaluateRequest):
    try:
        from app.services.judge0_service import Judge0Service, Judge0LanguageNotSupported, Judge0ServiceError

        judge0_service = Judge0Service()

        try:
            judge0_service.map_language_to_id(request.language)
        except Judge0LanguageNotSupported:
            raise HTTPException(
                status_code=400,
                detail=f"Language '{request.language}' not supported. Supported: python, javascript, java, cpp, csharp, dart"
            )

        tests_formatted = [
            {"input": test.input, "expected_output": test.output}
            for test in request.tests
        ]

        results = await judge0_service.run_tests(
            source_code=request.student_code,
            language=request.language,
            tests=tests_formatted
        )

        enhanced_results = []
        for i, (result, original_test) in enumerate(zip(results, request.tests)):
            enhanced_results.append({
                "test_number": i + 1,
                "input": original_test.input,
                "expected_output": original_test.output,
                "actual_output": result.get("actual_output", ""),
                "passed": result.get("passed", False),
                "time": result.get("time"),
                "memory": result.get("memory"),
                "stderr": result.get("stderr"),
                "is_public": original_test.is_public
            })

        passed_tests = sum(1 for r in enhanced_results if r["passed"])
        total_tests = len(enhanced_results)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0.0
        total_time_ms = sum(r.get("time", 0) or 0 for r in enhanced_results) * 1000

        return {
            "data": {
                "language": request.language,
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": total_tests - passed_tests,
                "success_rate": round(success_rate, 2),
                "execution_time_ms": round(total_time_ms, 2),
                "results": enhanced_results
            },
            "status": "success"
        }

    except HTTPException:
        raise
    except Judge0ServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Code execution service error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )


@router.post("/tasks/{task_id}/run-tests", response_model=dict)
async def run_task_tests(
    task_id: int,
    request: TaskTestRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        from app.services.judge0_service import (
            Judge0Service,
            Judge0LanguageNotSupported,
            Judge0ServiceError
        )

        task_result = await db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Задание не найдено")

        tests_result = await db.execute(
            select(TaskTest)
            .where(TaskTest.task_id == task_id)
            .order_by(TaskTest.id)
        )
        task_tests = tests_result.scalars().all()

        if not task_tests:
            raise HTTPException(
                status_code=400,
                detail="У этого задания нет тестов. Обратитесь к преподавателю."
            )

        judge0_service = Judge0Service()

        try:
            judge0_service.map_language_to_id(request.language)
        except Judge0LanguageNotSupported:
            raise HTTPException(
                status_code=400,
                detail=f"Язык '{request.language}' не поддерживается. Поддерживаемые: python, javascript, java, cpp, csharp, dart"
            )

        tests_formatted = [
            {
                "input": test.test_input,
                "expected_output": test.expected_output
            }
            for test in task_tests
        ]

        judge0_results = await judge0_service.run_tests(
            source_code=request.code,
            language=request.language,
            tests=tests_formatted
        )

        results: list[SingleTestResult] = []
        total_weight = sum(test.weight for test in task_tests)
        passed_weight = 0
        total_time_ms = 0.0
        has_runtime_error = False
        has_compile_error = False

        for i, (test, judge0_result) in enumerate(zip(task_tests, judge0_results)):
            passed = judge0_result.get("passed", False)
            time_sec = judge0_result.get("time") or 0
            time_ms = time_sec * 1000
            total_time_ms += time_ms
            error = judge0_result.get("stderr", "")

            if error and "compile" in error.lower():
                has_compile_error = True
            elif error and not passed:
                has_runtime_error = True

            if passed:
                passed_weight += test.weight

            if test.is_public:
                result = SingleTestResult(
                    test_id=test.id,
                    test_name=test.test_name,
                    passed=passed,
                    is_public=True,
                    input=test.test_input,
                    expected_output=test.expected_output,
                    actual_output=judge0_result.get("actual_output", ""),
                    execution_time_ms=round(time_ms, 2),
                    memory_kb=judge0_result.get("memory"),
                    error=error if error else None
                )
            else:
                result = SingleTestResult(
                    test_id=test.id,
                    test_name=f"Скрытый тест {i + 1}",
                    passed=passed,
                    is_public=False,
                    input=None,
                    expected_output=None,
                    actual_output=None,
                    execution_time_ms=round(time_ms, 2),
                    memory_kb=judge0_result.get("memory"),
                    error="Ошибка выполнения" if error and not passed else None
                )

            results.append(result)

        score = (passed_weight / total_weight * 100) if total_weight > 0 else 0.0
        passed_tests = sum(1 for r in results if r.passed)
        failed_tests = len(results) - passed_tests

        if passed_tests == len(results):
            verdict = "Accepted"
        elif has_compile_error:
            verdict = "Compilation Error"
        elif has_runtime_error:
            verdict = "Runtime Error"
        elif failed_tests > 0:
            verdict = "Wrong Answer"
        else:
            verdict = "Unknown Error"

        response = TaskTestRunResponse(
            task_id=task_id,
            total_tests=len(results),
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            score=round(score, 2),
            verdict=verdict,
            results=results,
            execution_time_total_ms=round(total_time_ms, 2)
        )

        return {
            "data": response,
            "status": "success"
        }

    except HTTPException:
        raise
    except Judge0ServiceError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Сервис выполнения кода недоступен: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка выполнения тестов: {str(e)}"
        )


@router.post("/lessons/{lesson_id}/practice/submit", response_model=dict)
async def submit_practice(
    lesson_id: int,
    practice_data: PracticeResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(student_required)
):
    try:
        lesson_result = await db.execute(
            select(Lesson).where(Lesson.id == lesson_id)
        )
        lesson = lesson_result.scalar_one_or_none()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        task_result = await db.execute(
            select(Task).where(Task.id == practice_data.task_id, Task.lesson_id == lesson_id)
        )
        task = task_result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        student_group_query = select(User.group_id).where(User.id == current_user.id)
        student_group_result = await db.execute(student_group_query)
        student_group_id = student_group_result.scalar_one_or_none()

        other_student_codes = []
        if student_group_id:
            other_students_query = select(User.id).where(
                and_(
                    User.group_id == student_group_id,
                    User.id != current_user.id,
                    User.role == UserRole.STUDENT
                )
            )
            other_students_result = await db.execute(other_students_query)
            other_student_ids = [row[0] for row in other_students_result.all()]

            if other_student_ids:
                other_practice_query = select(PracticeResult.code).where(
                    and_(
                        PracticeResult.task_id == practice_data.task_id,
                        PracticeResult.student_id.in_(other_student_ids)
                    )
                )
                other_practice_result = await db.execute(other_practice_query)
                other_student_codes = [row[0] for row in other_practice_result.all()]

        from app.models.ai_solution import AISolution
        reference_solutions_query = select(AISolution.code).where(
            AISolution.task_id == practice_data.task_id
        )
        reference_solutions_result = await db.execute(reference_solutions_query)
        reference_solutions = [row[0] for row in reference_solutions_result.all()]

        from app.services.ai_practice_evaluator import AIPracticeEvaluator
        evaluator = AIPracticeEvaluator()
        ai_feedback = await evaluator.evaluate_code_with_all_models(
            student_code=practice_data.code,
            task_description=task.body,
            reference_solutions=reference_solutions,
            other_student_codes=other_student_codes
        )

        correctness_scores = [f["correctness"] for f in ai_feedback if isinstance(f.get("correctness"), bool)]
        correctness_rate = sum(correctness_scores) / len(correctness_scores) * 100 if correctness_scores else 0.0

        similarity_scores = [f["similarity"] for f in ai_feedback if isinstance(f.get("similarity"), (int, float))]
        avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0.0

        is_plagiarized = False
        if other_student_codes and avg_similarity > 80.0:
            from app.services.similarity_client import get_average_group_similarity
            try:
                group_similarity = await get_average_group_similarity(practice_data.code, other_student_codes)
                if group_similarity > 85.0:
                    is_plagiarized = True
            except:
                pass

        uniqueness_score = max(0.0, 100.0 - avg_similarity)
        practice_score = (correctness_rate * 0.7) + (uniqueness_score * 0.3)

        practice_result = PracticeResult(
            lesson_id=lesson_id,
            student_id=current_user.id,
            task_id=practice_data.task_id,
            code=practice_data.code,
            execution_result=practice_data.execution_result,
            ai_feedback=ai_feedback,
            similarity_score=avg_similarity,
            correctness_score=correctness_rate,
            practice_score=practice_score,
            is_plagiarized=is_plagiarized
        )

        db.add(practice_result)
        await db.commit()
        await db.refresh(practice_result)

        return {
            "data": PracticeResultRead.model_validate(practice_result),
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit practice: {str(e)}"
        )


@router.get("/lessons/{lesson_id}/practice/results", response_model=dict)
async def get_practice_results(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        query = select(PracticeResult).where(PracticeResult.lesson_id == lesson_id)

        if current_user.role == UserRole.STUDENT:
            query = query.where(PracticeResult.student_id == current_user.id)
        elif current_user.role == UserRole.TEACHER:
            lesson_result = await db.execute(
                select(Lesson).where(Lesson.id == lesson_id, Lesson.teacher_id == current_user.id)
            )
            if not lesson_result.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        results = await db.execute(query.order_by(PracticeResult.created_at.desc()))
        results_list = results.scalars().all()

        return {
            "data": [PracticeResultRead.model_validate(r) for r in results_list],
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch practice results: {str(e)}"
        )

