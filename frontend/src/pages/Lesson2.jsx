import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Code, Lightbulb, FileText, Star, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { updateUserProgress, saveGrade, addNotification, updateLessonProgress, getLessonProgress } from '../utils/auth.js';
import Toast from '../components/Toast.jsx';
import CodeRunner from '../components/CodeRunner.jsx';
import BackButton from '../components/BackButton.jsx';

const Lesson2 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('video'); // 'video', 'theory', or 'practice'
  const [currentTask, setCurrentTask] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [lessonGrade, setLessonGrade] = useState(null);
  const [taskResults, setTaskResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Типы данных',
      description: 'Создайте переменные разных типов и выведите их значения',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Создайте переменные разных типов
age = 25
name = "Анна"
is_student = True
print(f"Имя: {name}, Возраст: {age}, Студент: {is_student}")`
    },
    {
      id: 'task-2', 
      title: 'Арифметические операции',
      description: 'Выполните базовые арифметические операции с числами',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Выполните арифметические операции
a = 10
b = 5
print(f"Сложение: {a + b}")
print(f"Вычитание: {a - b}")
print(f"Умножение: {a * b}")
print(f"Деление: {a / b}")`
    },
    {
      id: 'task-3',
      title: 'Работа со строками', 
      description: 'Выполните операции со строками: конкатенация, форматирование',
      userAnswer: '',
      status: 'pending',
      maxPoints: 40,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Работа со строками
first_name = "Иван"
last_name = "Петров"
full_name = first_name + " " + last_name
print(f"Полное имя: {full_name}")
print(f"Длина имени: {len(full_name)}")`
    }
  ]);
  const [code, setCode] = useState(tasks[0].initialCode);

  // Загружаем прогресс урока при монтировании компонента
  React.useEffect(() => {
    if (user) {
      const progress = getLessonProgress(user.id, 'algorithms', 2);
      setLessonProgress(progress);
    }
  }, [user]);

  const handleRunCode = (isSuccess, result) => {
    // Проверяем текущее задание
    const task = tasks[currentTask];
    
    // Обновляем статус задания на основе результата выполнения
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === task.id 
          ? {
              ...t,
              status: isSuccess ? 'passed' : 'failed',
              gainedPoints: isSuccess ? task.maxPoints : Math.floor(task.maxPoints * 0.3),
              userAnswer: code,
              errorExplanation: isSuccess ? '' : result || 'Ошибка выполнения кода'
            }
          : t
      )
    );
    
    console.log('Задание проверено:', task.title, 'Статус:', isSuccess ? 'passed' : 'failed');
    console.log('Все задания:', tasks.map(t => ({ title: t.title, status: t.status })));
    
    // Показываем toast
    setToast({
      message: isSuccess ? 'Задание выполнено правильно!' : 'Найдены ошибки в коде',
      type: isSuccess ? 'success' : 'error',
      duration: 3000
    });
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

  const handleNextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setCode(tasks[currentTask + 1].initialCode);
    }
  };

  const handlePrevTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
      setCode(tasks[currentTask - 1].userAnswer || tasks[currentTask - 1].initialCode);
    }
  };

  const handleSubmitResults = async () => {
    const allChecked = tasks.every(t => t.status !== 'pending');
    
    if (!allChecked) {
      setToast({
        message: 'Проверьте все задания перед завершением урока',
        type: 'error',
        duration: 3000
      });
      return;
    }

    const totalMaxPoints = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const totalGainedPoints = tasks.reduce((s, t) => s + t.gainedPoints, 0);
    const passed = tasks.filter(t => t.status === 'passed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const percent = Math.round((totalGainedPoints / totalMaxPoints) * 100);

    // Симуляция отправки результатов
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Показываем результаты
      setShowResults(true);
      
      // Показываем toast
      setToast({
        message: 'Результаты отправлены. Баллы появятся в журнале через несколько минут.',
        type: 'success',
        duration: 5000
      });

      // Добавляем уведомление
      addNotification(
        user.id,
        'grade',
        'Новый результат в журнале',
        `Практика по Алгоритмизации - Урок 2: ${totalGainedPoints}/${totalMaxPoints}. Нажмите, чтобы открыть.`,
        1,
        2
      );

    } catch (error) {
      setToast({
        message: 'Ошибка при отправке результатов',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleBackToLessons = () => {
    if (onPageChange) {
      onPageChange('programming-basics');
    }
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    
    // Обновляем прогресс секции для всех разделов
    if (user) {
      updateLessonProgress(user.id, 'algorithms', 2, section);
      
      // Обновляем локальное состояние прогресса
      const updatedProgress = getLessonProgress(user.id, 'algorithms', 2);
      setLessonProgress(updatedProgress);
      
      // Показываем toast при завершении урока
      if (updatedProgress.completed && !lessonProgress?.completed) {
        setToast({
          message: 'Поздравляем! Урок завершен!',
          type: 'success',
          duration: 5000
        });
      }
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen pt-20 sm:pt-24">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>

      {/* Lesson Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-12 px-4 sm:px-6"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Переменные и типы данных
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Изучите как хранить и обрабатывать информацию в программах
        </p>
      </motion.div>

      {/* Section Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.button
              onClick={() => handleSectionChange('video')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === 'video'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentSection === 'video' ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <Play className={`w-3 h-3 ${
                  currentSection === 'video' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'video' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Видео
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => handleSectionChange('theory')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === 'theory'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentSection === 'theory' ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <BookOpen className={`w-3 h-3 ${
                  currentSection === 'theory' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'theory' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Теория
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => handleSectionChange('practice')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === 'practice'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentSection === 'practice' ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <Code className={`w-3 h-3 ${
                  currentSection === 'practice' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'practice' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Практика
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        {/* Video Section */}
        {currentSection === 'video' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Видеоурок</h2>
            </div>
            
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <p className="text-lg font-medium">Видео "Переменные и типы данных"</p>
                <p className="text-sm opacity-70 mt-2">Длительность: 10 минут</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Что вы изучите:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Что такое переменные и как их создавать
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Основные типы данных: числа, строки, логические значения
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Арифметические операции с числами
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Работа со строками и форматирование
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Theory Section */}
        {currentSection === 'theory' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Теория</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Что такое переменные?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Переменная</strong> — это именованная область памяти для хранения данных. 
                В Python переменные создаются автоматически при присваивании значения.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные типы данных:</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Числа (int, float)</h4>
                  <p className="text-gray-700 mb-2">Целые и дробные числа для математических операций.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    age = 25<br/>
                    price = 99.99<br/>
                    result = age + price
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Строки (str)</h4>
                  <p className="text-gray-700 mb-2">Текстовые данные в кавычках.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    name = "Анна"<br/>
                    message = f"Привет, {name}!"<br/>
                    print(message)
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Логические значения (bool)</h4>
                  <p className="text-gray-700 mb-2">True или False для условий.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    is_student = True<br/>
                    is_working = False<br/>
                    if is_student: print("Студент")
                  </code>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Practice Section */}
        {currentSection === 'practice' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-6 h-6 text-green-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Практика</h2>
            </div>

            {/* Task Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Задание {currentTask + 1} из {tasks.length}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {tasks[currentTask].title}
              </h3>
              <p className="text-gray-700">
                {tasks[currentTask].description}
              </p>
            </div>

            {/* Code Editor */}
            <CodeRunner
              initialCode={code}
              onCodeChange={handleCodeChange}
              onRunResult={handleRunCode}
            />

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.button
                onClick={handlePrevTask}
                disabled={currentTask === 0}
                className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                  currentTask === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                whileHover={currentTask > 0 ? { scale: 1.02 } : {}}
                whileTap={currentTask > 0 ? { scale: 0.98 } : {}}
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </motion.button>
              
              {currentTask === tasks.length - 1 ? (
                <motion.button
                  onClick={handleSubmitResults}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trophy className="w-4 h-4" />
                  Показать результаты
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNextTask}
                  className="flex-1 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Далее
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Modal */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Результаты практики
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Итоги</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.status === 'passed').length}
                    </div>
                    <div className="text-sm text-gray-600">Правильно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => t.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-600">Неправильно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tasks.reduce((s, t) => s + t.gainedPoints, 0)} / {tasks.reduce((s, t) => s + t.maxPoints, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Баллы</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((tasks.reduce((s, t) => s + t.gainedPoints, 0) / tasks.reduce((s, t) => s + t.maxPoints, 0)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Процент</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Детали по заданиям</h3>
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Задание {index + 1}: {task.title}</h4>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'passed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {task.status === 'passed' ? 'Выполнено' : 'Ошибка'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Баллы: {task.gainedPoints} / {task.maxPoints}
                    </div>
                    {task.errorExplanation && (
                      <div className="text-sm text-red-600 mt-2">
                        {task.errorExplanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  Ваши баллы будут добавлены в журнал в течение нескольких минут.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <motion.button
                  onClick={() => setShowResults(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Закрыть
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowResults(false);
                    onPageChange && onPageChange('journal');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Перейти в журнал
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Lesson2;
