"""
EduCode Backend - Similarity Routes

API endpoints for code similarity analysis.
Provides endpoints for comparing code snippets and calculating similarity scores.
"""

import logging
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.similarity import similarity_calculator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/similarity", tags=["similarity"])


class CompareRequest(BaseModel):
    """Request model for code comparison."""
    code1: str = Field(..., description="First code snippet to compare")
    code2: str = Field(..., description="Second code snippet to compare")
    method: str = Field(default="hybrid", description="Similarity method: token, semantic, structural, or hybrid")


class CompareResponse(BaseModel):
    """Response model for code comparison."""
    similarity: float = Field(..., description="Similarity score between 0.0 and 1.0")
    method: str = Field(..., description="Method used for comparison")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional comparison metadata")


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(..., description="Service status")
    message: str = Field(..., description="Status message")


@router.post("/compare", response_model=CompareResponse)
async def compare_code(request: CompareRequest) -> CompareResponse:
    """
    Compare two code snippets and return similarity score.
    
    Args:
        request: Comparison request with code snippets and method
        
    Returns:
        Similarity score and metadata
        
    Raises:
        HTTPException: If comparison fails
    """
    try:
        logger.info(f"Comparing code snippets using method: {request.method}")
        
        # Validate method
        valid_methods = ["token", "semantic", "structural", "hybrid"]
        if request.method not in valid_methods:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid method. Must be one of: {valid_methods}"
            )
        
        # Calculate similarity
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
    """
    Check if the similarity service is healthy.
    
    Returns:
        Health status
    """
    try:
        # Test the similarity calculator with a simple comparison
        test_result = similarity_calculator.get_similarity("test", "test", "token")
        
        if test_result == 1.0:  # Should be identical
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
    """
    Simple ping endpoint for basic connectivity check.
    
    Returns:
        Pong response
    """
    return {"message": "pong"}


@router.get("/")
async def root() -> Dict[str, str]:
    """
    Root endpoint with service information.
    
    Returns:
        Service information
    """
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