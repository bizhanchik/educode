import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Code, Lightbulb, FileText, Star, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { updateUserProgress, saveGrade, addNotification } from '../utils/auth.js';
import Toast from '../components/Toast.jsx';
import CodeRunner from '../components/CodeRunner.jsx';
import BackButton from '../components/BackButton.jsx';

const DatabaseLesson1 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('video'); // 'video', 'theory', or 'practice'
  const [currentTask, setCurrentTask] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [lessonGrade, setLessonGrade] = useState(null);
  const [taskResults, setTaskResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Создание таблицы',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `-- Создание таблицы products
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50)
);`
    },
    {
      id: 'task-2', 
      title: 'Вставка данных',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `-- Вставка данных в таблицу products
INSERT INTO products (name, price, category) VALUES
('iPhone 15', 999.99, 'Электроника'),
('MacBook Pro', 1999.99, 'Электроника'),
('Книга по SQL', 29.99, 'Книги');`
    },
    {
      id: 'task-3',
      title: 'Выборка данных', 
      userAnswer: '',
      status: 'pending',
      maxPoints: 40,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `-- Выборка товаров из категории "Электроника"
SELECT name, price 
FROM products 
WHERE category = 'Электроника';`
    }
  ]);
  const [code, setCode] = useState(tasks[0].initialCode);


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
      setCode(tasks[currentTask + 1].userAnswer || tasks[currentTask + 1].initialCode || '');
    }
  };

  const handleSubmitResults = async () => {
    console.log('Попытка отправить результаты...');
    console.log('Текущие задания:', tasks.map(t => ({ title: t.title, status: t.status })));
    
    const allChecked = tasks.every(t => t.status !== 'pending');
    console.log('Все задания проверены:', allChecked);
    
    if (!allChecked) {
      console.log('Не все задания проверены, выход из функции');
      return;
    }

    const totalMaxPoints = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const totalGainedPoints = tasks.reduce((s, t) => s + t.gainedPoints, 0);
    const passed = tasks.filter(t => t.status === 'passed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const percent = Math.round((totalGainedPoints / totalMaxPoints) * 100);

    const payload = {
      lessonId: 'db-lesson-1',
      totalTasks: tasks.length,
      passed,
      failed,
      totalMaxPoints,
      totalGainedPoints,
      percent,
      details: tasks.map(t => ({
        taskId: t.id,
        status: t.status,
        gainedPoints: t.gainedPoints,
        maxPoints: t.maxPoints,
        errorExplanation: t.errorExplanation
      }))
    };

    try {
      // Симуляция API запроса
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              resultId: 'result-' + Date.now(),
              message: 'accepted',
              journalEntryId: 'journal-' + Date.now()
            })
          });
        }, 1000);
      });

      if (response.ok) {
        const data = await response.json();
        
        // Показываем модал результатов
        setShowResults(true);
        
        // Показываем toast
        setToast({
          message: 'Результаты отправлены. Баллы появятся в журнале через несколько минут.',
          type: 'success',
          duration: 5000
        });
        
        // Обновляем уведомления
        addNotification(
          user.id,
          'grade',
          'Новый результат в журнале',
          `Практика по Базам Данных: ${totalGainedPoints}/${totalMaxPoints}. Нажмите, чтобы открыть.`,
          2,
          1
        );
      }
    } catch (error) {
      setToast({
        message: 'Ошибка при отправке результатов. Попробуйте еще раз.',
        type: 'error',
        duration: 4000
      });
    }
  };


  const handlePrevTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
      setCode(tasks[currentTask - 1].userAnswer || tasks[currentTask - 1].initialCode || '');
    }
  };

  const handleBackToLessons = () => {
    if (onPageChange) {
      onPageChange('database-basics');
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
          Основы SQL
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Изучите основы работы с базами данных и SQL запросами
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
              onClick={() => setCurrentSection('video')}
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
              onClick={() => setCurrentSection('theory')}
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
              onClick={() => setCurrentSection('practice')}
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
                <p className="text-lg font-medium">Видео "Основы SQL"</p>
                <p className="text-sm opacity-70 mt-2">Длительность: 15 минут</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Что вы изучите:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Основы работы с базами данных
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Создание таблиц с помощью CREATE TABLE
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Вставка данных с помощью INSERT
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Выборка данных с помощью SELECT
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Что такое SQL?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>SQL (Structured Query Language)</strong> — это язык структурированных запросов, 
                предназначенный для управления реляционными базами данных.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные команды SQL:</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">CREATE TABLE</h4>
                  <p className="text-gray-700 mb-2">Создает новую таблицу в базе данных.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    CREATE TABLE products (id INT, name VARCHAR(100));
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">INSERT INTO</h4>
                  <p className="text-gray-700 mb-2">Добавляет новые записи в таблицу.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    INSERT INTO products VALUES (1, 'Ноутбук');
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">SELECT</h4>
                  <p className="text-gray-700 mb-2">Выбирает данные из таблицы.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    SELECT * FROM products WHERE price &gt; 1000;
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
              language="sql"
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
                  <CheckCircle className="w-4 h-4" />
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
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Результаты практики (Базы данных)</h2>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Summary */}
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

                    {/* Tasks Details */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Детали заданий</h3>
                      <div className="space-y-3">
                        {tasks.map((task, index) => (
                          <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                task.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {task.status === 'passed' ? '✓ Выполнено' : '✗ Ошибка'}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              Баллы: {task.gainedPoints} / {task.maxPoints}
                            </div>
                            {task.status === 'failed' && task.errorExplanation && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                <strong>Где ошибка:</strong> {task.errorExplanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800">
                        Ваши баллы будут добавлены в журнал в течение нескольких минут.
                      </p>
                    </div>

                    {/* Actions */}
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
          </motion.div>
        )}
      </motion.div>
      
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

export default DatabaseLesson1;