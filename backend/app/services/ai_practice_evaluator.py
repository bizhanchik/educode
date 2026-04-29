
import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIPracticeEvaluator:

    def __init__(self):
        self.openai_api_key = settings.OPENAI_API_KEY
        self.anthropic_api_key = settings.ANTHROPIC_API_KEY

    async def evaluate_code_with_all_models(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str],
        other_student_codes: List[str]
    ) -> List[Dict[str, Any]]:
        tasks = [
            self._evaluate_with_gpt4(student_code, task_description, reference_solutions),
            self._evaluate_with_claude(student_code, task_description, reference_solutions),
            self._evaluate_with_gemini(student_code, task_description, reference_solutions),
            self._evaluate_with_deepseek(student_code, task_description, reference_solutions),
            self._evaluate_with_llama(student_code, task_description, reference_solutions)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        ai_feedback = []
        for i, result in enumerate(results):
            model_names = ["gpt-4", "claude", "gemini", "deepseek", "llama"]
            if isinstance(result, Exception):
                logger.error(f"AI evaluation failed for {model_names[i]}: {str(result)}")
                ai_feedback.append({
                    "model": model_names[i],
                    "correctness": False,
                    "similarity": 0.0,
                    "explanation": f"Evaluation failed: {str(result)}"
                })
            else:
                ai_feedback.append(result)

        return ai_feedback

    async def _evaluate_with_gpt4(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str]
    ) -> Dict[str, Any]:
        if not self.openai_api_key:
            return {"model": "gpt-4", "correctness": False, "similarity": 0.0, "explanation": "API key not configured"}

        prompt = f"""Evaluate this student's code solution:

Task: {task_description}

Student Code:
```python
{student_code}
```

Reference Solutions:
{chr(10).join([f'```python{chr(10)}{ref}{chr(10)}```' for ref in reference_solutions[:2]])}

Provide JSON response:
{{
    "correctness": true/false,
    "similarity": 0-100,
    "explanation": "brief explanation"
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4-turbo-preview",
                        "messages": [
                            {"role": "system", "content": "You are a code evaluator. Return only valid JSON."},
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 500,
                        "temperature": 0.3
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                elif "```" in content:
                    json_start = content.find("```") + 3
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()

                result = json.loads(content)
                return {
                    "model": "gpt-4",
                    "correctness": result.get("correctness", False),
                    "similarity": float(result.get("similarity", 0.0)),
                    "explanation": result.get("explanation", "")
                }
        except Exception as e:
            logger.error(f"GPT-4 evaluation failed: {str(e)}")
            return {"model": "gpt-4", "correctness": False, "similarity": 0.0, "explanation": f"Error: {str(e)}"}

    async def _evaluate_with_claude(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str]
    ) -> Dict[str, Any]:
        if not self.anthropic_api_key:
            return {"model": "claude", "correctness": False, "similarity": 0.0, "explanation": "API key not configured"}

        prompt = f"""Evaluate this student's code solution:

Task: {task_description}

Student Code:
```python
{student_code}
```

Reference Solutions:
{chr(10).join([f'```python{chr(10)}{ref}{chr(10)}```' for ref in reference_solutions[:2]])}

Provide JSON response:
{{
    "correctness": true/false,
    "similarity": 0-100,
    "explanation": "brief explanation"
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.anthropic_api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": prompt}]
                    }
                )
                response.raise_for_status()
                data = response.json()
                content = data["content"][0]["text"]

                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()
                elif "```" in content:
                    json_start = content.find("```") + 3
                    json_end = content.find("```", json_start)
                    content = content[json_start:json_end].strip()

                result = json.loads(content)
                return {
                    "model": "claude",
                    "correctness": result.get("correctness", False),
                    "similarity": float(result.get("similarity", 0.0)),
                    "explanation": result.get("explanation", "")
                }
        except Exception as e:
            logger.error(f"Claude evaluation failed: {str(e)}")
            return {"model": "claude", "correctness": False, "similarity": 0.0, "explanation": f"Error: {str(e)}"}

    async def _evaluate_with_gemini(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str]
    ) -> Dict[str, Any]:
        return {
            "model": "gemini",
            "correctness": False,
            "similarity": 0.0,
            "explanation": "Gemini API not configured"
        }

    async def _evaluate_with_deepseek(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str]
    ) -> Dict[str, Any]:
        return {
            "model": "deepseek",
            "correctness": False,
            "similarity": 0.0,
            "explanation": "DeepSeek API not configured"
        }

    async def _evaluate_with_llama(
        self,
        student_code: str,
        task_description: str,
        reference_solutions: List[str]
    ) -> Dict[str, Any]:
        return {
            "model": "llama",
            "correctness": False,
            "similarity": 0.0,
            "explanation": "LLaMA API not configured"
        }

