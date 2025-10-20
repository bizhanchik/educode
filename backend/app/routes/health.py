"""
EduCode Backend - Health Check Routes

This module provides health check endpoints for monitoring the application status,
database connectivity, and overall system health.
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns:
        Dict containing status and timestamp
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "educode-api"
    }


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Detailed health check including database connectivity.
    
    Args:
        db: Database session dependency
        
    Returns:
        Dict containing detailed health information
        
    Raises:
        HTTPException: If database connection fails
    """
    health_data = {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "educode-api",
        "checks": {
            "database": "unknown",
            "api": "ok"
        }
    }
    
    # Test database connectivity
    try:
        result = await db.execute(text("SELECT 1"))
        if result.scalar() == 1:
            health_data["checks"]["database"] = "ok"
            logger.info("✅ Database health check passed")
        else:
            health_data["checks"]["database"] = "error"
            health_data["status"] = "degraded"
            logger.warning("⚠️ Database health check returned unexpected result")
    except Exception as e:
        health_data["checks"]["database"] = "error"
        health_data["status"] = "error"
        health_data["error"] = str(e)
        logger.error(f"❌ Database health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Database connectivity check failed"
        )
    
    return health_data


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """
    Kubernetes-style readiness probe.
    
    Args:
        db: Database session dependency
        
    Returns:
        Dict indicating readiness status
        
    Raises:
        HTTPException: If system is not ready
    """
    try:
        # Check database connectivity
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"❌ Readiness check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="System not ready"
        )


@router.get("/health/live")
async def liveness_check() -> Dict[str, str]:
    """
    Kubernetes-style liveness probe.
    
    Returns:
        Dict indicating liveness status
    """
    return {"status": "alive"}