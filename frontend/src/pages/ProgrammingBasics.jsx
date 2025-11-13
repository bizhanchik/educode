import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowLeft, Lock, CheckCircle, Code, FileText } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { isLessonUnlocked, isLessonCompleted, getCourseJournal } from '../utils/auth.js';
import BackButton from '../components/BackButton.jsx';
import ResultsBlock from '../components/ResultsBlock.jsx';
import CodeRunner from '../components/CodeRunner.jsx';

const ProgrammingBasics = ({ onPageChange }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [currentTask, setCurrentTask] = useState(0);
  const [code, setCode] = useState('');
  const [showTasks, setShowTasks] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [taskResults, setTaskResults] = useState([]);
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
      theory: "Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить. Основные принципы: алгоритмическое мышление, логика, структурированность.",
      practice: {
        tasks: [
          {
            id: 1,
            title: "Первая программа",
            description: "Напишите программу, которая выводит 'Привет, мир!'",
            starterCode: "print('Привет, мир!')",
            expectedOutput: "Привет, мир!"
          },
          {
            id: 2,
            title: "Переменные",
            description: "Создайте переменную с вашим именем и выведите её",
            starterCode: "name = 'Ваше имя'\nprint(name)",
            expectedOutput: "Ваше имя"
          }
        ]
      }
    },
    {
      id: 2,
      title: "Переменные и типы данных",
      description: "Как хранить и обрабатывать информацию",
      completed: false,
      locked: true,
      testScore: null,
      practiceScore: null,
      theory: "Переменные — это именованные ячейки памяти для хранения данных. В Python переменные создаются автоматически при присваивании значения.",
      practice: {
        tasks: [
          {
            id: 1,
            title: "Создание переменных",
            description: "Создайте переменные разных типов",
            starterCode: "name = 'Анна'\nage = 25\nheight = 1.65\nstudent = True",
            expectedOutput: "Переменные созданы"
          }
        ]
      }
    }
  ]);

  // Загружаем сохраненный прогресс при монтировании компонента
  useEffect(() => {
    const savedProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const savedCourseProgress = JSON.parse(localStorage.getItem('courseProgress') || '{"progress": 0}');
    
    // Загружаем данные из журнала
    let journalData = {};
    if (user) {
      journalData = getCourseJournal(user.id, 1);
    }
    
    console.log('Загружаем прогресс:', { savedProgress, savedCourseProgress, journalData });
    
    setCourseProgress(savedCourseProgress.progress || 0);
    
    setLessons(prevLessons =>
      prevLessons.map(lesson => {
        let shouldBeLocked = lesson.id > 1;
        
        // Проверяем, должен ли урок 2 быть заблокирован
        if (lesson.id === 2) {
          const lesson1Progress = savedProgress.find(p => p.lessonId === 1);
          shouldBeLocked = !lesson1Progress?.completed;
        }
        
        const progress = savedProgress.find(p => p.lessonId === lesson.id);
        const journalEntry = journalData[lesson.id];
        
        // Приоритет: данные из журнала, затем из прогресса
        const testScore = journalEntry?.testGrade ?? progress?.testScore ?? null;
        const practiceScore = journalEntry?.taskGrade ?? progress?.practiceScore ?? null;
        
        if (progress || journalEntry) {
          return {
            ...lesson,
            completed: progress?.completed || journalEntry?.endDate ? true : false,
            testScore: testScore,
            practiceScore: practiceScore,
            locked: shouldBeLocked
          };
        }
        
        return {
          ...lesson,
          locked: shouldBeLocked
        };
      })
    );

    // Запускаем анимацию прогресса если есть сохраненный прогресс
    if (savedCourseProgress.progress > 0) {
      setAnimateProgress(true);
      setTimeout(() => {
        setAnimateProgress(false);
      }, 2000); // Задержка для начальной анимации
    }
  }, [user]);

  // Обновляем названия и описания уроков при смене языка
  useEffect(() => {
    setLessons(prevLessons =>
      prevLessons.map(lesson => {
        if (lesson.id === 1) {
          return {
            ...lesson,
            title: t('courses.lessons.lesson1Title'),
            description: t('courses.lessons.lesson1Description')
          };
        } else if (lesson.id === 2) {
          return {
            ...lesson,
            title: t('courses.lessons.lesson2Title'),
            description: t('courses.lessons.lesson2Description')
          };
        }
        return lesson;
      })
    );
  }, [language, t]);

  const handleLessonClick = (lesson) => {
    if (lesson.locked) {
      alert('Этот урок заблокирован. Сначала завершите предыдущий урок.');
      return;
    }
    
    if (lesson.id === 1) {
      onPageChange('lesson-1');
    } else if (lesson.id === 2) {
      onPageChange('lesson-2');
    }
  };

  const handleBackToLessonsFromResults = (lessonProgress) => {
    console.log('Обновляем прогресс урока:', lessonProgress);
    
    // Обновляем состояние уроков
    setLessons(prevLessons =>
      prevLessons.map(lesson => {
        if (lesson.id === lessonProgress.lessonId) {
          return {
            ...lesson,
            completed: true,
            testScore: lessonProgress.testScore,
            practiceScore: lessonProgress.practiceScore
          };
        } else if (lesson.id === lessonProgress.lessonId + 1) {
          // Разблокируем следующий урок
          return {
            ...lesson,
            locked: false
          };
        }
        return lesson;
      })
    );

    // Обновляем прогресс курса
    const completedLessons = lessons.filter(l => l.completed).length + 1; // +1 для текущего урока
    const totalLessons = lessons.length;
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    console.log('Новый прогресс курса:', newCourseProgress);
    
    // Запускаем анимацию
    setAnimateProgress(true);
    setCourseProgress(newCourseProgress);
    
    // Сохраняем в localStorage
    localStorage.setItem('courseProgress', JSON.stringify({
      courseId: 1,
      progress: newCourseProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons
    }));
    
    // Переходим обратно к урокам
    handleBackToLessons();
  };

  const handleBackToLessons = () => {
    onPageChange('courses');
  };

  const handleTaskComplete = (taskIndex, result) => {
    const newResults = [...taskResults];
    newResults[taskIndex] = result;
    setTaskResults(newResults);
  };

  const handleFinishPractice = () => {
    setShowResults(true);
  };

  const handleBackToTasks = () => {
    setShowResults(false);
  };

  const handleBackToLessonsFromPractice = () => {
    setShowTasks(false);
    setShowResults(false);
    setTaskResults([]);
    setCurrentTask(0);
    setCode('');
  };

  const currentLesson = lessons.find(l => l.id === 1);

  if (showTasks && currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <BackButton onClick={handleBackToLessonsFromPractice} />
            <h1 className="text-2xl font-bold text-gray-900">
              Практические задания - {currentLesson.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Задания ({currentLesson.practice.tasks.length})
                </h2>
                <div className="space-y-3">
                  {currentLesson.practice.tasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => setCurrentTask(index)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        index === currentTask
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {task.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <CodeRunner
                task={currentLesson.practice.tasks[currentTask]}
                onTaskComplete={(result) => handleTaskComplete(currentTask, result)}
                onFinish={handleFinishPractice}
                forceUpdateCodeRef={null}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <BackButton onClick={handleBackToTasks} />
            <h1 className="text-2xl font-bold text-gray-900">
              Результаты практики - {currentLesson.title}
            </h1>
          </div>

          <ResultsBlock
            results={taskResults}
            onBackToLessons={() => handleBackToLessonsFromResults({
              lessonId: currentLesson.id,
              completed: true,
              testScore: 85, // Примерный балл
              practiceScore: Math.round((taskResults.filter(r => r?.success).length / taskResults.length) * 100),
              completedAt: new Date().toISOString()
            })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="pt-20">
        <BackButton onClick={handleBackToLessons}>{t('courses.backToCourses')}</BackButton>
      </div>
      
      <div className="container mx-auto px-4 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('courses.courseTitle')}
          </h1>
          <p className="text-gray-600">
            {t('courses.studyBasics')}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('courses.courseProgress')}</h2>
            <span className="text-sm text-gray-600">{courseProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
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
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 ${
                lesson.locked 
                  ? 'opacity-60' 
                  : 'hover:shadow-sm cursor-pointer'
              }`}
              onClick={() => !lesson.locked && handleLessonClick(lesson)}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left side: Icon and content */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  {lesson.locked ? (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                  ) : lesson.completed ? (
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {t('courses.lesson')} {lesson.id} — {lesson.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {lesson.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{t('courses.testing')}</span>
                        {lesson.testScore !== null && lesson.testScore !== undefined && (
                          <span className="text-blue-600 font-medium ml-1">{lesson.testScore}%</span>
                        )}
                      </div>
                      <span>|</span>
                      <div className="flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        <span>{t('courses.problemSolving')}</span>
                        {lesson.practiceScore !== null && lesson.practiceScore !== undefined && (
                          <span className="text-green-600 font-medium ml-1">{lesson.practiceScore}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side: Button */}
                <div className="flex-shrink-0">
                  <motion.button
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                      lesson.locked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : lesson.completed
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    whileHover={!lesson.locked ? { scale: 1.02 } : {}}
                    whileTap={!lesson.locked ? { scale: 0.98 } : {}}
                    disabled={lesson.locked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!lesson.locked) {
                        handleLessonClick(lesson);
                      }
                    }}
                  >
                    {lesson.locked ? t('courses.locked') : lesson.completed ? t('courses.repeat') : t('courses.startLesson')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgrammingBasics;