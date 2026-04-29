import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from sqlalchemy import MetaData, text

from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

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

engine = None
async_session_factory = None


def create_database_engine():
    global engine

    if engine is None:
        logger.info(f"🔗 Creating database engine for: {settings.DATABASE_URL.split('@')[-1]}")

        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=settings.DATABASE_ECHO,
            poolclass=NullPool if settings.DEBUG else None,
            pool_pre_ping=True,
            pool_recycle=3600,
            connect_args={
                "server_settings": {
                    "application_name": "educode-api",
                }
            }
        )

        logger.info("Database engine created successfully")

    return engine


def create_session_factory():
    global async_session_factory

    if async_session_factory is None:
        engine = create_database_engine()
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=True,
            autocommit=False
        )
        logger.info("Database session factory created")

    return async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session_factory = create_session_factory()

    async with session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    try:
        logger.info("Initializing database connection...")

        engine = create_database_engine()
        create_session_factory()

        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1 as test"))
            test_value = result.scalar()

            if test_value != 1:
                raise Exception("Database connectivity test failed")

        logger.info("Database initialized successfully")

    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise


async def close_db() -> None:
    global engine, async_session_factory

    try:
        if engine:
            logger.info("Closing database connections")
            await engine.dispose()
            engine = None
            async_session_factory = None
            logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")


async def create_tables() -> None:
    try:
        logger.info("Creating database tables...")
        engine = create_database_engine()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


async def drop_tables() -> None:
    try:
        logger.warning("Dropping all database tables")
        engine = create_database_engine()

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        logger.info("Database tables dropped successfully")

    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise


async def check_database_health() -> bool:
    try:
        engine = create_database_engine()
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False