import os
from celery import Celery
from kombu import Queue

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "educode",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.ai_tasks",
        "app.tasks.grading_tasks",
        "app.tasks.ai_generation_tasks",
    ]
)

from app.tasks import ai_tasks, grading_tasks, ai_generation_tasks

celery_app.conf.update(
    task_serializer=settings.CELERY_TASK_SERIALIZER,
    result_serializer=settings.CELERY_RESULT_SERIALIZER,
    accept_content=settings.CELERY_ACCEPT_CONTENT,
    
    timezone=settings.CELERY_TIMEZONE,
    enable_utc=settings.CELERY_ENABLE_UTC,
    
    task_routes={
        "app.tasks.ai_tasks.*": {"queue": "ai_queue"},
        "app.tasks.grading_tasks.*": {"queue": "grading_queue"},
        "app.tasks.ai_generation_tasks.*": {"queue": "ai_queue"},
    },

    task_queues=(
        Queue("ai_queue", routing_key="ai"),
        Queue("grading_queue", routing_key="grading"),
        Queue("celery", routing_key="celery"),
    ),
    
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,
    
    result_expires=3600,
    result_persistent=True,
    
    worker_max_tasks_per_child=1000,
    worker_disable_rate_limits=False,
    
    beat_schedule={
        "auto-grade-expired-tasks": {
            "task": "app.tasks.ai_tasks.auto_grade_expired_tasks",
            "schedule": 300.0,
        },
        "cleanup-old-results": {
            "task": "app.tasks.grading_tasks.cleanup_old_results",
            "schedule": 3600.0,
        },
    },
    beat_schedule_filename="celerybeat-schedule",
)

celery_app.conf.task_annotations = {
    "*": {
        "rate_limit": "100/m",
        "time_limit": 300,
        "soft_time_limit": 240,
    },
    "app.tasks.ai_tasks.*": {
        "rate_limit": "10/m",
        "time_limit": 600,
        "soft_time_limit": 540,
        "retry_kwargs": {
            "max_retries": 3,
            "countdown": 60,
        },
    },
}

celery_app.conf.worker_log_format = "[%(asctime)s: %(levelname)s/%(processName)s] %(message)s"
celery_app.conf.worker_task_log_format = "[%(asctime)s: %(levelname)s/%(processName)s][%(task_name)s(%(task_id)s)] %(message)s"

@celery_app.task(bind=True)
def health_check(self):

    return {
        "status": "healthy",
        "worker_id": self.request.id,
        "timestamp": self.request.utc,
        "queue": self.request.delivery_info.get("routing_key", "unknown"),
    }

@celery_app.task
def test_task(message: str = "Hello from Celery!"):
    """
    Simple test task to verify Celery is working.
    
    Args:
        message (str): Test message to return
        
    Returns:
        dict: Test result with message and timestamp
    """
    import datetime
    return {
        "message": message,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "success"
    }

# Export the Celery app
__all__ = ["celery_app"]