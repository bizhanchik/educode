from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri="memory://",
    strategy="fixed-window",
    headers_enabled=True
)


RATE_LIMITS = {
    "auth": "5/minute",
    "create": "10/minute",
    "read": "100/minute",
    "update": "20/minute",
    "delete": "10/minute",
    "ai_operation": "5/minute",
    "upload": "10/minute",
}


def get_rate_limit(operation_type: str) -> str:
    return RATE_LIMITS.get(operation_type, "100/minute")
