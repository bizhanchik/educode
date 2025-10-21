import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowLeft, Lock, CheckCircle, Code, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const ProgrammingBasics = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentTask, setCurrentTask] = useState(0);
  const [code, setCode] = useState('');
  const [showTasks, setShowTasks] = useState(false);

  const lessons = [
    {
      id: 1,
      title: "Введение в программирование",
      description: "Основные понятия и принципы программирования",
      completed: false,
      locked: false,
      theory: "Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить. Основные принципы: алгоритмическое мышление, логика, структурированность.",
      tasks: [
        {
          id: 1,
          title: "Задача 1: Hello World",
          description: "Создайте простую программу, которая выводит 'Hello, World!' на экран.",
          initialCode: '# Напишите здесь вашу программу\nprint("Hello, World!")',
          expectedOutput: "Hello, World!"
        },
        {
          id: 2,
          title: "Задача 2: Переменные",
          description: "Создайте переменную с вашим именем и выведите приветствие.",
          initialCode: '# Создайте переменную с вашим именем\nname = "Ваше имя"\nprint(f"Привет, {name}!")',
          expectedOutput: "Привет, Ваше имя!"
        }
      ]
    },
    {
      id: 2,
      title: "Переменные и типы данных",
      description: "Как хранить и обрабатывать информацию",
      completed: false,
      locked: true,
      theory: "Переменная — это именованная область памяти для хранения данных. Типы данных: числа (int, float), строки (string), логические значения (boolean), массивы и объекты.",
      tasks: [
        {
          id: 1,
          title: "Задача 1: Типы данных",
          description: "Создайте переменные разных типов и выведите их значения.",
          initialCode: '# Создайте переменные разных типов\nage = 25\nname = "Анна"\nis_student = True\nprint(f"Имя: {name}, Возраст: {age}, Студент: {is_student}")',
          expectedOutput: "Имя: Анна, Возраст: 25, Студент: True"
        },
        {
          id: 2,
          title: "Задача 2: Арифметические операции",
          description: "Выполните базовые арифметические операции с числами.",
          initialCode: '# Выполните арифметические операции\na = 10\nb = 5\nprint(f"Сложение: {a + b}")\nprint(f"Вычитание: {a - b}")\nprint(f"Умножение: {a * b}")\nprint(f"Деление: {a / b}")',
          expectedOutput: "Сложение: 15\nВычитание: 5\nУмножение: 50\nДеление: 2.0"
        }
      ]
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
        setCurrentTask(0);
        setCode(lesson.tasks[0]?.initialCode || '');
      }
    }
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
    setCurrentTask(0);
    setCode('');
    setShowTasks(false);
  };

  const handleStartTasks = () => {
    setShowTasks(true);
    setCurrentTask(0);
    setCode(currentLesson.tasks[0]?.initialCode || '');
  };

  const handleNextTask = () => {
    if (currentLesson && currentTask < currentLesson.tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setCode(currentLesson.tasks[currentTask + 1].initialCode);
    }
  };

  const handlePrevTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
      setCode(currentLesson.tasks[currentTask - 1].initialCode);
    }
  };

  const handleRunCode = () => {
    // Симуляция выполнения кода
    const output = currentLesson.tasks[currentTask]?.expectedOutput || "Код выполнен успешно!";
    alert(`Результат выполнения:\n\n${output}`);
  };

  if (currentLesson) {
  return (
      <section className="min-h-screen bg-gray-50 pt-16 sm:pt-20 md:pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <motion.button
              onClick={handleBackToLessons}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm sm:text-base font-medium"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к урокам
            </motion.button>
          </div>

          {/* Lesson Header */}
          <div className="mb-8 sm:mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Code className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {currentLesson.title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
                  {currentLesson.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
              Прогресс урока
            </h2>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-sm sm:text-base md:text-lg font-medium text-gray-700">
                Урок {currentLesson.id} из {lessons.length}
              </span>
              <span className="text-sm sm:text-base md:text-lg text-gray-500">
                {currentLesson.completed ? 'Завершен' : 'В процессе'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div 
                className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{ width: `${(currentLesson.id / lessons.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-3 sm:mt-4">
              Изучите теорию и выполните практические задания для завершения урока.
                </p>
              </div>

                {/* Theory Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Теория</h2>
                  </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 border border-gray-200">
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                      {currentLesson.theory}
                    </p>
                  </div>
                </div>

                {/* Practice Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">Практическое задание</h2>
            </div>
            
            {!showTasks ? (
              /* Introduction to Practice */
              <div className="bg-green-50 rounded-lg p-4 sm:p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                    Вы прошли и изучили теорию данного урока!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 mb-6 max-w-2xl mx-auto">
                    Теперь можно перейти к практическим заданиям, чтобы закрепить материал.
                  </p>
                      <motion.button
                    onClick={handleStartTasks}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center justify-center gap-2 mx-auto"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                    <PlayCircle className="w-5 h-5" />
                    Приступить к решению задач
                      </motion.button>
                    </div>
              </div>
            ) : (
              /* Tasks Section */
              <>
                {/* Task Info */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">
                      {currentLesson.tasks[currentTask]?.title}
                    </h3>
                    <span className="text-sm sm:text-base text-gray-600 bg-white px-3 py-1 rounded-full">
                      Задача {currentTask + 1} из {currentLesson.tasks.length}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-3 sm:mb-4">
                    {currentLesson.tasks[currentTask]?.description}
                  </p>
                </div>

                {/* Code Editor */}
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base md:text-lg font-semibold text-white">Редактор кода</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-gray-400">Python</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-40 sm:h-48 md:h-56 bg-gray-800 text-green-400 font-mono text-xs sm:text-sm md:text-base p-3 sm:p-4 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Введите ваш код здесь..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <motion.button
                    onClick={handleRunCode}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Запустить
                  </motion.button>
                  
                  <div className="flex gap-3 sm:gap-4">
                    <motion.button
                      onClick={handlePrevTask}
                      disabled={currentTask === 0}
                      className={`flex items-center gap-2 text-sm sm:text-base font-medium transition-colors duration-200 ${
                        currentTask === 0 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      whileHover={currentTask > 0 ? { x: -4 } : {}}
                      whileTap={currentTask > 0 ? { scale: 0.98 } : {}}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Назад
                    </motion.button>
                    
                    <motion.button
                      onClick={handleNextTask}
                      disabled={currentTask === currentLesson.tasks.length - 1}
                      className={`flex items-center gap-2 text-sm sm:text-base font-medium transition-colors duration-200 ${
                        currentTask === currentLesson.tasks.length - 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      whileHover={currentTask < currentLesson.tasks.length - 1 ? { x: 4 } : {}}
                      whileTap={currentTask < currentLesson.tasks.length - 1 ? { scale: 0.98 } : {}}
                    >
                      Далее
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </motion.button>
                  </div>
                </div>

                {/* Task Progress */}
                <div className="mt-4 sm:mt-6">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <span>Прогресс задач</span>
                    <span>{currentTask + 1} / {currentLesson.tasks.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentTask + 1) / currentLesson.tasks.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Lesson Navigation */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Урок {currentLesson.id} из {lessons.length}
            </div>
            <motion.button
              onClick={handleBackToLessons}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm sm:text-base font-medium"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к урокам
            </motion.button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 pt-16 sm:pt-20 md:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <motion.button
            onClick={() => onPageChange('courses')}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к курсам
          </motion.button>
        </div>

        {/* Course Header */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4 sm:mb-6"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Code className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
                Алгоритмизация
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
                Основы программирования и алгоритмического мышления
              </p>
            </div>
          </motion.div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 md:p-8 mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
            Прогресс курса
          </h2>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-sm sm:text-base md:text-lg font-medium text-gray-700">
              Курс: Алгоритмизация
            </span>
            <span className="text-sm sm:text-base md:text-lg text-gray-500">
              В процессе
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <div 
              className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
              style={{ width: '20%' }}
            ></div>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-3 sm:mt-4">
            Изучите основы программирования и алгоритмического мышления.
          </p>
        </div>

        {/* Lessons List */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 cursor-pointer transition-all duration-200 ${
                lesson.locked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-md hover:scale-[1.02]'
              }`}
              onClick={() => handleLessonClick(lesson)}
            >
              <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {lesson.locked ? (
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-400" />
                  ) : lesson.completed ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-600" />
                  ) : (
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 break-words">
                    {lesson.id}. {lesson.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 break-words">
                    {lesson.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
                  {lesson.locked ? (
                    <span className="text-xs sm:text-sm text-gray-400">Заблокирован</span>
                  ) : lesson.completed ? (
                    <span className="text-xs sm:text-sm text-green-600">Завершен</span>
                  ) : (
                    <span className="text-xs sm:text-sm text-blue-600">Доступен</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
          </div>
        </section>
  );
};

export default ProgrammingBasics;