#!/bin/bash
# Скрипт для запуска добавления уроков Python

cd "$(dirname "$0")"
source venv/bin/activate
python3 add_python_lessons.py

