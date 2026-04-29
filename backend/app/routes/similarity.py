
import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.models.user import User
from app.services.similarity import similarity_calculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/similarity", tags=["similarity"])


class CompareRequest(BaseModel):
    code1: str = Field(..., description="First code snippet to compare")
    code2: str = Field(..., description="Second code snippet to compare")
    method: str = Field(default="hybrid", description="Similarity method: token, semantic, structural, or hybrid")


class CompareResponse(BaseModel):
    similarity: float = Field(..., description="Similarity score between 0.0 and 1.0")
    method: str = Field(..., description="Method used for comparison")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional comparison metadata")


class HealthResponse(BaseModel):
    status: str = Field(..., description="Service status")
    message: str = Field(..., description="Status message")


@router.post("/compare", response_model=CompareResponse)
async def compare_code(
    request: CompareRequest,
    current_user: User = Depends(get_current_user)
) -> CompareResponse:
    try:
        logger.info(f"Comparing code snippets using method: {request.method}")

        valid_methods = ["token", "semantic", "structural", "hybrid"]
        if request.method not in valid_methods:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid method. Must be one of: {valid_methods}"
            )

        result = similarity_calculator.compare_detailed(
            request.code1,
            request.code2,
            request.method
        )

        logger.info(f"Similarity calculated: {result['similarity']:.3f}")

        return CompareResponse(
            similarity=result["similarity"],
            method=request.method,
            metadata=result.get("metadata", {})
        )

    except Exception as e:
        logger.error(f"Error comparing code: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Similarity comparison failed: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    try:
        test_result = similarity_calculator.get_similarity("test", "test", "token")

        if test_result == 1.0:
            return HealthResponse(
                status="ok",
                message="Similarity service is healthy"
            )
        else:
            raise Exception("Unexpected similarity result for identical strings")

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Similarity service unhealthy: {str(e)}"
        )


@router.get("/ping")
async def ping() -> Dict[str, str]:
    return {"message": "pong"}


@router.get("")
async def root() -> Dict[str, str]:
    return {
        "service": "EduCode Similarity Service",
        "version": "1.0.0",
        "description": "AI-powered code similarity analysis service",
        "endpoints": {
            "compare": "/similarity/compare",
            "health": "/similarity/health",
            "ping": "/similarity/ping"
        }
    }