"""
Pytest configuration and fixtures for EduCode backend tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.core.database import Base, get_db
from app.core.auth import get_password_hash
from app.models.user import User, UserRole
from app.models.group import Group
from app.models.subject import Subject
from app.models.lesson import Lesson
from app.models.task import Task

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://educode_user:educode_pass@localhost:5432/educode_test_db"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a clean test database for each test function.
    """
    # Create async engine with NullPool for testing
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )

    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    # Cleanup
    await engine.dispose()


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create an AsyncClient with test database override.
    """
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def test_admin(test_db: AsyncSession) -> User:
    """Create a test admin user."""
    admin = User(
        name="Test Admin",
        email="testadmin@test.com",
        password_hash=get_password_hash("testpass123"),
        role=UserRole.ADMIN
    )
    test_db.add(admin)
    await test_db.commit()
    await test_db.refresh(admin)
    return admin


@pytest.fixture
async def test_teacher(test_db: AsyncSession) -> User:
    """Create a test teacher user."""
    teacher = User(
        name="Test Teacher",
        email="testteacher@test.com",
        password_hash=get_password_hash("testpass123"),
        role=UserRole.TEACHER
    )
    test_db.add(teacher)
    await test_db.commit()
    await test_db.refresh(teacher)
    return teacher


@pytest.fixture
async def test_student(test_db: AsyncSession, test_group: Group) -> User:
    """Create a test student user."""
    student = User(
        name="Test Student",
        email="teststudent@test.com",
        password_hash=get_password_hash("testpass123"),
        role=UserRole.STUDENT,
        group_id=test_group.id
    )
    test_db.add(student)
    await test_db.commit()
    await test_db.refresh(student)
    return student


@pytest.fixture
async def test_group(test_db: AsyncSession) -> Group:
    """Create a test group."""
    group = Group(name="TEST-GROUP")
    test_db.add(group)
    await test_db.commit()
    await test_db.refresh(group)
    return group


@pytest.fixture
async def test_subject(test_db: AsyncSession) -> Subject:
    """Create a test subject."""
    subject = Subject(name="Test Subject")
    test_db.add(subject)
    await test_db.commit()
    await test_db.refresh(subject)
    return subject


@pytest.fixture
async def test_lesson(test_db: AsyncSession, test_subject: Subject, test_teacher: User) -> Lesson:
    """Create a test lesson."""
    lesson = Lesson(
        title="Test Lesson",
        description="Test lesson description",
        subject_id=test_subject.id,
        teacher_id=test_teacher.id
    )
    test_db.add(lesson)
    await test_db.commit()
    await test_db.refresh(lesson)
    return lesson


@pytest.fixture
async def admin_token(client: AsyncClient, test_admin: User) -> str:
    """Get admin JWT token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]


@pytest.fixture
async def teacher_token(client: AsyncClient, test_teacher: User) -> str:
    """Get teacher JWT token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "testteacher@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]


@pytest.fixture
async def student_token(client: AsyncClient, test_student: User) -> str:
    """Get student JWT token."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]
