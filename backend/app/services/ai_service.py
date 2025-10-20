"""
EduCode Backend - AI Service

Handles AI integration for solution generation and grading.
Integrates with OpenAI (ChatGPT) and Anthropic (Claude) APIs.
"""

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
    """Base exception for AI service errors."""
    pass


class AIService:
    """
    AI Service for generating reference solutions and grading submissions.
    
    Handles:
    - Generating 4 AI reference solutions (3 OpenAI + 1 Anthropic)
    - Requesting final grades from ChatGPT with structured prompts
    - Error handling and retry logic for API calls
    """
    
    def __init__(self):
        self.openai_api_key = settings.OPENAI_API_KEY
        self.anthropic_api_key = settings.ANTHROPIC_API_KEY
        self.openai_base_url = "https://api.openai.com/v1"
        self.anthropic_base_url = "https://api.anthropic.com/v1"
        
    async def generate_ai_solutions(self, task_id: int, db: AsyncSession) -> List[AISolution]:
        """
        Generate 4 AI reference solutions for a task.
        
        Args:
            task_id: Task ID to generate solutions for
            db: Database session
            
        Returns:
            List of created AISolution objects
            
        Raises:
            AIServiceError: If solution generation fails
        """
        logger.info(f"[AI] Starting solution generation for task {task_id}")
        
        # Fetch task details
        task = await self._get_task(task_id, db)
        if not task:
            raise AIServiceError(f"Task {task_id} not found")
            
        # Check if solutions already exist
        existing_solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        existing_list = existing_solutions.scalars().all()
        if existing_list:
            logger.warning(f"[AI] Solutions already exist for task {task_id}")
            return existing_list
        
        solutions = []
        
        try:
            # Generate 3 OpenAI solutions in sequence
            openai_solutions = await self._generate_openai_solutions(task, db)
            solutions.extend(openai_solutions)
            
            # Generate 1 Anthropic solution
            anthropic_solution = await self._generate_anthropic_solution(task, db)
            solutions.append(anthropic_solution)
            
            logger.info(f"[AI] Generated {len(solutions)} reference codes for task {task_id}")
            return solutions
            
        except Exception as e:
            logger.error(f"[AI] Failed to generate solutions for task {task_id}: {str(e)}")
            await db.rollback()
            raise AIServiceError(f"Solution generation failed: {str(e)}")
    
    async def _generate_openai_solutions(self, task: Task, db: AsyncSession) -> List[AISolution]:
        """Generate 3 OpenAI solutions with different approaches."""
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
                        "model": response.get("model", "gpt-4.1-mini"),
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
                
                # Small delay between requests
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"[AI] Failed to generate OpenAI solution {i}: {str(e)}")
                raise
        
        return solutions
    
    async def _generate_anthropic_solution(self, task: Task, db: AsyncSession) -> AISolution:
        """Generate 1 Anthropic solution."""
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
        """Call OpenAI API with retry logic."""
        headers = {
            "Authorization": f"Bearer {self.openai_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-4.1-mini",
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
                        raise
                    await asyncio.sleep(2 ** attempt)
    
    async def _call_anthropic_api(self, prompt: str) -> Dict[str, Any]:
        """Call Anthropic API with retry logic."""
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
                        raise
                    await asyncio.sleep(2 ** attempt)
    
    async def get_ai_reference_codes(self, task_id: int, db: AsyncSession) -> List[str]:
        """
        Get all AI reference codes for a task.
        
        Args:
            task_id: Task ID
            db: Database session
            
        Returns:
            List of AI-generated code strings
        """
        solutions = await db.execute(
            select(AISolution).where(AISolution.task_id == task_id)
        )
        return [solution.code for solution in solutions.scalars().all()]
    
    async def request_final_grade(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request final grade from ChatGPT using structured prompt.
        
        Args:
            context: Grading context with metrics
            
        Returns:
            Dict with score (1-100) and rationale
            
        Raises:
            AIServiceError: If grading request fails
        """
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
                "model": "gpt-4.1-mini",
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
                
                # Parse JSON response
                try:
                    result = json.loads(content)
                    
                    # Validate response format
                    if "score" not in result or "rationale" not in result:
                        raise ValueError("Invalid response format")
                    
                    # Clamp score to valid range
                    result["score"] = max(1, min(100, int(result["score"])))
                    
                    logger.info(f"[AI] Generated grade: {result['score']}/100")
                    return result
                    
                except (json.JSONDecodeError, ValueError) as e:
                    logger.error(f"[AI] Failed to parse grading response: {content}")
                    # Fallback scoring
                    return self._fallback_grade(context)
                    
        except Exception as e:
            logger.error(f"[AI] Failed to request final grade: {str(e)}")
            return self._fallback_grade(context)
    
    def _fallback_grade(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback grading logic when AI is unavailable."""
        correctness = context.get('correctness_score', 100)
        ai_similarity = context.get('ai_similarity', 0.0)
        group_similarity = context.get('intra_group_similarity', 0.0)
        
        # Simple penalty-based scoring
        ai_penalty = int(ai_similarity * 30)  # Up to 30 points penalty
        group_penalty = int(group_similarity * 20)  # Up to 20 points penalty
        
        final_score = max(1, correctness - ai_penalty - group_penalty)
        
        return {
            "score": final_score,
            "rationale": f"Fallback scoring: {correctness} correctness - {ai_penalty} AI penalty - {group_penalty} group penalty = {final_score}"
        }
    
    async def _get_task(self, task_id: int, db: AsyncSession) -> Optional[Task]:
        """Get task by ID."""
        result = await db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()


# Global AI service instance
ai_service = AIService()