
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.core.config import settings
from app.models.task import ProgrammingLanguage

logger = logging.getLogger(__name__)


class TaskGenerationError(Exception):
    pass


class AITaskGenerator:

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

    async def generate_tasks_from_materials(
        self,
        material_text: str,
        subject_name: str,
        lesson_title: str,
        num_tasks: int = 3,
        languages: Optional[List[ProgrammingLanguage]] = None,
        use_openai: bool = True
    ) -> List[Dict[str, Any]]:
        if not languages:
            languages = [ProgrammingLanguage.PYTHON]

        prompt = self._build_generation_prompt(
            material_text=material_text,
            subject_name=subject_name,
            lesson_title=lesson_title,
            num_tasks=num_tasks,
            languages=languages
        )

        try:
            if use_openai and self.openai_client:
                tasks = await self._generate_with_openai(prompt)
            elif self.anthropic_client:
                tasks = await self._generate_with_anthropic(prompt)
            else:
                raise TaskGenerationError("No AI provider configured")

            logger.info(f"Successfully generated {len(tasks)} tasks for lesson '{lesson_title}'")
            return tasks

        except Exception as e:
            logger.error(f"Task generation failed: {str(e)}")
            raise TaskGenerationError(f"Failed to generate tasks: {str(e)}")

    def _build_generation_prompt(
        self,
        material_text: str,
        subject_name: str,
        lesson_title: str,
        num_tasks: int,
        languages: List[ProgrammingLanguage]
    ) -> str:

        languages_str = ", ".join([lang.value for lang in languages])

        prompt = f"""You are an expert programming instructor creating coding assignments for an automated testing system.

**Context:**
- Subject: {subject_name}
- Lesson: {lesson_title}
- Target languages: {languages_str}

**Lesson Materials:**
{material_text}

**Task:**
Generate {num_tasks} diverse coding tasks based on the lesson materials above.

**CRITICAL: Input/Output Format**
Tests will be run in an automated Judge0 system using STDIN/STDOUT:
- test_input: Raw text that will be sent to STDIN (like typing in terminal)
- expected_output: Exact text expected on STDOUT (what print() outputs)

The student's code should read from input() and write to print().

**Requirements:**
1. Each task should test understanding of concepts from the materials
2. Tasks should vary in difficulty (easy, medium, hard)
3. Include clear problem descriptions WITH INPUT/OUTPUT EXAMPLES in the task body
4. Students must see exact expected format - show 2 examples in the task body
5. Write complete, working reference solutions that use input() and print()
6. Create at least 5 test cases per task for thorough validation

**Output Format (JSON):**
Return a JSON array with {num_tasks} task objects. Each object must have:
{{
    "title": "Brief task title (max 100 chars)",
    "body": "Detailed problem description - MUST include input/output examples showing exact format",
    "language": "one of [{languages_str}]",
    "reference_solution": "Complete working code that reads input() and uses print()",
    "tests": [
        {{
            "test_name": "Descriptive test name",
            "test_input": "Raw stdin input (e.g., '5\\n10' for two lines)",
            "expected_output": "Exact stdout output (e.g., 'even')",
            "test_type": "UNIT",
            "weight": 1,
            "timeout_seconds": 5
        }}
    ]
}}

**IMPORTANT Example Task Body Format (students must see this format):**
```
Напишите программу, которая читает целое число и выводит "even" если оно чётное, или "odd" если нечётное.

**Формат входных данных:**
Одно целое число N

**Формат выходных данных:**
Строка "even" или "odd"

**Примеры:**

Пример 1:
Ввод:
4
Вывод:
even

Пример 2:
Ввод:
7
Вывод:
odd

**Ограничения:**
- -1000 ≤ N ≤ 1000
```

**Example Reference Solution:**
```python
n = int(input())
if n % 2 == 0:
    print("even")
else:
    print("odd")
```

**Example Tests for this task:**
- test_input: "4", expected_output: "even"
- test_input: "7", expected_output: "odd"
- test_input: "0", expected_output: "even"
- test_input: "-3", expected_output: "odd"
- test_input: "1000", expected_output: "even"

Generate {num_tasks} tasks following this exact format. Return ONLY the JSON array, no additional text."""

        return prompt

    async def _generate_with_openai(self, prompt: str) -> List[Dict[str, Any]]:
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert programming instructor. Always respond with valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            if isinstance(result, dict) and "tasks" in result:
                tasks = result["tasks"]
            elif isinstance(result, list):
                tasks = result
            else:
                raise ValueError("Unexpected response format")

            return self._validate_tasks(tasks)

        except Exception as e:
            logger.error(f"OpenAI generation failed: {str(e)}")
            raise TaskGenerationError(f"OpenAI generation failed: {str(e)}")

    async def _generate_with_anthropic(self, prompt: str) -> List[Dict[str, Any]]:
        try:
            response = await self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4000,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
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

            result = json.loads(content)

            if isinstance(result, dict) and "tasks" in result:
                tasks = result["tasks"]
            elif isinstance(result, list):
                tasks = result
            else:
                raise ValueError("Unexpected response format")

            return self._validate_tasks(tasks)

        except Exception as e:
            logger.error(f"Anthropic generation failed: {str(e)}")
            raise TaskGenerationError(f"Anthropic generation failed: {str(e)}")

    def _validate_tasks(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        required_fields = ["title", "body", "language", "reference_solution", "tests"]

        for i, task in enumerate(tasks):
            for field in required_fields:
                if field not in task:
                    raise ValueError(f"Task {i} missing required field: {field}")

            try:
                ProgrammingLanguage(task["language"].lower())
            except ValueError:
                logger.warning(f"Invalid language '{task['language']}' in task {i}, defaulting to python")
                task["language"] = "python"

            if not isinstance(task["tests"], list) or len(task["tests"]) < 3:
                raise ValueError(f"Task {i} must have at least 3 tests")

            for j, test in enumerate(task["tests"]):
                test_required = ["test_name", "test_input", "expected_output"]
                for field in test_required:
                    if field not in test:
                        raise ValueError(f"Task {i}, test {j} missing required field: {field}")

                test.setdefault("test_type", "UNIT")
                test.setdefault("weight", 1)
                test.setdefault("timeout_seconds", 5)

        return tasks


ai_task_generator = AITaskGenerator()
