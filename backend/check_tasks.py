"""
Скрипт для просмотра заданий в базе данных
"""
import asyncio
from sqlalchemy import text
from app.core.database import create_database_engine, get_db
from app.core.config import settings

async def check_tasks():
    """Просмотр всех заданий"""
    engine = create_database_engine()
    
    async with engine.begin() as conn:
        # Просмотр всех заданий
        print("\n=== ВСЕ ЗАДАНИЯ (tasks) ===")
        result = await conn.execute(text("""
            SELECT 
                t.id,
                t.title,
                t.language,
                t.deadline_at,
                l.title as lesson_title,
                l.id as lesson_id
            FROM tasks t
            JOIN lessons l ON t.lesson_id = l.id
            ORDER BY t.created_at DESC
            LIMIT 20
        """))
        tasks = result.fetchall()
        for task in tasks:
            print(f"ID: {task.id}, Название: {task.title}, Урок: {task.lesson_title} (ID: {task.lesson_id})")
        
        # Просмотр всех вопросов
        print("\n=== ВСЕ ВОПРОСЫ (test_questions) ===")
        result = await conn.execute(text("""
            SELECT 
                q.id,
                q.question,
                q.correct_answer,
                q.difficulty,
                l.title as lesson_title,
                l.id as lesson_id
            FROM test_questions q
            JOIN lessons l ON q.lesson_id = l.id
            ORDER BY q.created_at DESC
            LIMIT 20
        """))
        questions = result.fetchall()
        for q in questions:
            print(f"ID: {q.id}, Вопрос: {q.question[:50]}..., Урок: {q.lesson_title} (ID: {q.lesson_id})")
        
        # Статистика
        print("\n=== СТАТИСТИКА ===")
        result = await conn.execute(text("SELECT COUNT(*) FROM tasks"))
        task_count = result.scalar()
        print(f"Всего заданий: {task_count}")
        
        result = await conn.execute(text("SELECT COUNT(*) FROM test_questions"))
        question_count = result.scalar()
        print(f"Всего вопросов: {question_count}")
        
        result = await conn.execute(text("SELECT COUNT(*) FROM lessons"))
        lesson_count = result.scalar()
        print(f"Всего уроков: {lesson_count}")

if __name__ == "__main__":
    print(f"Подключение к базе данных: {settings.DATABASE_URL.split('@')[-1]}")
    asyncio.run(check_tasks())

