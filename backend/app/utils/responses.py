"""
EduCode Backend - Response Utilities

Consistent JSON envelope helpers for API responses.
All responses follow the format:
{
    "status": "success" | "error",
    "data": {...} | null,
    "error": {"code": str, "message": str} | null,
    "metadata": {...} (optional)
}
"""

from typing import Any, Dict, Optional, List
from datetime import datetime, timezone


def success_response(
    data: Any,
    message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a successful response envelope.

    Args:
        data: The response data (can be dict, list, or any serializable object)
        message: Optional success message
        metadata: Optional metadata (pagination info, timestamps, etc.)

    Returns:
        Dictionary with standard success response format

    Example:
        >>> success_response({"id": 1, "name": "John"}, message="User created")
        {
            "status": "success",
            "message": "User created",
            "data": {"id": 1, "name": "John"},
            "metadata": null
        }
    """
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
    """
    Create an error response envelope.

    Args:
        code: Error code (e.g., "VALIDATION_ERROR", "NOT_FOUND")
        message: Human-readable error message
        details: Optional additional error details
        status_code: HTTP status code

    Returns:
        Dictionary with standard error response format

    Example:
        >>> error_response("VALIDATION_ERROR", "Invalid email format")
        {
            "status": "error",
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid email format",
                "details": null
            },
            "data": null
        }
    """
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
    """
    Create a paginated response with consistent metadata.

    Args:
        items: List of items for the current page
        total: Total number of items across all pages
        page: Current page number (1-indexed)
        size: Number of items per page
        **kwargs: Additional metadata fields

    Returns:
        Dictionary with paginated response format

    Example:
        >>> paginated_response([{"id": 1}, {"id": 2}], total=100, page=1, size=10)
        {
            "status": "success",
            "data": [{"id": 1}, {"id": 2}],
            "metadata": {
                "pagination": {
                    "total": 100,
                    "page": 1,
                    "size": 10,
                    "pages": 10,
                    "has_next": true,
                    "has_prev": false
                }
            }
        }
    """
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

    # Add any additional metadata
    if kwargs:
        metadata.update(kwargs)

    return success_response(data=items, metadata=metadata)


def created_response(
    data: Any,
    message: str = "Resource created successfully",
    resource_id: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Create a response for resource creation (typically 201).

    Args:
        data: The created resource data
        message: Success message
        resource_id: Optional resource ID

    Returns:
        Dictionary with creation response format
    """
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
    """
    Create a response for resource deletion.

    Args:
        resource_type: Type of resource deleted (e.g., "user", "lesson")
        resource_id: ID of the deleted resource
        message: Optional custom message

    Returns:
        Dictionary with deletion response format
    """
    if not message:
        message = f"{resource_type.capitalize()} deleted successfully"

    return success_response(
        data={"resource_type": resource_type, "resource_id": resource_id},
        message=message,
        metadata={"deleted_at": datetime.now(timezone.utc).isoformat()}
    )


def no_content_response() -> Dict[str, Any]:
    """
    Create a response for operations that return no content (204).

    Returns:
        Empty success response
    """
    return {"status": "success", "data": None}


# Common error codes
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
    """
    Get default error message for a given error code.

    Args:
        code: Error code

    Returns:
        Default error message
    """
    return ERROR_CODES.get(code, "An error occurred")
