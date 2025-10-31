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
import BackButton from '../components/BackButton.jsx';
import ResultsBlock from '../components/ResultsBlock.jsx';

const GraphicsBasics = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentTask, setCurrentTask] = useState(0);
  const [code, setCode] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taskResults, setTaskResults] = useState([]);

  const lessons = [
    {
      id: 1,
      title: "Основы графического дизайна",
      description: "Изучите принципы и элементы дизайна",
      completed: false,
      locked: false,
      theory: "Графический дизайн — это искусство создания визуального контента для передачи сообщений. Основные принципы: контраст, баланс, пропорции, ритм, единство. Элементы дизайна: линия, форма, цвет, текстура, пространство.",
      tasks: [
        {
          id: 1,
          title: "Задача 1: Цветовая схема",
          description: "Создайте цветовую схему для логотипа компании.",
          initialCode: '/* CSS цветовая схема */\n:root {\n  --primary-color: #3498db;\n  --secondary-color: #2ecc71;\n  --accent-color: #e74c3c;\n  --text-color: #2c3e50;\n  --background-color: #ecf0f1;\n}',
          expectedOutput: "Цветовая схема создана"
        },
        {
          id: 2,
          title: "Задача 2: Типографика",
          description: "Настройте типографику для веб-страницы.",
          initialCode: '/* CSS типографика */\nbody {\n  font-family: "Arial", sans-serif;\n  font-size: 16px;\n  line-height: 1.6;\n  color: var(--text-color);\n}\n\nh1 {\n  font-size: 2.5rem;\n  font-weight: bold;\n  margin-bottom: 1rem;\n}',
          expectedOutput: "Типографика настроена"
        },
        {
          id: 3,
          title: "Задача 3: Макет страницы",
          description: "Создайте адаптивный макет страницы.",
          initialCode: '/* CSS макет */\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 20px;\n}\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));\n  gap: 20px;\n}',
          expectedOutput: "Макет создан"
        }
      ]
    },
    {
      id: 2,
      title: "Работа с изображениями",
      description: "Обработка и оптимизация графики",
      completed: false,
      locked: true,
      theory: "Работа с изображениями включает в себя выбор правильного формата, оптимизацию размера, создание адаптивных изображений и использование современных форматов как WebP.",
      tasks: [
        {
          id: 1,
          title: "Задача 1: Оптимизация изображений",
          description: "Создайте CSS для адаптивных изображений.",
          initialCode: '/* CSS для адаптивных изображений */\nimg {\n  max-width: 100%;\n  height: auto;\n  display: block;\n}\n\n.responsive-img {\n  width: 100%;\n  object-fit: cover;\n}',
          expectedOutput: "CSS создан"
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

  const handleBackToCourses = () => {
    if (onPageChange) {
      onPageChange('courses');
    }
  };

  const handleBackToLessons = () => {
    setCurrentLesson(null);
    setCurrentTask(0);
    setCode('');
    setShowTasks(false);
    setShowResults(false);
    setTaskResults([]);
  };

  const handleBackToLessonsFromResults = () => {
    // Обновляем прогресс курса
    if (currentLesson) {
      const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
      if (!userProgress['graphics']) {
        userProgress['graphics'] = {};
      }
      
      // Отмечаем урок как завершенный
      userProgress['graphics'][currentLesson.id] = {
        completed: true,
        completedAt: new Date().toISOString(),
        score: Math.round((taskResults.filter(r => r.completed).length / taskResults.length) * 100)
      };
      
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
    }
    
    // Возвращаемся к урокам
    handleBackToLessons();
  };

  const handleStartTasks = () => {
    setShowTasks(true);
    setCurrentTask(0);
    setCode(currentLesson.tasks[0]?.initialCode || '');
    // Инициализируем результаты заданий
    setTaskResults(currentLesson.tasks.map(task => ({
      completed: false,
      description: task.description,
      error: null
    })));
  };

  const handleRunCode = () => {
    // Симуляция выполнения кода
    const output = currentLesson.tasks[currentTask]?.expectedOutput || "Код выполнен успешно!";
    
    // Обновляем результат текущего задания
    const newResults = [...taskResults];
    newResults[currentTask] = {
      completed: true,
      description: currentLesson.tasks[currentTask].description,
      error: null
    };
    setTaskResults(newResults);
    
    // Переходим к следующему заданию или показываем результаты
    if (currentTask < currentLesson.tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setCode(currentLesson.tasks[currentTask + 1].initialCode);
    } else {
      // Все задания выполнены - показываем результаты
      setShowResults(true);
    }
    
    alert(`Результат выполнения:\n\n${output}`);
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen">
      {/* Back Button */}
      <BackButton onClick={handleBackToCourses}>Назад к курсам</BackButton>
      
      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">

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
                        ? 'bg-blue-100 text-blue-600' 
                        : lesson.locked 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-blue-100 text-blue-600'
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
                          <span className="hidden sm:inline">Тестирование</span>
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
                        ? 'text-blue-600' 
                        : lesson.locked 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
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
        <section className="pt-20 sm:pt-24 md:pt-20 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8">
          {/* Back Button */}
          <BackButton onClick={handleBackToLessons}>Назад к урокам</BackButton>
          
          <div className="max-w-4xl mx-auto">

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
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Тестирование
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {currentLesson.theory}
                  </p>
                </div>
              </div>

              {/* Practice Section */}
              {!showTasks ? (
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    Практические задания
                  </h2>
                  <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
                    <p className="text-sm sm:text-base text-gray-700 mb-4">
                      Выполните все задания урока для завершения
                    </p>
                    <motion.button
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartTasks}
                    >
                      Начать задания
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Task Navigation */}
                  <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      Задание {currentTask + 1} из {currentLesson.tasks.length}
                    </h2>
                    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
                        {currentLesson.tasks[currentTask].title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-700 mb-4">
                        {currentLesson.tasks[currentTask].description}
                      </p>
                      
                      {/* Code Editor */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CSS код:
                        </label>
                        <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full h-32 sm:h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                          placeholder="Введите ваш CSS код здесь..."
                        />
                      </div>

                      {/* Run Button */}
                      <motion.button
                        onClick={handleRunCode}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <PlayCircle className="w-4 h-4" />
                        Запустить
                      </motion.button>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                      <span>Прогресс заданий</span>
                      <span>{currentTask + 1} / {currentLesson.tasks.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentTask + 1) / currentLesson.tasks.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}

              {/* Results Block */}
              {showResults && (
                <ResultsBlock 
                  tasks={taskResults} 
                  onBackToLessons={handleBackToLessonsFromResults}
                />
              )}
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default GraphicsBasics;
