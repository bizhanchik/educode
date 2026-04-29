
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.task import Task
from app.models.ai_solution import AISolution, AIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    pass


class AIService:

    def __init__(self):
        self.openai_api_key = settings.OPENAI_API_KEY
        self.anthropic_api_key = settings.ANTHROPIC_API_KEY
        self.openai_base_url = "https://api.openai.com/v1"
        self.anthropic_base_url = "https://api.anthropic.com/v1"
        if not self.openai_api_key:
            logger.error("[AI] OpenAI API Key is NOT SET!")
        else:
            logger.info(f"[AI] OpenAI API Key is set (len: {len(self.openai_api_key)})")

    async def generate_ai_solutions(self, task_id: int, db: AsyncSession) -> List[AISolution]:
        logger.info(f"[AI] Starting solution generation for task {task_id}")

        task = await self._get_task(task_id, db)
        if not task:
            raise AIServiceError(f"Task {task_id} not found")

        existing_solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        existing_list = existing_solutions.scalars().all()
        if existing_list:
            logger.warning(f"[AI] Solutions already exist for task {task_id}")
            return existing_list

        solutions = []

        try:
            openai_solutions = await self._generate_openai_solutions(task, db)
            solutions.extend(openai_solutions)

            anthropic_solution = await self._generate_anthropic_solution(task, db)
            solutions.append(anthropic_solution)

            logger.info(f"[AI] Generated {len(solutions)} reference codes for task {task_id}")
            return solutions

        except Exception as e:
            logger.error(f"[AI] Failed to generate solutions for task {task_id}: {str(e)}")
            await db.rollback()
            raise AIServiceError(f"Solution generation failed: {str(e)}")

    async def _generate_openai_solutions(self, task: Task, db: AsyncSession) -> List[AISolution]:
        solutions = []

        prompts = [
            f"Solve this {task.language} programming problem:\n\nTitle: {task.title}\n\nDescription: {task.body}\n\nProvide a clean, working solution with comments.",
            f"Solve this {task.language} programming problem using a different approach:\n\nTitle: {task.title}\n\nDescription: {task.body}\n\nUse a different algorithm or data structure than a typical solution.",
            f"Solve this {task.language} programming problem in yet another distinct way:\n\nTitle: {task.title}\n\nDescription: {task.body}\n\nFocus on code readability and efficiency."
        ]

        for i, prompt in enumerate(prompts, 1):
            try:
                response = await self._call_openai_api(prompt)

                solution = AISolution(
                    task_id=task.id,
                    provider=AIProvider.OPENAI,
                    variant_index=i,
                    code=response["code"],
                    meta=json.dumps({
                        "model": response.get("model", "gpt-4o-mini"),
                        "prompt": prompt,
                        "tokens": response.get("tokens", 0),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                )

                db.add(solution)
                await db.commit()
                await db.refresh(solution)
                solutions.append(solution)

                logger.info(f"[AI] Generated OpenAI solution {i}/3 for task {task.id}")

                await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"[AI] Failed to generate OpenAI solution {i}: {str(e)}")
                raise

        return solutions

    async def _generate_anthropic_solution(self, task: Task, db: AsyncSession) -> AISolution:
        prompt = f"Solve this {task.language} programming problem:\n\nTitle: {task.title}\n\nDescription: {task.body}\n\nProvide a clean, efficient solution with clear comments explaining the approach."

        try:
            response = await self._call_anthropic_api(prompt)

            solution = AISolution(
                task_id=task.id,
                provider=AIProvider.ANTHROPIC,
                variant_index=1,
                code=response["code"],
                meta=json.dumps({
                    "model": response.get("model", "claude-3-sonnet-20240229"),
                    "prompt": prompt,
                    "tokens": response.get("tokens", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            )

            db.add(solution)
            await db.commit()
            await db.refresh(solution)

            logger.info(f"[AI] Generated Anthropic solution for task {task.id}")
            return solution

        except Exception as e:
            logger.error(f"[AI] Failed to generate Anthropic solution: {str(e)}")
            raise

    async def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": "You are a programming expert. Provide only the code solution without explanations or markdown formatting."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(3):
                try:
                    response = await client.post(
                        f"{self.openai_base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()

                    data = response.json()
                    code = data["choices"][0]["message"]["content"].strip()

                    return {
                        "code": code,
                        "model": data["model"],
                        "tokens": data["usage"]["total_tokens"]
                    }

                except Exception as e:
                    logger.warning(f"[AI] OpenAI API attempt {attempt + 1} failed: {str(e)}")
                    if attempt == 2:
                        logger.exception(f"[AI] OpenAI API failed after 3 attempts.")
                        error_msg = f"OpenAI API failed: {str(e)}"
                        if hasattr(e, 'response') and e.response:
                            error_msg += f" | Status: {e.response.status_code} | Body: {e.response.text}"
                        raise AIServiceError(error_msg)
                    await asyncio.sleep(2 ** attempt)

    async def _call_anthropic_api(self, prompt: str) -> Dict[str, Any]:
        headers = {
            "x-api-key": self.anthropic_api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        payload = {
            "model": "claude-3-sonnet-20240229",
            "max_tokens": 1000,
            "messages": [
                {"role": "user", "content": f"You are a programming expert. Solve this problem and provide only the code solution without explanations or markdown formatting.\n\n{prompt}"}
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(3):
                try:
                    response = await client.post(
                        f"{self.anthropic_base_url}/messages",
                        headers=headers,
                        json=payload
                    )
                    response.raise_for_status()

                    data = response.json()
                    code = data["content"][0]["text"].strip()

                    return {
                        "code": code,
                        "model": data["model"],
                        "tokens": data["usage"]["output_tokens"] + data["usage"]["input_tokens"]
                    }

                except Exception as e:
                    logger.warning(f"[AI] Anthropic API attempt {attempt + 1} failed: {str(e)}")
                    if attempt == 2:
                        error_msg = f"Anthropic API failed after 3 attempts: {str(e)}"
                        if hasattr(e, 'response') and e.response:
                            error_msg += f" | Status: {e.response.status_code} | Body: {e.response.text}"
                        logger.error(f"[AI] {error_msg}")
                        raise AIServiceError(error_msg)
                    await asyncio.sleep(2 ** attempt)

    async def get_ai_reference_codes(self, task_id: int, db: AsyncSession) -> List[str]:
        solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        return [solution.code for solution in solutions.scalars().all()]

    async def request_final_grade(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger.info(f"[AI] Requesting final grade for submission")

        prompt = f"""You are a strict but fair programming teacher grading student code originality.

Task: {context.get('task_title', 'Programming Assignment')}
Correctness score: {context.get('correctness_score', 100)}/100
AI similarity: {context.get('ai_similarity', 0.0):.3f}
Group similarity: {context.get('intra_group_similarity', 0.0):.3f}

Grade the submission considering:
- Correctness (how well it solves the problem)
- Originality (lower similarity to AI/peers is better)
- Code quality and style

Return JSON response:
{{"score": <integer 1-100>, "rationale": "<brief explanation>"}}"""

        try:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a programming teacher. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 200,
                "temperature": 0.3
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.openai_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()

                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()

                try:
                    result = json.loads(content)

                    if "score" not in result or "rationale" not in result:
                        raise ValueError("Invalid response format")

                    result["score"] = max(1, min(100, int(result["score"])))

                    logger.info(f"[AI] Generated grade: {result['score']}/100")
                    return result

                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"[AI] Failed to parse grading response: {content}")
                    return self._fallback_grade(context)

        except Exception as e:
            logger.error(f"[AI] Failed to request final grade: {str(e)}")
            return self._fallback_grade(context)

    def _fallback_grade(self, context: Dict[str, Any]) -> Dict[str, Any]:
        correctness = context.get('correctness_score', 100)
        ai_similarity = context.get('ai_similarity', 0.0)
        group_similarity = context.get('intra_group_similarity', 0.0)

        ai_penalty = int(ai_similarity * 30)
        group_penalty = int(group_similarity * 20)

        final_score = max(1, correctness - ai_penalty - group_penalty)

        return {
            "score": final_score,
            "rationale": f"Fallback scoring: {correctness} correctness - {ai_penalty} AI penalty - {group_penalty} group penalty = {final_score}"
        }

    async def generate_task_tests(self, task_id: int, db: AsyncSession, num_tests: int = 5) -> List[Any]:
        from app.models.task_test import TaskTest, TestType

        logger.info(f"[AI] Starting test generation for task {task_id}")

        task = await self._get_task(task_id, db)
        if not task:
            raise AIServiceError(f"Task {task_id} not found")

        existing_tests = await db.execute(
            select(TaskTest).where(TaskTest.task_id == task_id)
        )
        existing_list = existing_tests.scalars().all()
        if existing_list:
            logger.warning(f"[AI] Tests already exist for task {task_id}, returning existing")
            return existing_list

        prompt = f"""You are a programming teacher creating test cases for student code.

Task Title: {task.title}

Task Description:
{task.body}

Programming Language: {task.language}

Generate exactly {num_tests} test cases for this task. Each test should have:
1. A descriptive name
2. Input data (as a string to be passed to stdin)
3. Expected output (what the program should print)

Return ONLY a valid JSON array with no markdown or explanation:
[
  {{"name": "Test 1 - Basic case", "input": "5\\n3", "output": "8", "is_public": true, "weight": 20}},
  {{"name": "Test 2 - Edge case", "input": "0\\n0", "output": "0", "is_public": true, "weight": 20}},
  ...
]

Rules:
- First 3 tests should be public (is_public: true) - visible to students
- Last 2 tests should be hidden (is_public: false) - for grading only
- Each test weight should sum to ~100 total
- Input should be what the program reads from stdin
- Output should exactly match what the program prints
- Include edge cases and typical cases"""

        try:
            headers = {
                "Authorization": f"Bearer {self.openai_api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a programming teacher. Generate test cases. Always respond with valid JSON array only, no markdown."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1500,
                "temperature": 0.5
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.openai_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()

                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()

                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                    content = content.strip()

                try:
                    tests_data = json.loads(content)
                except json.JSONDecodeError as e:
                    logger.error(f"[AI] Failed to parse test JSON: {content}")
                    raise AIServiceError(f"Invalid JSON response: {str(e)}")

                if not isinstance(tests_data, list) or len(tests_data) == 0:
                    raise AIServiceError("AI returned empty or invalid test list")

                created_tests = []
                for i, test_data in enumerate(tests_data):
                    test = TaskTest(
                        task_id=task_id,
                        test_name=test_data.get("name", f"Test {i+1}"),
                        test_input=test_data.get("input", ""),
                        expected_output=test_data.get("output", ""),
                        test_type=TestType.UNIT,
                        weight=test_data.get("weight", 100 // len(tests_data)),
                        is_public=test_data.get("is_public", i < 3),
                        timeout_seconds=5
                    )
                    db.add(test)
                    created_tests.append(test)

                await db.commit()

                for test in created_tests:
                    await db.refresh(test)

                logger.info(f"[AI] Generated {len(created_tests)} tests for task {task_id}")
                return created_tests

        except AIServiceError:
            raise
        except Exception as e:
            logger.error(f"[AI] Failed to generate tests for task {task_id}: {str(e)}")
            await db.rollback()
            raise AIServiceError(f"Test generation failed: {str(e)}")

    async def _get_task(self, task_id: int, db: AsyncSession) -> Optional[Task]:
        result = await db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()


ai_service = AIService()