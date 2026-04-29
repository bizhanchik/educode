#!/usr/bin/env python3
"""
Скрипт для обновления поля order у существующих уроков.
Извлекает номер урока из названия (например, "Урок 1" -> order=1)
"""

import asyncio
import httpx
import os
import re

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

async def get_auth_token(email: str, password: str) -> str:
    """Получить токен авторизации"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_BASE_URL}/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token", "")
        raise Exception(f"Failed to login: {response.text}")

async def get_lessons(client: httpx.AsyncClient, token: str, subject_id: int):
    """Получить все уроки курса"""
    headers = {"Authorization": f"Bearer {token}"}
    all_lessons = []
    page = 1
    size = 100
    
    while True:
        response = await client.get(
            f"{API_BASE_URL}/api/v1/lessons?subject_id={subject_id}&page={page}&size={size}",
            headers=headers
        )
        if response.status_code != 200:
            break
        
        data = response.json()
        lessons = data.get("data", {}).get("lessons", [])
        if not lessons:
            break
        
        all_lessons.extend(lessons)
        total = data.get("data", {}).get("total", 0)
        if len(all_lessons) >= total:
            break
        page += 1
    
    return all_lessons

async def update_lesson_order(client: httpx.AsyncClient, token: str, lesson_id: int, order: int):
    """Обновить order урока"""
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.put(
        f"{API_BASE_URL}/api/v1/lessons/{lesson_id}",
        headers=headers,
        json={"order": order}
    )
    return response.status_code in [200, 201]

def extract_lesson_number(title: str) -> int:
    """Извлечь номер урока из названия"""
    # Ищем паттерн "Урок 1", "Урок 2" и т.д.
    match = re.search(r'Урок\s+(\d+)', title, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None

async def main():
    """Основная функция"""
    print("🔄 Обновление порядка уроков...")
    
    email = input("Введите email учителя: ")
    password = input("Введите пароль: ")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Авторизация
        print("🔐 Авторизация...")
        token = await get_auth_token(email, password)
        if not token:
            print("❌ Ошибка авторизации")
            return
        
        # Получаем информацию о пользователе
        headers = {"Authorization": f"Bearer {token}"}
        user_response = await client.get(
            f"{API_BASE_URL}/api/v1/auth/me",
            headers=headers
        )
        if user_response.status_code != 200:
            print("❌ Не удалось получить информацию о пользователе")
            return
        
        # Находим курс Python
        print("🔍 Поиск курса Python...")
        subject_id = None
        response = await client.get(
            f"{API_BASE_URL}/api/v1/subjects?size=100",
            headers=headers
        )
        if response.status_code == 200:
            data = response.json()
            subjects = data.get("data", {}).get("subjects", [])
            for subj in subjects:
                if "Python" in subj.get("name", "") or "ПМО2" in subj.get("name", ""):
                    subject_id = subj.get("id")
                    print(f"✅ Найден курс: {subj.get('name')} (ID: {subject_id})")
                    break
        
        if not subject_id:
            print("❌ Курс Python не найден")
            return
        
        # Получаем все уроки
        print(f"\n📚 Получение уроков курса...")
        lessons = await get_lessons(client, token, subject_id)
        print(f"✅ Найдено уроков: {len(lessons)}")
        
        # Обновляем order для каждого урока
        updated = 0
        skipped = 0
        
        for lesson in lessons:
            lesson_id = lesson.get("id")
            title = lesson.get("title", "")
            current_order = lesson.get("order")
            
            lesson_num = extract_lesson_number(title)
            if lesson_num is None:
                print(f"  ⚠️  Пропущен урок '{title}' - не удалось извлечь номер")
                skipped += 1
                continue
            
            if current_order == lesson_num:
                print(f"  ✓ Урок {lesson_num}: '{title}' - order уже правильный")
                continue
            
            print(f"  🔄 Урок {lesson_num}: '{title}' - обновление order с {current_order} на {lesson_num}")
            success = await update_lesson_order(client, token, lesson_id, lesson_num)
            if success:
                print(f"  ✅ Обновлен")
                updated += 1
            else:
                print(f"  ❌ Ошибка обновления")
                skipped += 1
        
        print(f"\n✅ Готово! Обновлено: {updated}, Пропущено: {skipped}")

if __name__ == "__main__":
    asyncio.run(main())

