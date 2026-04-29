
import logging
from typing import Dict, Any, Optional, List

from app.services.similarity import similarity_calculator

logger = logging.getLogger(__name__)


class SimilarityClientError(Exception):
    pass


class SimilarityClient:

    def __init__(self):
        self.calculator = similarity_calculator

    async def get_similarity(self, code_a: str, code_b: str, method: str = "hybrid") -> float:
        try:
            return self.calculator.get_similarity(code_a, code_b, method)
        except Exception as e:
            logger.error(f"Failed to get similarity: {str(e)}")
            raise SimilarityClientError(f"Similarity calculation failed: {str(e)}")

    async def compare_detailed(self, code_a: str, code_b: str, method: str = "hybrid") -> Dict[str, Any]:
        try:
            logger.info(f"Comparing code snippets using method: {method}")
            result = self.calculator.compare_detailed(code_a, code_b, method)
            logger.info(f"Similarity calculated: {result['similarity']:.3f}")
            return result
        except Exception as e:
            logger.error(f"Unexpected error in similarity comparison: {str(e)}")
            raise SimilarityClientError(f"Similarity comparison failed: {str(e)}")

    async def compare_with_multiple(self, target_code: str, reference_codes: list, method: str = "hybrid") -> Dict[str, float]:
        logger.info(f"Comparing target code with {len(reference_codes)} references")

        similarities = {}

        semaphore = asyncio.Semaphore(5)

        async def compare_single(index: int, ref_code: str) -> tuple:
            async with semaphore:
                try:
                    similarity = await self.get_similarity(target_code, ref_code, method)
                    return index, similarity
                except Exception as e:
                    logger.warning(f"Failed to compare with reference {index}: {str(e)}")
                    return index, 0.0

        tasks = [
            compare_single(i, ref_code)
            for i, ref_code in enumerate(reference_codes)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Comparison task failed: {str(result)}")
                continue

            index, similarity = result
            similarities[f"ref_{index}"] = similarity

        logger.info(f"Completed {len(similarities)} comparisons")
        return similarities

    async def get_max_similarity(self, target_code: str, reference_codes: list, method: str = "hybrid") -> float:
        if not reference_codes:
            return 0.0

        similarities = await self.compare_with_multiple(target_code, reference_codes, method)

        if not similarities:
            raise SimilarityClientError("All similarity comparisons failed")

        max_similarity = max(similarities.values())
        logger.info(f"Maximum similarity found: {max_similarity:.3f}")

        return max_similarity

    async def health_check(self) -> bool:
        try:
            return True
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return False

    async def get_service_info(self) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/")
                response.raise_for_status()
                return response.json()

        except Exception as e:
            logger.warning(f"Failed to get similarity service info: {str(e)}")
            return None


similarity_client = SimilarityClient()


async def get_similarity(code_a: str, code_b: str, method: str = "hybrid") -> float:
    return await similarity_client.get_similarity(code_a, code_b, method)


async def get_ai_similarity(student_code: str, ai_codes: list) -> float:
    return await similarity_client.get_max_similarity(student_code, ai_codes, "hybrid")


async def get_group_similarities(submissions: list) -> Dict[str, Dict[str, float]]:
    similarities = {}

    for i, code_a in enumerate(submissions):
        similarities[f"submission_{i}"] = {}

        for j, code_b in enumerate(submissions):
            if i != j:
                try:
                    similarity = await similarity_client.get_similarity(code_a, code_b, "hybrid")
                    similarities[f"submission_{i}"][f"submission_{j}"] = similarity
                except Exception as e:
                    logger.warning(f"Failed to compare submissions {i} and {j}: {str(e)}")
                    similarities[f"submission_{i}"][f"submission_{j}"] = 0.0

    return similarities


async def get_average_group_similarity(student_code: str, other_submissions: list) -> float:
    if not other_submissions:
        return 0.0

    try:
        similarities = await similarity_client.compare_with_multiple(
            student_code, other_submissions, "hybrid"
        )

        if not similarities:
            return 0.0

        return sum(similarities.values()) / len(similarities)

    except Exception as e:
        logger.error(f"Failed to calculate average group similarity: {str(e)}")
        return 0.0