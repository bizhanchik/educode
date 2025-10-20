#!/usr/bin/env python3
"""
EduCode Backend - Database Seeder

Creates initial data for testing and demonstration:
- Admin user
- Teacher user
- Student users
- Group (PO-2402)
- Subject (Algorithms)
- Lesson
- Task with near-future deadline

Usage:
    python scripts/seed.py
    or
    docker compose exec api python scripts/seed.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, Base
from app.core.auth import get_password_hash
from app.models.user import User, UserRole
from app.models.group import Group
from app.models.subject import Subject
from app.models.lesson import Lesson
from app.models.task import Task


async def clear_database():
    """Drop all tables and recreate them."""
    print("🗑️  Clearing existing database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database cleared and tables recreated")


async def seed_data():
    """Seed the database with initial data."""
    print("\n🌱 Starting database seeding...")

    async with AsyncSession(engine) as session:
        try:
            # Password for all users (for testing): "Passw0rd!"
            test_password = "Passw0rd!"
            password_hash = get_password_hash(test_password)

            # 1. Create Group
            print("\n📦 Creating group...")
            group = Group(name="PO-2402")
            session.add(group)
            await session.flush()  # Get ID without committing
            print(f"   ✅ Group created: {group.name} (ID: {group.id})")

            # 2. Create Admin
            print("\n👤 Creating admin user...")
            admin = User(
                name="Admin User",
                email="admin@educode.io",
                password_hash=password_hash,
                role=UserRole.ADMIN,
                group_id=None  # Admin doesn't need a group
            )
            session.add(admin)
            await session.flush()
            print(f"   ✅ Admin created: {admin.email} (ID: {admin.id})")

            # 3. Create Teacher
            print("\n👨‍🏫 Creating teacher user...")
            teacher = User(
                name="John Teacher",
                email="teacher@educode.io",
                password_hash=password_hash,
                role=UserRole.TEACHER,
                group_id=None  # Teachers can teach multiple groups
            )
            session.add(teacher)
            await session.flush()
            print(f"   ✅ Teacher created: {teacher.email} (ID: {teacher.id})")

            # 4. Create Students
            print("\n👨‍🎓 Creating student users...")
            students = []
            for i in range(1, 4):
                student = User(
                    name=f"Student {i}",
                    email=f"student{i}@educode.io",
                    password_hash=password_hash,
                    role=UserRole.STUDENT,
                    group_id=group.id
                )
                session.add(student)
                students.append(student)
                await session.flush()
                print(f"   ✅ Student created: {student.email} (ID: {student.id})")

            # 5. Create Subject
            print("\n📚 Creating subject...")
            subject = Subject(name="Algorithms and Data Structures")
            session.add(subject)
            await session.flush()
            print(f"   ✅ Subject created: {subject.name} (ID: {subject.id})")

            # 6. Create Lesson
            print("\n📖 Creating lesson...")
            lesson = Lesson(
                title="Introduction to Sorting Algorithms",
                description="Learn about basic sorting algorithms including Bubble Sort, Selection Sort, and Insertion Sort. "
                           "Understand their time complexity and when to use each algorithm.",
                subject_id=subject.id,
                teacher_id=teacher.id
            )
            session.add(lesson)
            await session.flush()
            print(f"   ✅ Lesson created: {lesson.title} (ID: {lesson.id})")

            # 7. Create Task
            print("\n✏️  Creating task...")
            # Deadline 2 hours from now for testing auto-grading
            deadline = datetime.utcnow() + timedelta(hours=2)

            task_body = """
## Bubble Sort Implementation

Write a function that implements the Bubble Sort algorithm.

### Requirements:
- Function name: `bubble_sort`
- Input: List of integers
- Output: Sorted list in ascending order
- Must use the bubble sort algorithm (not built-in sort)

### Example:
```python
bubble_sort([64, 34, 25, 12, 22, 11, 90])
# Returns: [11, 12, 22, 25, 34, 64, 90]
```

### Hints:
- Compare adjacent elements
- Swap if they are in wrong order
- Repeat until no more swaps needed
"""

            task = Task(
                title="Implement Bubble Sort",
                body=task_body,
                language="python",
                lesson_id=lesson.id,
                teacher_id=teacher.id,
                deadline_at=deadline
            )
            session.add(task)
            await session.flush()
            print(f"   ✅ Task created: {task.title} (ID: {task.id})")
            print(f"   ⏰ Deadline: {deadline.isoformat()}")

            # Commit all changes
            await session.commit()
            print("\n✅ All data seeded successfully!")

            # Print summary
            print("\n" + "="*60)
            print("📊 SEED SUMMARY")
            print("="*60)
            print(f"\n🔐 LOGIN CREDENTIALS (password for all users):")
            print(f"   Password: {test_password}")
            print(f"\n👤 Users:")
            print(f"   Admin:    {admin.email}")
            print(f"   Teacher:  {teacher.email}")
            for student in students:
                print(f"   Student:  {student.email}")
            print(f"\n📦 Data:")
            print(f"   Groups:   1 (PO-2402)")
            print(f"   Subjects: 1 (Algorithms)")
            print(f"   Lessons:  1 (Sorting)")
            print(f"   Tasks:    1 (Bubble Sort)")
            print(f"\n⏰ Task deadline: {deadline.strftime('%Y-%m-%d %H:%M:%S UTC')}")
            print("="*60)

        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            await session.rollback()
            raise


async def main():
    """Main seeding function."""
    print("="*60)
    print("🌱 EduCode Database Seeder")
    print("="*60)

    try:
        # Clear database first
        await clear_database()

        # Seed data
        await seed_data()

        print("\n✅ Seeding completed successfully!")
        print("\n💡 You can now:")
        print("   1. Login as admin: admin@educode.io")
        print("   2. Login as teacher: teacher@educode.io")
        print("   3. Login as student: student1@educode.io")
        print("   4. Test the complete user flow")
        print(f"\n🔑 Password for all users: Passw0rd!")

    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
