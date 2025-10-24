import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowLeft, Lock, CheckCircle, Code, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { isLessonUnlocked, isLessonCompleted } from '../utils/auth.js';
import BackButton from '../components/BackButton.jsx';
import ResultsBlock from '../components/ResultsBlock.jsx';
import CodeRunner from '../components/CodeRunner.jsx';

const ProgrammingBasics = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentTask, setCurrentTask] = useState(0);
  const [code, setCode] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taskResults, setTaskResults] = useState([]);
  const [forceUpdateCodeRef, setForceUpdateCodeRef] = useState(null);
<<<<<<< HEAD

  // Получаем динамические данные уроков
  const getLessonsData = () => {
    if (!user) return [];
    
    // Получаем актуальный прогресс из localStorage
    const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
    const courseProgress = userProgress[user.id]?.['algorithms'] || {};
    
    return [
      {
        id: 1,
        title: "Введение в программирование",
        description: "Основные понятия и принципы программирования",
        completed: courseProgress[1]?.completed || false,
        locked: false, // Первый урок всегда доступен
      theory: "Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить. Основные принципы: алгоритмическое мышление, логика, структурированность.",
=======
  const [activeTab, setActiveTab] = useState('video'); // video, theory, practice
  const [courseProgress, setCourseProgress] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);

  const [lessons, setLessons] = useState([
      {
        id: 1,
        title: "Введение в языки программирования...",
        description: "Изучение основ программирования, классификации языков и знакомство с Python",
        completed: false,
        locked: false,
        testScore: null,
        practiceScore: null,
      theory: "Языки программирования — это формальные языки для написания программ. Классификация: низкоуровневые (ассемблер) и высокоуровневые (Python, Java, C++). Python — интерпретируемый язык с простым синтаксисом, подходящий для начинающих. Среда разработки — инструмент для написания, отладки и запуска программ.",
>>>>>>> 706454d (ready for implementation)
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
        },
        {
          id: 3,
          title: "Задача 3: Сумма элементов списка",
          description: "Напишите программу, которая вычисляет сумму всех элементов списка",
          initialCode: '# Вычисление суммы элементов списка\nnumbers = [1, 2, 3, 4, 5]\ntotal = 0\nfor num in numbers:\n    total += num\nprint(f"Сумма: {total}")',
          expectedOutput: "Сумма: 15"
        }
      ]
    },
      {
        id: 2,
        title: "Переменные и типы данных",
        description: "Как хранить и обрабатывать информацию",
<<<<<<< HEAD
        completed: courseProgress[2]?.completed || false,
        locked: !courseProgress[1]?.completed, // Разблокируется после завершения первого урока
=======
        completed: false,
        locked: true,
        testScore: null,
        practiceScore: null,
>>>>>>> 706454d (ready for implementation)
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
<<<<<<< HEAD
    ];
  };

  const lessons = getLessonsData();
=======
  ]);
>>>>>>> 706454d (ready for implementation)

  const handleLessonClick = (lesson) => {
    if (!lesson.locked) {
      if (lesson.id === 1) {
<<<<<<< HEAD
        // Первый урок перенаправляет на Lesson1.jsx с новой структурой
        onPageChange('lesson-1');
      } else if (lesson.id === 2) {
        // Второй урок перенаправляет на Lesson2.jsx с новой структурой
        onPageChange('lesson-2');
=======
        // Переход на отдельную страницу для урока 1
        if (onPageChange) {
          onPageChange('lesson-1');
        }
      } else if (lesson.id === 2) {
        // Переход на отдельную страницу для урока 2
        if (onPageChange) {
          onPageChange('lesson-2');
        }
>>>>>>> 706454d (ready for implementation)
      } else {
        // Остальные уроки показываем внутри ProgrammingBasics
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
    setShowResults(false);
    setTaskResults([]);
  };

  const handleBackToLessonsFromResults = () => {
    // Обновляем прогресс курса
    if (user && currentLesson) {
      // Здесь должна быть логика обновления прогресса в localStorage
      const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
      if (!userProgress[user.id]) {
        userProgress[user.id] = {};
      }
      if (!userProgress[user.id]['algorithms']) {
        userProgress[user.id]['algorithms'] = {};
      }
      
      // Отмечаем урок как завершенный
      userProgress[user.id]['algorithms'][currentLesson.id] = {
        completed: true,
        completedAt: new Date().toISOString(),
        score: Math.round((taskResults.filter(r => r.completed).length / taskResults.length) * 100)
      };
      
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
    }
    
    // Возвращаемся к урокам
    handleBackToLessons();
  };

  const handleCodeChange = (newCode, forceUpdateFunction) => {
    setCode(newCode);
    if (forceUpdateFunction) {
      setForceUpdateCodeRef(() => forceUpdateFunction);
    }
  };

  const handleStartTasks = () => {
    setShowTasks(true);
    setCurrentTask(0);
    const initialCode = currentLesson.tasks[0]?.initialCode || '';
    setCode(initialCode);
    
    // Принудительно обновляем код в CodeRunner
    if (forceUpdateCodeRef) {
      forceUpdateCodeRef(initialCode);
    }
    
    // Инициализируем результаты заданий
    setTaskResults(currentLesson.tasks.map(task => ({
      completed: false,
      description: task.description,
      error: null
    })));
  };

  const handleNextTask = () => {
    if (currentLesson && currentTask < currentLesson.tasks.length - 1) {
      const nextTask = currentTask + 1;
      setCurrentTask(nextTask);
      const newCode = currentLesson.tasks[nextTask].initialCode;
      setCode(newCode);
      
      // Принудительно обновляем код в CodeRunner
      if (forceUpdateCodeRef) {
        forceUpdateCodeRef(newCode);
      }
    }
  };

  const handlePrevTask = () => {
    if (currentTask > 0) {
      const prevTask = currentTask - 1;
      setCurrentTask(prevTask);
      const newCode = currentLesson.tasks[prevTask].initialCode;
      setCode(newCode);
      
      // Принудительно обновляем код в CodeRunner
      if (forceUpdateCodeRef) {
        forceUpdateCodeRef(newCode);
      }
    }
  };

<<<<<<< HEAD
  const handleRunCode = (success, output) => {
    // Обновляем результат текущего задания
    const newResults = [...taskResults];
    newResults[currentTask] = {
      completed: success,
      description: currentLesson.tasks[currentTask].description,
      error: success ? null : output
    };
    setTaskResults(newResults);
    
    // Переходим к следующему заданию или показываем результаты
    if (success && currentTask < currentLesson.tasks.length - 1) {
      // Переходим к следующему заданию
      setTimeout(() => {
        const nextTask = currentTask + 1;
        setCurrentTask(nextTask);
        const newCode = currentLesson.tasks[nextTask].initialCode;
        setCode(newCode);
        
        // Принудительно обновляем код в CodeRunner
        if (forceUpdateCodeRef) {
          forceUpdateCodeRef(newCode);
        }
      }, 1000);
    } else if (success && currentTask === currentLesson.tasks.length - 1) {
      // Все задания выполнены, показываем результаты
      setTimeout(() => {
        setShowResults(true);
      }, 1000);
    }
=======
  const handleBackToLessonsFromResults = () => {
    // Сохраняем прогресс урока
    const lessonProgress = {
      lessonId: currentLesson.id,
      completed: true,
      testScore: Math.round(Math.random() * 40 + 60), // Симуляция балла тестирования (60-100%)
      practiceScore: Math.round((taskResults.filter(t => t.completed).length / taskResults.length) * 100),
      completedAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    const existingProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const updatedProgress = existingProgress.filter(p => p.lessonId !== currentLesson.id);
    updatedProgress.push(lessonProgress);
    localStorage.setItem('lessonProgress', JSON.stringify(updatedProgress));

    // Обновляем статус урока и разблокируем следующий
    setLessons(prevLessons => 
      prevLessons.map(lesson => {
        if (lesson.id === currentLesson.id) {
          // Помечаем текущий урок как завершенный
          return {
            ...lesson,
            completed: true,
            testScore: lessonProgress.testScore,
            practiceScore: lessonProgress.practiceScore
          };
        } else if (lesson.id === currentLesson.id + 1) {
          // Разблокируем следующий урок
          return {
            ...lesson,
            locked: false
          };
        }
        return lesson;
      })
    );

    // Обновляем прогресс курса с анимацией
    const completedLessons = updatedProgress.length;
    const totalLessons = 2; // У нас 2 урока
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    console.log('Обновление прогресса:', {
      completedLessons,
      totalLessons,
      newCourseProgress,
      currentProgress: courseProgress
    });
    
    // Запускаем анимацию прогресса
    setAnimateProgress(true);
    setCourseProgress(newCourseProgress);
    
    // Сохраняем прогресс курса
    localStorage.setItem('courseProgress', JSON.stringify({
      courseId: 1,
      progress: newCourseProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons
    }));

    // Сразу возвращаемся к списку уроков - анимация уже запущена
    handleBackToLessons();
>>>>>>> 706454d (ready for implementation)
  };

  // Загружаем сохраненные баллы при инициализации
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const savedCourseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{"progress": 0}');
    
    console.log('Загружаем прогресс:', { savedProgress, savedCourseProgress });
    
    // Устанавливаем прогресс курса
    setCourseProgress(savedCourseProgress.progress || 0);
    
    // Обновляем уроки с сохраненными баллами и разблокировкой
    setLessons(prevLessons => 
      prevLessons.map(lesson => {
        const progress = savedProgress.find(p => p.lessonId === lesson.id);
        
        // Логика разблокировки:
        // Урок 1 всегда разблокирован
        // Урок 2 разблокируется только если урок 1 завершен
        let shouldBeLocked = lesson.id > 1; // Все уроки кроме первого заблокированы по умолчанию
        
        if (lesson.id === 2) {
          // Урок 2 разблокируется если урок 1 завершен
          const lesson1Progress = savedProgress.find(p => p.lessonId === 1);
          shouldBeLocked = !lesson1Progress?.completed;
        }
        
        if (progress) {
          return {
            ...lesson,
            completed: progress.completed,
            testScore: progress.testScore,
            practiceScore: progress.practiceScore,
            locked: shouldBeLocked
          };
        }
        
        return {
          ...lesson,
          locked: shouldBeLocked
        };
      })
    );
    
    // Запускаем анимацию если есть прогресс
    if (savedCourseProgress.progress > 0) {
      setAnimateProgress(true);
      setTimeout(() => {
        setAnimateProgress(false);
      }, 2000);
    }
  }, []);

  if (currentLesson) {
  return (
      <section className="min-h-screen bg-gray-50 pt-16 sm:pt-20 md:pt-24">
        {/* Back Button */}
        <BackButton onClick={handleBackToLessons}>Назад к урокам</BackButton>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">

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
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                  <CodeRunner
                    initialCode={code}
                    onCodeChange={setCode}
                    onRunResult={handleRunCode}
                    language="python"
                  />
                </div>

                {/* Navigation Buttons */}
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

          {/* Results Block */}
          {showResults && (
            <ResultsBlock 
              tasks={taskResults} 
              onBackToLessons={handleBackToLessonsFromResults}
            />
          )}

          {/* Lesson Navigation */}
          {!showResults && (
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Урок {currentLesson.id} из {lessons.length}
            </div>
          </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 pt-16 sm:pt-20 md:pt-24">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange('courses')}>Назад к курсам</BackButton>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">

        {/* Course Header */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 sm:mb-6"
          >
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">
                Алгоритмизация
              </h1>
<<<<<<< HEAD
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
              {(() => {
                const completedLessons = lessons.filter(l => l.completed).length;
                const totalLessons = lessons.length;
                const progress = Math.round((completedLessons / totalLessons) * 100);
                return `${progress}% завершено`;
              })()}
            </span>
=======
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Изучите базовые концепции программирования и алгоритмы. Начните свой путь в мир разработки с самых основ.
          </p>
          
          {/* Course Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
            Прогресс курса
          </h2>
            <span className="text-sm sm:text-base md:text-lg text-gray-500">
                {lessons.filter(l => l.completed).length}/{lessons.length} уроков
            </span>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-3">
            <motion.div 
              key={`progress-${courseProgress}-${animateProgress}`}
              className="bg-blue-600 h-2 sm:h-3 rounded-full"
              initial={{ width: animateProgress ? 0 : `${courseProgress}%` }}
              animate={{ width: `${courseProgress}%` }}
              transition={{ 
                duration: animateProgress ? 1.5 : 0.3, 
                ease: "easeOut" 
              }}
              onAnimationComplete={() => {
                console.log('Анимация завершена, прогресс:', courseProgress);
                setAnimateProgress(false);
              }}
            ></motion.div>
            </div>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">
              Пройдено уроков: {lessons.filter(l => l.completed).length} из {lessons.length} (Прогресс: {courseProgress}%)
            </p>
>>>>>>> 706454d (ready for implementation)
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <div 
              className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${(() => {
                  const completedLessons = lessons.filter(l => l.completed).length;
                  const totalLessons = lessons.length;
                  return Math.round((completedLessons / totalLessons) * 100);
                })()}%` 
              }}
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
<<<<<<< HEAD
              className={`bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 cursor-pointer transition-all duration-200 ${
                lesson.locked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-md hover:scale-[1.02]'
=======
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 ${
                lesson.locked 
                  ? 'border-gray-200 opacity-60 cursor-not-allowed'
                  : lesson.completed
                  ? 'border-green-200 hover:border-green-300 cursor-pointer'
                  : 'border-blue-200 hover:border-blue-300 cursor-pointer'
>>>>>>> 706454d (ready for implementation)
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
<<<<<<< HEAD
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
=======
                <p className="text-gray-600 mb-4">
                  {lesson.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      Тестирование
                      {lesson.completed && lesson.testScore && (
                        <span className="text-green-600 font-medium">({lesson.testScore}%)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Code className="w-4 h-4" />
                      Решение задач
                      {lesson.completed && lesson.practiceScore && (
                        <span className="text-blue-600 font-medium">({lesson.practiceScore}%)</span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {lesson.locked ? 'Пройдите предыдущий урок' : 'Нажмите для начала'}
                  </span>
>>>>>>> 706454d (ready for implementation)
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