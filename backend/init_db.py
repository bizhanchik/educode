#!/usr/bin/env python3
"""
Database initialization script for EduCode.
Creates the database if it doesn't exist.
"""

import asyncio
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

def create_database_if_not_exists():
    """Create the educode_db database if it doesn't exist."""

    # Extract connection details from DATABASE_URL
    # Format: postgresql+asyncpg://user:pass@host:port/dbname
    db_url = settings.DATABASE_URL

    # Replace asyncpg with psycopg2 for database creation (sync connection)
    sync_db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')

    # Parse the URL to get the database name
    parts = sync_db_url.split('/')
    db_name = parts[-1]
    base_url = '/'.join(parts[:-1]) + '/postgres'  # Connect to default postgres database

    print(f"Attempting to create database: {db_name}")
    print(f"Using base URL: {base_url}")

    try:
        # Connect to default postgres database
        engine = create_engine(base_url, isolation_level="AUTOCOMMIT")

        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": db_name}
            )

            if result.fetchone():
                print(f"✓ Database '{db_name}' already exists")
            else:
                # Create database
                conn.execute(text(f'CREATE DATABASE {db_name}'))
                print(f"✓ Database '{db_name}' created successfully")

        engine.dispose()
        return True

    except Exception as e:
        print(f"✗ Error creating database: {e}")
        print(f"\nMake sure PostgreSQL is running and the credentials are correct:")
        print(f"DATABASE_URL={settings.DATABASE_URL}")
        return False


async def test_connection():
    """Test the database connection."""
    try:
        engine = create_async_engine(settings.DATABASE_URL)
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.fetchone()
            print(f"\n✓ Successfully connected to database!")
            print(f"PostgreSQL version: {version[0][:50]}...")

        await engine.dispose()
        return True

    except Exception as e:
        print(f"\n✗ Failed to connect to database: {e}")
        return False


if __name__ == "__main__":
    print("=" * 70)
    print("EduCode Database Initialization")
    print("=" * 70)
    print()

    # Step 1: Create database
    if not create_database_if_not_exists():
        sys.exit(1)

    # Step 2: Test connection
    if not asyncio.run(test_connection()):
        sys.exit(1)

    print()
    print("=" * 70)
    print("✓ Database initialization complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Run migrations: alembic upgrade head")
    print("2. Start the application: python -m app.main")
    print()
