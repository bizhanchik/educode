"""
EduCode Backend - Configuration Management

This module handles all configuration settings for the EduCode application,
including database connections, API keys, and environment-specific settings.
All settings are loaded from environment variables with sensible defaults.
"""

import os
from typing import List, Optional, Union
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All sensitive information should be provided via environment variables
    and never hardcoded in the application.
    """
    
    # Application Settings
    APP_NAME: str = "EduCode API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Database Settings
    DATABASE_URL: str = "postgresql+asyncpg://educode_user:educode_pass@localhost:5432/educode_db"
    DATABASE_ECHO: bool = False  # Set to True for SQL query logging

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """Alias for DATABASE_URL for compatibility."""
        return self.DATABASE_URL
    
    # Redis Settings (for Celery)
    REDIS_URL: str = "redis://localhost:6379/0"

    @property
    def CELERY_BROKER_URL(self) -> str:
        """Use REDIS_URL for Celery broker if not explicitly set."""
        return os.getenv("CELERY_BROKER_URL", self.REDIS_URL)

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        """Use REDIS_URL for Celery result backend if not explicitly set."""
        return os.getenv("CELERY_RESULT_BACKEND", self.REDIS_URL)
    
    # Celery Configuration
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "UTC"
    CELERY_ENABLE_UTC: bool = True
    
    # MinIO/S3 Settings
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "educode"
    MINIO_SECURE: bool = False  # Set to True for HTTPS
    
    # AI Service Settings
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Similarity Service Settings
    SIMILARITY_SERVICE_URL: str = "http://localhost:8001"
    
    # Logging Settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Task Processing Settings
    MAX_STUDENTS_PER_TASK: int = 100
    GRADING_TIMEOUT_MINUTES: int = 5
    AI_SIMILARITY_THRESHOLD: float = 0.8
    GROUP_SIMILARITY_THRESHOLD: float = 0.7
    
    # File Upload Settings
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
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("ALLOWED_FILE_EXTENSIONS", mode="before")
    @classmethod
    def parse_file_extensions(cls, v):
        """Parse file extensions from string or list."""
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v):
        """Ensure database URL uses asyncpg driver."""
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError("Database URL must use asyncpg driver")
        return v


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    
    Returns:
        Settings instance with all configuration values
    """
    return Settings()


# Global settings instance
settings = get_settings()


def get_database_url() -> str:
    """
    Get the database URL for SQLAlchemy.
    
    Returns:
        Database connection URL
    """
    return settings.DATABASE_URL


def get_redis_url() -> str:
    """
    Get the Redis URL for Celery and caching.
    
    Returns:
        Redis connection URL
    """
    return settings.REDIS_URL


def is_development() -> bool:
    """
    Check if the application is running in development mode.
    
    Returns:
        True if in development mode, False otherwise
    """
    return settings.DEBUG


def is_production() -> bool:
    """
    Check if the application is running in production mode.
    
    Returns:
        True if in production mode, False otherwise
    """
    return not settings.DEBUG and os.getenv("ENVIRONMENT", "").lower() == "production"