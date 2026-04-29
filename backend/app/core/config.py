import os
from typing import List, Optional, Union
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field


class Settings(BaseSettings):

    APP_NAME: str = "EduCode API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_ORIGINS: Union[str, List[str]] = Field(default_factory=list)

    DATABASE_URL: str = Field(default="")
    DATABASE_ECHO: bool = False

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return self.DATABASE_URL

    REDIS_URL: str = Field(default="")

    @property
    def CELERY_BROKER_URL(self) -> str:
        return os.getenv("CELERY_BROKER_URL", self.REDIS_URL)

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return os.getenv("CELERY_RESULT_BACKEND", self.REDIS_URL)

    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_ENABLE_UTC: bool = True

    MINIO_ENDPOINT: str = Field(default="")
    MINIO_PUBLIC_ENDPOINT: str = Field(default="", description="Public URL for MinIO (for presigned URLs accessible from browser)")
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "educode"
    MINIO_SECURE: bool = False

    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    SIMILARITY_SERVICE_URL: str = Field(default="")

    JUDGE0_API_URL: str = Field(default="https://judge0-ce.p.rapidapi.com")
    JUDGE0_RAPIDAPI_KEY: str = Field(default="")
    JUDGE0_RAPIDAPI_HOST: str = Field(default="judge0-ce.p.rapidapi.com")
    JUDGE0_TIMEOUT_SECONDS: int = Field(default=30)
    JUDGE0_MAX_RETRIES: int = Field(default=3)

    CODE_EXECUTION_MAX_TIME: int = Field(default=10)
    CODE_EXECUTION_MAX_MEMORY: int = Field(default=256000)

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    MAX_STUDENTS_PER_TASK: int = 100
    GRADING_TIMEOUT_MINUTES: int = 5
    AI_SIMILARITY_THRESHOLD: float = 0.8
    GROUP_SIMILARITY_THRESHOLD: float = 0.7

    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_EXTENSIONS: Union[str, List[str]] = [".py", ".js", ".java", ".cpp", ".c", ".go", ".rs"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("ALLOWED_FILE_EXTENSIONS", mode="before")
    @classmethod
    def parse_file_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v):
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError("Database URL must use asyncpg driver")
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def get_database_url() -> str:
    return settings.DATABASE_URL


def get_redis_url() -> str:
    return settings.REDIS_URL


def is_development() -> bool:
    return settings.DEBUG


def is_production() -> bool:
    return not settings.DEBUG and os.getenv("ENVIRONMENT", "").lower() == "production"