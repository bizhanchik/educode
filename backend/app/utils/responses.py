
from typing import Any, Dict, Optional, List
from datetime import datetime, timezone


def success_response(
    data: Any,
    message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    response = {
        "status": "success",
        "data": data
    }

    if message:
        response["message"] = message

    if metadata:
        response["metadata"] = metadata

    return response


def error_response(
    code: str,
    message: str,
    details: Optional[Any] = None,
    status_code: int = 400
) -> Dict[str, Any]:
    response = {
        "status": "error",
        "error": {
            "code": code,
            "message": message
        },
        "data": None
    }

    if details:
        response["error"]["details"] = details

    return response


def paginated_response(
    items: List[Any],
    total: int,
    page: int,
    size: int,
    **kwargs
) -> Dict[str, Any]:
    total_pages = (total + size - 1) // size if size > 0 else 0

    metadata = {
        "pagination": {
            "total": total,
            "page": page,
            "size": size,
            "pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }

    if kwargs:
        metadata.update(kwargs)

    return success_response(data=items, metadata=metadata)


def created_response(
    data: Any,
    message: str = "Resource created successfully",
    resource_id: Optional[Any] = None
) -> Dict[str, Any]:
    metadata = {}
    if resource_id is not None:
        metadata["resource_id"] = resource_id
    metadata["created_at"] = datetime.now(timezone.utc).isoformat()

    return success_response(data=data, message=message, metadata=metadata)


def deleted_response(
    resource_type: str,
    resource_id: Any,
    message: Optional[str] = None
) -> Dict[str, Any]:
    if not message:
        message = f"{resource_type.capitalize()} deleted successfully"

    return success_response(
        data={"resource_type": resource_type, "resource_id": resource_id},
        message=message,
        metadata={"deleted_at": datetime.now(timezone.utc).isoformat()}
    )


def no_content_response() -> Dict[str, Any]:
    return {"status": "success", "data": None}


ERROR_CODES = {
    "VALIDATION_ERROR": "Request validation failed",
    "NOT_FOUND": "Resource not found",
    "UNAUTHORIZED": "Authentication required",
    "FORBIDDEN": "Access denied",
    "CONFLICT": "Resource conflict",
    "INTERNAL_ERROR": "Internal server error",
    "BAD_REQUEST": "Bad request",
    "RATE_LIMIT": "Rate limit exceeded",
}


def get_error_message(code: str) -> str:
    return ERROR_CODES.get(code, "An error occurred")


def safe_500_detail(exception: Exception, fallback_message: str = "An internal error occurred") -> str:
    """Return safe error detail for 500 responses. In production, hides exception details."""
    try:
        from app.core.config import settings
        if getattr(settings, "DEBUG", False):
            return f"{fallback_message}: {str(exception)}"
    except Exception:
        pass
    return fallback_message
