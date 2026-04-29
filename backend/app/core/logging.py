import logging
import sys
import uuid
from typing import Optional
from datetime import datetime, timezone
from contextvars import ContextVar

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


class RequestIDFilter(logging.Filter):

    def filter(self, record):
        record.request_id = request_id_var.get() or "no-request-id"
        return True


class StructuredFormatter(logging.Formatter):

    def format(self, record):
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": getattr(record, 'request_id', 'no-request-id'),
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if hasattr(record, 'user_id'):
            log_data["user_id"] = record.user_id
        if hasattr(record, 'user_role'):
            log_data["user_role"] = record.user_role
        if hasattr(record, 'path'):
            log_data["path"] = record.path
        if hasattr(record, 'method'):
            log_data["method"] = record.method
        if hasattr(record, 'status_code'):
            log_data["status_code"] = record.status_code
        if hasattr(record, 'duration_ms'):
            log_data["duration_ms"] = record.duration_ms

        fields = " | ".join([f"{k}={v}" for k, v in log_data.items()])
        return fields


def setup_logging(log_level: str = "INFO") -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    root_logger.handlers.clear()
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))

    formatter = StructuredFormatter()
    console_handler.setFormatter(formatter)

    console_handler.addFilter(RequestIDFilter())
    root_logger.addHandler(console_handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request_id_var.set(request_id)
        request.state.request_id = request_id
        start_time = datetime.now(timezone.utc)
        response = await call_next(request)
        duration = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000

        response.headers["X-Request-ID"] = request_id

        logger = logging.getLogger("educode.api")
        logger.info(
            f"Request completed",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": round(duration, 2),
            }
        )

        return response


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def log_with_context(
    logger: logging.Logger,
    level: str,
    message: str,
    user_id: Optional[int] = None,
    user_role: Optional[str] = None,
    **kwargs
):

    extra = {}
    if user_id is not None:
        extra["user_id"] = user_id
    if user_role is not None:
        extra["user_role"] = user_role

    extra.update(kwargs)

    log_func = getattr(logger, level.lower())
    log_func(message, extra=extra)


