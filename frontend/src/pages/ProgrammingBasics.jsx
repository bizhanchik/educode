import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowLeft, Lock, CheckCircle, Code, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const ProgrammingBasics = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentLesson, setCurrentLesson] = useState(null);

  const lessons = [
    {
      id: 1,
      title: "Введение в программирование",
      description: "Основные понятия и принципы программирования",
      completed: false,
      locked: false,
      theory: "Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить. Основные принципы: алгоритмическое мышление, логика, структурированность.",
      task: "Создайте простую программу 'Hello World' на любом языке программирования."
    },
    {
      id: 2,
      title: "Переменные и типы данных",
      description: "Как хранить и обрабатывать информацию",
      completed: false,
      locked: true,
      theory: "Переменная — это именованная область памяти для хранения данных. Типы данных: числа (int, float), строки (string), логические значения (boolean), массивы и объекты.",
      task: "Создайте переменные разных типов и выведите их значения."
    },
    {
      id: 3,
      title: "Условия и циклы",
      description: "Управление потоком выполнения программы",
      completed: false,
      locked: true,
      theory: "Условные операторы (if, else, switch) позволяют выполнять код в зависимости от условий. Циклы (for, while) повторяют выполнение кода определенное количество раз.",
      task: "Напишите программу с использованием условий и циклов для решения простой задачи."
    },
    {
      id: 4,
      title: "Функции",
      description: "Создание переиспользуемого кода",
      completed: false,
      locked: true,
      theory: "Функция — это блок кода, который можно вызывать многократно. Функции принимают параметры и могут возвращать значения. Они помогают структурировать код и избегать дублирования.",
      task: "Создайте несколько функций для выполнения различных операций."
    },
    {
      id: 5,
      title: "Массивы и объекты",
      description: "Работа со структурированными данными",
      completed: false,
      locked: true,
      theory: "Массив — это структура данных для хранения множества элементов одного типа. Объект — это структура для хранения связанных данных в виде ключ-значение. Они позволяют эффективно организовывать данные.",
      task: "Создайте массив и объект, выполните с ними различные операции."
    }
  ];

  const handleLessonClick = (lesson) => {
    if (!lesson.locked) {
      if (lesson.id === 1) {
        // Переход на отдельную страницу для урока 1
        if (onPageChange) {
          onPageChange('lesson-1');
        }
      } else {
        setCurrentLesson(lesson);
      }
    }
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <motion.button
              onClick={() => onPageChange && onPageChange('courses')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к курсам</span>
            </motion.button>
          </motion.div>

          {/* Course Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900">
                Алгоритмизация
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Изучите базовые концепции программирования и алгоритмы. Начните свой путь в мир разработки с самых основ.
            </p>
          </motion.div>

          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Прогресс курса</h2>
              <span className="text-lg font-medium text-gray-600">0 / 5 уроков</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "0%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
            <p className="text-gray-600 mt-2">Начните с первого урока, чтобы разблокировать следующие</p>
          </motion.div>

          {/* Lessons List */}
          <div className="space-y-6">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-lg p-6 transition-all duration-200 ${
                  lesson.locked 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-xl cursor-pointer'
                }`}
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                      lesson.completed 
                        ? 'bg-green-100 text-green-600' 
                        : lesson.locked 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-blue-100 text-blue-600'
                    }`}>
                      {lesson.completed ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : lesson.locked ? (
                        <Lock className="w-8 h-8" />
                      ) : (
                        <PlayCircle className="w-8 h-8" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        Урок {lesson.id}: {lesson.title}
                      </h3>
                      <p className="text-gray-600 text-lg">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FileText className="w-4 h-4" />
                          <span>Теория</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Code className="w-4 h-4" />
                          <span>Задание</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-medium ${
                      lesson.completed 
                        ? 'text-green-600' 
                        : lesson.locked 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
                    }`}>
                      {lesson.completed ? 'Завершен' : lesson.locked ? 'Заблокирован' : 'Доступен'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {lesson.locked ? 'Пройдите предыдущий урок' : 'Нажмите для начала'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lesson View */}
      {currentLesson && (
        <section className="py-20 px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <motion.button
                onClick={handleBackToLessons}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ x: -4 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Назад к урокам</span>
              </motion.button>
            </motion.div>

            {/* Lesson Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {/* Lesson Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">
                  Урок {currentLesson.id}: {currentLesson.title}
                </h1>
                <p className="text-blue-100 text-lg">
                  {currentLesson.description}
                </p>
              </div>

              <div className="p-8">
                {/* Theory Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-semibold text-gray-800">Теория</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {currentLesson.theory}
                    </p>
                  </div>
                </div>

                {/* Practice Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-semibold text-gray-800">Задание</h2>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">
                      {currentLesson.task}
                    </p>
                    <div className="flex gap-4">
                      <motion.button
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Начать задание
                      </motion.button>
                      <motion.button
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Проверить решение
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Lesson Navigation */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Урок {currentLesson.id} из {lessons.length}
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                      whileHover={{ x: -2 }}
                    >
                      ← Предыдущий
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      Следующий →
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProgrammingBasics;
