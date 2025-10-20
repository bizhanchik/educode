"""
EduCode Backend - Rate Limiting

Rate limiting configuration using slowapi (Flask-Limiter for FastAPI).
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",  # Use Redis in production: redis://redis:6379
    strategy="fixed-window",
    headers_enabled=True
)


# Common rate limit decorators for different endpoint types
RATE_LIMITS = {
    "auth": "5/minute",           # Login/auth endpoints
    "create": "10/minute",         # Resource creation
    "read": "100/minute",          # Read operations
    "update": "20/minute",         # Update operations
    "delete": "10/minute",         # Delete operations
    "ai_operation": "5/minute",    # AI-heavy operations
    "upload": "10/minute",         # File uploads
}


def get_rate_limit(operation_type: str) -> str:
    """
    Get rate limit string for a given operation type.

    Args:
        operation_type: Type of operation (auth, create, read, etc.)

    Returns:
        Rate limit string (e.g., "5/minute")
    """
    return RATE_LIMITS.get(operation_type, "100/minute")
