"""
EduCode Backend - AI Task Generation Service

Generates coding tasks from lesson materials using OpenAI GPT-4 or Anthropic Claude.
Creates task descriptions, reference solutions, and test structures.
"""

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
    """Raised when task generation fails."""
    pass


class AITaskGenerator:
    """
    AI-powered task generator.

    Uses LLMs to generate coding tasks from educational materials.
    Supports both OpenAI and Anthropic models.
    """

    def __init__(self):
        """Initialize AI clients."""
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
        """
        Generate coding tasks from lesson materials.

        Args:
            material_text: Combined text from all lesson materials
            subject_name: Name of the subject (e.g., "Algorithms")
            lesson_title: Title of the lesson
            num_tasks: Number of tasks to generate (default: 3)
            languages: List of programming languages to use (default: [PYTHON])
            use_openai: Use OpenAI (True) or Anthropic (False)

        Returns:
            List of generated tasks with structure:
            [
                {
                    "title": "Task title",
                    "body": "Task description and requirements",
                    "language": "python",
                    "reference_solution": "AI-generated solution code",
                    "tests": [
                        {
                            "test_name": "Test 1",
                            "test_input": "input data",
                            "expected_output": "expected output",
                            "test_type": "UNIT",
                            "weight": 1,
                            "timeout_seconds": 5
                        }
                    ]
                }
            ]

        Raises:
            TaskGenerationError: If generation fails
        """
        if not languages:
            languages = [ProgrammingLanguage.PYTHON]

        # Build the generation prompt
        prompt = self._build_generation_prompt(
            material_text=material_text,
            subject_name=subject_name,
            lesson_title=lesson_title,
            num_tasks=num_tasks,
            languages=languages
        )

        # Generate tasks using selected AI provider
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
        """Build the prompt for task generation."""

        languages_str = ", ".join([lang.value for lang in languages])

        prompt = f"""You are an expert programming instructor creating coding assignments.

**Context:**
- Subject: {subject_name}
- Lesson: {lesson_title}
- Target languages: {languages_str}

**Lesson Materials:**
{material_text}

**Task:**
Generate {num_tasks} diverse coding tasks based on the lesson materials above.

**Requirements:**
1. Each task should test understanding of concepts from the materials
2. Tasks should vary in difficulty (easy, medium, hard)
3. Include clear problem descriptions with examples
4. Write complete, working reference solutions
5. Create test cases (input/output pairs) for validation

**Output Format (JSON):**
Return a JSON array with {num_tasks} task objects. Each object must have:
{{
    "title": "Brief task title (max 100 chars)",
    "body": "Detailed problem description with examples and constraints",
    "language": "one of [{languages_str}]",
    "reference_solution": "Complete working code solution",
    "tests": [
        {{
            "test_name": "Descriptive test name",
            "test_input": "JSON string of input data",
            "expected_output": "JSON string of expected output",
            "test_type": "UNIT",
            "weight": 1,
            "timeout_seconds": 5
        }}
    ]
}}

**Example Task Body Format:**
```
Write a function `functionName(param1, param2)` that...

Example 1:
Input: param1 = 5, param2 = 10
Output: 15

Example 2:
Input: param1 = -3, param2 = 7
Output: 4

Constraints:
- param1 and param2 are integers
- -1000 <= param1, param2 <= 1000
```

Return ONLY the JSON array, no additional text."""

        return prompt

    async def _generate_with_openai(self, prompt: str) -> List[Dict[str, Any]]:
        """Generate tasks using OpenAI GPT-4."""
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

            # Handle both wrapped and unwrapped responses
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
        """Generate tasks using Anthropic Claude."""
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

            # Extract JSON from response (Claude might include markdown formatting)
            if "```json" in content:
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            elif "```" in content:
                json_start = content.find("```") + 3
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()

            result = json.loads(content)

            # Handle both wrapped and unwrapped responses
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
        """
        Validate generated tasks have required fields.

        Args:
            tasks: List of task dictionaries

        Returns:
            Validated tasks

        Raises:
            ValueError: If validation fails
        """
        required_fields = ["title", "body", "language", "reference_solution", "tests"]

        for i, task in enumerate(tasks):
            # Check required fields
            for field in required_fields:
                if field not in task:
                    raise ValueError(f"Task {i} missing required field: {field}")

            # Validate language
            try:
                ProgrammingLanguage(task["language"].lower())
            except ValueError:
                logger.warning(f"Invalid language '{task['language']}' in task {i}, defaulting to python")
                task["language"] = "python"

            # Validate tests
            if not isinstance(task["tests"], list) or len(task["tests"]) == 0:
                raise ValueError(f"Task {i} must have at least one test")

            for j, test in enumerate(task["tests"]):
                test_required = ["test_name", "test_input", "expected_output"]
                for field in test_required:
                    if field not in test:
                        raise ValueError(f"Task {i}, test {j} missing required field: {field}")

                # Set defaults for optional fields
                test.setdefault("test_type", "UNIT")
                test.setdefault("weight", 1)
                test.setdefault("timeout_seconds", 5)

        return tasks


# Singleton instance
ai_task_generator = AITaskGenerator()
