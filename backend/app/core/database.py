"""
EduCode Backend - Database Configuration

This module handles PostgreSQL database connections using SQLAlchemy with async support.
It provides database session management, connection pooling, and initialization functions.
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import MetaData, text

from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy Base for model definitions
Base = declarative_base()

# Metadata for explicit naming conventions
metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s"
    }
)
Base.metadata = metadata

# Global database engine and session factory
engine = None
async_session_factory = None


def create_database_engine():
    """
    Create and configure the async database engine.
    
    Returns:
        AsyncEngine: Configured SQLAlchemy async engine
    """
    global engine
    
    if engine is None:
        logger.info(f"🔗 Creating database engine for: {settings.DATABASE_URL.split('@')[-1]}")
        
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DATABASE_ECHO,  # Log SQL queries if enabled
            poolclass=NullPool if settings.DEBUG else None,  # Disable pooling in debug mode
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=3600,  # Recycle connections every hour
            connect_args={
                "server_settings": {
                    "application_name": "educode-api",
                }
            }
        )
        
        logger.info("✅ Database engine created successfully")
    
    return engine


def create_session_factory():
    """
    Create and configure the async session factory.
    
    Returns:
        async_sessionmaker: Configured session factory
    """
    global async_session_factory
    
    if async_session_factory is None:
        engine = create_database_engine()
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,  # Keep objects accessible after commit
            autoflush=True,  # Automatically flush before queries
            autocommit=False  # Explicit transaction control
        )
        logger.info("✅ Database session factory created")
    
    return async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function to get database session.
    
    This function is used as a FastAPI dependency to provide database sessions
    to route handlers. It ensures proper session cleanup after each request.
    
    Yields:
        AsyncSession: Database session for the request
    """
    session_factory = create_session_factory()
    
    async with session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"❌ Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize the database connection and verify connectivity.
    
    This function is called during application startup to ensure
    the database is accessible and properly configured.
    
    Raises:
        Exception: If database connection fails
    """
    try:
        logger.info("🔄 Initializing database connection...")
        
        # Create engine and session factory
        engine = create_database_engine()
        create_session_factory()
        
        # Test database connectivity
        async with engine.begin() as conn:
            # Execute a simple query to verify connection
            result = await conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            
            if test_value != 1:
                raise Exception("Database connectivity test failed")
        
        logger.info("✅ Database initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        raise


async def close_db() -> None:
    """
    Close database connections and cleanup resources.
    
    This function is called during application shutdown to ensure
    all database connections are properly closed.
    """
    global engine, async_session_factory
    
    try:
        if engine:
            logger.info("🔄 Closing database connections...")
            await engine.dispose()
            engine = None
            async_session_factory = None
            logger.info("✅ Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database connections: {e}")


async def create_tables() -> None:
    """
    Create all database tables defined in models.
    
    This function should be called during initial setup or migrations.
    In production, use Alembic migrations instead.
    """
    try:
        logger.info("🔄 Creating database tables...")
        engine = create_database_engine()
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("✅ Database tables created successfully")
        
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        raise


async def drop_tables() -> None:
    """
    Drop all database tables.
    
    WARNING: This function will delete all data!
    Only use in development or testing environments.
    """
    try:
        logger.warning("⚠️ Dropping all database tables...")
        engine = create_database_engine()
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        logger.info("✅ Database tables dropped successfully")
        
    except Exception as e:
        logger.error(f"❌ Error dropping database tables: {e}")
        raise


# Health check function for database connectivity
async def check_database_health() -> bool:
    """
    Check if the database is healthy and accessible.
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        engine = create_database_engine()
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"❌ Database health check failed: {e}")
        return False