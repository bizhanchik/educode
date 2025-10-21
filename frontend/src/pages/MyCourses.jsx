import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, Calendar, Clock, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const MyCourses = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Алгоритмизация",
      description: "Изучите основы алгоритмов и структур данных",
      progress: 0,
      lessons: 2,
      completed: 0,
      duration: "2 недели",
      color: "from-blue-500 to-blue-600",
      lessonsData: [
        { id: 1, title: "Введение в программирование", completed: false, locked: false },
        { id: 2, title: "Переменные и типы данных", completed: false, locked: true }
      ]
    },
    {
      id: 2,
      title: "База данных",
      description: "Освойте работу с базами данных и SQL",
      progress: 0,
      lessons: 2,
      completed: 0,
      duration: "2 недели",
      color: "from-green-500 to-emerald-500",
      lessonsData: [
        { id: 1, title: "Основы SQL", completed: false, locked: false },
        { id: 2, title: "Создание таблиц", completed: false, locked: true }
      ]
    },
    {
      id: 3,
      title: "ИКТ",
      description: "Информационно-коммуникационные технологии",
      progress: 0,
      lessons: 2,
      completed: 0,
      duration: "2 недели",
      color: "from-purple-500 to-pink-500",
      lessonsData: [
        { id: 1, title: "Введение в ИКТ", completed: false, locked: false },
        { id: 2, title: "Цифровые технологии", completed: false, locked: true }
      ]
    }
  ]);

  // Функция для обновления прогресса курса
  const updateCourseProgress = (courseId) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          const completedLessons = course.lessonsData.filter(lesson => lesson.completed).length;
          const progress = Math.round((completedLessons / course.lessons) * 100);
          
          // Разблокируем следующий урок, если текущий завершен
          const updatedLessonsData = course.lessonsData.map((lesson, index) => {
            if (index > 0 && course.lessonsData[index - 1].completed) {
              return { ...lesson, locked: false };
            }
            return lesson;
          });
          
          return {
            ...course,
            completed: completedLessons,
            progress: progress,
            lessonsData: updatedLessonsData
          };
        }
        return course;
      })
    );
  };

  // Функция для завершения урока
  const completeLesson = (courseId, lessonId) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          const updatedLessonsData = course.lessonsData.map(lesson => 
            lesson.id === lessonId ? { ...lesson, completed: true } : lesson
          );
          
          const completedLessons = updatedLessonsData.filter(lesson => lesson.completed).length;
          const progress = Math.round((completedLessons / course.lessons) * 100);
          
          // Разблокируем следующий урок
          const finalLessonsData = updatedLessonsData.map((lesson, index) => {
            if (index > 0 && updatedLessonsData[index - 1].completed) {
              return { ...lesson, locked: false };
            }
            return lesson;
          });
          
          return {
            ...course,
            completed: completedLessons,
            progress: progress,
            lessonsData: finalLessonsData
          };
        }
        return course;
      })
    );
  };

  const handleCourseClick = (course) => {
    if (course.id === 1) {
      // Переход на отдельную страницу для "Алгоритмизация"
      if (onPageChange) {
        onPageChange('programming-basics');
      }
    } else if (course.id === 2) {
      // Переход на отдельную страницу для "База данных"
      if (onPageChange) {
        onPageChange('database-basics');
      }
    } else if (course.id === 3) {
      // Переход на отдельную страницу для "ИКТ"
      if (onPageChange) {
        onPageChange('ict-basics');
      }
    } else {
      setCurrentCourse(course);
      setCurrentLesson(null);
    }
  };

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

  const handleBackToCourses = () => {
    setCurrentCourse(null);
    setCurrentLesson(null);
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <motion.button
              onClick={() => onPageChange && onPageChange('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Назад к главной</span>
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Назначенные курсы
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Изучайте назначенные вам курсы и развивайте свои навыки программирования
            </p>
          </motion.div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Course Header */}
                <div className={`h-20 sm:h-24 md:h-28 lg:h-32 bg-gradient-to-r ${course.color} relative`}>
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                    {course.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3 sm:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                      <span>Прогресс</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${course.color}`}
                      />
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{course.completed}/{course.lessons} уроков</span>
                      <span className="sm:hidden">{course.completed}/{course.lessons}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{course.duration}</span>
                      <span className="sm:hidden">2н</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <motion.button
                    onClick={() => handleCourseClick(course)}
                    className="w-full py-2 sm:py-2.5 md:py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200 text-xs sm:text-sm md:text-base"
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
            className="text-center mt-12 sm:mt-16"
          >
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md mx-auto">
              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Больше курсов скоро!
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Мы работаем над добавлением новых курсов. Следите за обновлениями!
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lessons View */}
      {currentCourse && !currentLesson && (
        <section className="pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <motion.button
                onClick={handleBackToCourses}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                whileHover={{ x: -4 }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Назад к курсам</span>
              </motion.button>
            </motion.div>

            {/* Course Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-8 sm:mb-12"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                {currentCourse.title}
              </h1>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                {currentCourse.description}
              </p>
            </motion.div>

            {/* Lessons List */}
            <div className="space-y-4">
              {courses.find(c => c.id === currentCourse.id)?.lessonsData.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-200 ${
                    lesson.locked 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'hover:shadow-xl cursor-pointer'
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                        lesson.completed 
                          ? 'bg-green-100 text-green-600' 
                          : lesson.locked 
                            ? 'bg-gray-100 text-gray-400' 
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : lesson.locked ? (
                          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                          Урок {lesson.id}: {lesson.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                          {lesson.locked ? 'Заблокирован' : 'Доступен'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
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
        <section className="pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6 sm:mb-8"
            >
              <motion.button
                onClick={handleBackToLessons}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                whileHover={{ x: -4 }}
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Назад к урокам</span>
              </motion.button>
            </motion.div>

            {/* Lesson Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                {currentLesson.title}
              </h1>
              
              {/* Theory Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">Теория</h2>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    Здесь будет теоретический материал для урока "{currentLesson.title}". 
                    Изучите основные концепции перед выполнением практических заданий.
                  </p>
                </div>
              </div>

              {/* Practice Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">Задание</h2>
                <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                    Практическое задание для урока "{currentLesson.title}". 
                    Выполните задачу и проверьте результат.
                  </p>
                  <motion.button
                    onClick={() => {
                      completeLesson(currentCourse.id, currentLesson.id);
                      handleBackToLessons();
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Завершить урок
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
