import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, ArrowRight } from 'lucide-react';

const ResultsBlock = ({ tasks, onBackToLessons }) => {
  // Подсчет результатов
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const score = Math.round((completedTasks / totalTasks) * 100);
  
  // Определение цвета результата
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Определение сообщения о результате
  const getScoreMessage = (score) => {
    if (score >= 80) return 'Отличная работа!';
    if (score >= 60) return 'Хорошая работа!';
    return 'Попробуйте еще раз!';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6"
    >
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-yellow-600" />
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Результаты</h2>
      </div>

      {/* Список заданий */}
      <div className="space-y-4 mb-6">
        {tasks.map((task, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mt-1">
              {task.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800">
                  Задание {index + 1}
                </span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  task.completed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {task.completed ? 'Выполнено' : 'Ошибка'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              {!task.completed && task.error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  <strong>Ошибка:</strong> {task.error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Общий балл */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-800">Общий балл:</span>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{getScoreMessage(score)}</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              score >= 80 ? 'bg-green-500' : 
              score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>

      {/* Сообщение о сохранении */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-800">
            Ваш результат добавлен в журнал и прогресс курса обновлён
          </p>
        </div>
      </div>

      {/* Кнопка перехода к урокам */}
      <motion.button
        onClick={onBackToLessons}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ArrowRight className="w-5 h-5" />
        Перейти к урокам
      </motion.button>
    </motion.div>
  );
};

export default ResultsBlock;
