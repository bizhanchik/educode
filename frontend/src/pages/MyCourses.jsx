import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, Calendar, Clock, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const MyCourses = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  const handleCourseClick = (course) => {
    if (course.id === 1) {
      // Переход на отдельную страницу для "Алгоритмизация"
      if (onPageChange) {
        onPageChange('programming-basics');
      }
    } else {
      setCurrentCourse(course);
      setCurrentLesson(null);
    }
  };

  const handleLessonClick = (lesson) => {
    if (!lesson.locked) {
      setCurrentLesson(lesson);
    }
  };

  const handleBackToCourses = () => {
    setCurrentCourse(null);
    setCurrentLesson(null);
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
  };

  const courses = [
    {
      id: 1,
      title: "Алгоритмизация",
      description: "Изучите основы алгоритмов и структур данных",
      progress: 0,
      lessons: 5,
      completed: 0,
      duration: "2 недели",
      color: "from-blue-500 to-blue-600",
      lessonsData: [
        { id: 1, title: "Введение в программирование", completed: false, locked: false },
        { id: 2, title: "Переменные и типы данных", completed: false, locked: true },
        { id: 3, title: "Условия и циклы", completed: false, locked: true },
        { id: 4, title: "Функции", completed: false, locked: true },
        { id: 5, title: "Массивы и объекты", completed: false, locked: true }
      ]
    },
    {
      id: 2,
      title: "База данных",
      description: "Освойте работу с базами данных и SQL",
      progress: 0,
      lessons: 4,
      completed: 0,
      duration: "3 недели",
      color: "from-green-500 to-emerald-500",
      lessonsData: [
        { id: 1, title: "Основы SQL", completed: false, locked: false },
        { id: 2, title: "Создание таблиц", completed: false, locked: true },
        { id: 3, title: "Запросы и связи", completed: false, locked: true },
        { id: 4, title: "Оптимизация", completed: false, locked: true }
      ]
    },
    {
      id: 3,
      title: "Графика",
      description: "Создавайте графические интерфейсы и визуализации",
      progress: 0,
      lessons: 3,
      completed: 0,
      duration: "4 недели",
      color: "from-purple-500 to-pink-500",
      lessonsData: [
        { id: 1, title: "Введение в графику", completed: false, locked: false },
        { id: 2, title: "Canvas и SVG", completed: false, locked: true },
        { id: 3, title: "Анимации", completed: false, locked: true }
      ]
    }
  ];

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
              onClick={() => onPageChange && onPageChange('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к главной</span>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Назначенные курсы
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Изучайте назначенные вам курсы и развивайте свои навыки программирования
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Course Header */}
                <div className={`h-32 bg-gradient-to-r ${course.color} relative`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Прогресс</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${course.color}`}
                      />
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      <span>{course.completed}/{course.lessons} уроков</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    onClick={() => handleCourseClick(course)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {course.progress > 0 ? 'Продолжить' : 'Начать курс'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Больше курсов скоро!
              </h3>
              <p className="text-gray-600">
                Мы работаем над добавлением новых курсов. Следите за обновлениями!
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lessons View */}
      {currentCourse && !currentLesson && (
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
                onClick={handleBackToCourses}
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
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {currentCourse.title}
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {currentCourse.description}
              </p>
            </motion.div>

            {/* Lessons List */}
            <div className="space-y-4">
              {currentCourse.lessonsData.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
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
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        lesson.completed 
                          ? 'bg-green-100 text-green-600' 
                          : lesson.locked 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : lesson.locked ? (
                          <Lock className="w-6 h-6" />
                        ) : (
                          <PlayCircle className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Урок {lesson.id}: {lesson.title}
                        </h3>
                        <p className="text-gray-600">
                          {lesson.locked ? 'Заблокирован' : 'Доступен'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {lesson.completed ? 'Завершен' : lesson.locked ? 'Заблокирован' : 'Доступен'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

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
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {currentLesson.title}
              </h1>
              
              {/* Theory Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Теория</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed">
                    Здесь будет теоретический материал для урока "{currentLesson.title}". 
                    Изучите основные концепции перед выполнением практических заданий.
                  </p>
                </div>
              </div>

              {/* Practice Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Задание</h2>
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Практическое задание для урока "{currentLesson.title}". 
                    Выполните задачу и проверьте результат.
                  </p>
                  <motion.button
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Начать задание
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MyCourses;
