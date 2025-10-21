import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  PlayCircle, 
  Lock, 
  CheckCircle, 
  FileText, 
  Code,
  Palette,
  Image
} from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const ICTBasics = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentLesson, setCurrentLesson] = useState(null);

  const lessons = [
    {
      id: 1,
      title: "Введение в ИКТ",
      description: "Основы информационно-коммуникационных технологий",
      completed: false,
      locked: false,
      theory: "ИКТ (Информационно-коммуникационные технологии) — это совокупность методов, устройств и процессов, используемых для сбора, обработки, хранения, передачи и представления информации. Включает в себя компьютерные технологии, телекоммуникации и информационные системы.",
      task: "Создайте презентацию о роли ИКТ в современном мире."
    },
    {
      id: 2,
      title: "Цифровые технологии",
      description: "Современные цифровые решения и платформы",
      completed: false,
      locked: true,
      theory: "Цифровые технологии — это технологии, основанные на цифровых данных и алгоритмах. Включают в себя облачные вычисления, искусственный интеллект, интернет вещей, блокчейн и другие инновационные решения.",
      task: "Изучите и опишите применение цифровых технологий в различных сферах жизни."
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

  const handleBackToCourses = () => {
    if (onPageChange) {
      onPageChange('courses');
    }
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <motion.button
              onClick={handleBackToCourses}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к курсам
            </motion.button>
          </motion.div>

          {/* Course Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Palette className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              ИКТ
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Информационно-коммуникационные технологии
            </p>
          </motion.div>

          {/* Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-8 sm:mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Прогресс курса</h2>
              <span className="text-base sm:text-lg font-medium text-gray-600">0 / 2 урока</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "0%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Начните с первого урока, чтобы разблокировать второй</p>
          </motion.div>

          {/* Lessons List */}
          <div className="space-y-4 sm:space-y-6">
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 30 }}
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
                  <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      lesson.completed 
                        ? 'bg-purple-100 text-purple-600' 
                        : lesson.locked 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-purple-100 text-purple-600'
                    }`}>
                      {lesson.completed ? (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : lesson.locked ? (
                        <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
                      ) : (
                        <Image className="w-6 h-6 sm:w-8 sm:h-8" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 sm:mb-2 truncate">
                        Урок {lesson.id}: {lesson.title}
                      </h3>
                      <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-2 sm:mb-3">
                        {lesson.description}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Теория</span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500">
                          <Code className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Задание</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block flex-shrink-0 ml-4">
                    <div className={`text-sm sm:text-base md:text-lg font-medium ${
                      lesson.completed 
                        ? 'text-purple-600' 
                        : lesson.locked 
                          ? 'text-gray-400' 
                          : 'text-purple-600'
                    }`}>
                      {lesson.completed ? 'Завершен' : lesson.locked ? 'Заблокирован' : 'Доступен'}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
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
        <section className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
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
                Назад к урокам
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
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  Теория
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {currentLesson.theory}
                  </p>
                </div>
              </div>

              {/* Practice Section */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  Практическое задание
                </h2>
                <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 mb-4">
                    {currentLesson.task}
                  </p>
                  <motion.button
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Начать практику
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

export default ICTBasics;
