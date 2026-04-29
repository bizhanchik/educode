import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Send,
  Clock,
  AlertCircle,
  CheckCircle,
  BookOpen,
  FileText,
  Youtube,
  Download,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { fetchTask } from '../utils/tasksApi.js';
import { createSubmission, updateSubmission, fetchSubmissions } from '../utils/tasksApi.js';

const SubmitTask = ({ onPageChange, pageParams }) => {
  const { user } = useAuth();
  const taskId = pageParams?.taskId;

  const [task, setTask] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);

  const loadTaskData = useCallback(async () => {
    if (!taskId) {
      setError('ID задания не указан');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const taskResponse = await fetchTask(taskId, { includeSubmissions: true });
      const taskData = taskResponse.data;
      setTask(taskData);
      setMaterials(taskData.lesson?.materials || []);

      // Load existing submission
      const submissionsResponse = await fetchSubmissions({
        taskId,
        studentId: user.id
      });
      const submissions = submissionsResponse.data?.submissions || [];
      if (submissions.length > 0) {
        setExistingSubmission(submissions[0]);
        setCode(submissions[0].code || '');
      }
    } catch (err) {
      setError(err.message || 'Не удалось загрузить задание');
    } finally {
      setLoading(false);
    }
  }, [taskId, user?.id]);

  useEffect(() => {
    if (user?.role === 'student' && taskId) {
      loadTaskData();
    }
  }, [user, taskId, loadTaskData]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Код не может быть пустым');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (task && new Date(task.deadline_at) < new Date()) {
      setError('Дедлайн истек. Отправка решения невозможна.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (existingSubmission) {
        await updateSubmission(existingSubmission.id, { code });
        setSuccess('Решение успешно обновлено! AI similarity будет пересчитан.');
      } else {
        const response = await createSubmission({
          task_id: taskId,
          code
        });
        setExistingSubmission(response.data);
        setSuccess('Решение успешно отправлено! AI similarity рассчитывается...');
      }
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Не удалось отправить решение');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Доступ ограничен</h2>
        <p className="text-gray-600">
          Эта страница доступна только для студентов.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка задания...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Задание не найдено</h2>
            <p className="text-gray-600 mb-6">{error || 'Проверьте правильность ссылки'}</p>
            <button
              onClick={() => onPageChange?.('courses')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Вернуться к курсам
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(task.deadline_at) < new Date();
  const timeRemaining = new Date(task.deadline_at) - new Date();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onPageChange?.('courses')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к курсам
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {task.language.toUpperCase()}
                    </span>
                    {isExpired ? (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Дедлайн истек
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {daysRemaining}д {hoursRemaining}ч {minutesRemaining}м
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Описание задания:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{task.body}</p>
              </div>

              {existingSubmission && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Вы уже отправили решение. Вы можете обновить его до истечения дедлайна.
                    </span>
                  </div>
                  {existingSubmission.evaluation && (
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        AI Similarity: <strong>{(existingSubmission.evaluation.ai_similarity * 100).toFixed(1)}%</strong>
                      </p>
                      {existingSubmission.evaluation.final_score && (
                        <p>
                          Итоговая оценка: <strong>{existingSubmission.evaluation.final_score}/100</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Code Editor */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Ваше решение
              </h2>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={`// Напишите ваш код на ${task.language} здесь...\n\n`}
                disabled={isExpired}
              />

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Символов: {code.length} | Строк: {code.split('\n').length}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isExpired || !code.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Отправка...' : existingSubmission ? 'Обновить решение' : 'Отправить решение'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">
                  {success}
                </div>
              )}
            </div>
          </div>

          {/* Materials Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Материалы урока
              </h2>

              {materials.length === 0 ? (
                <p className="text-gray-500 text-sm">Материалов пока нет</p>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Подсказки</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Внимательно прочитайте требования</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Используйте материалы урока для помощи</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Проверьте код на ошибки перед отправкой</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Можете обновить решение до дедлайна</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MaterialCard = ({ material }) => {
  const getIcon = () => {
    switch (material.type) {
      case 'text':
        return <FileText className="w-4 h-4 text-gray-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'file':
        return <Download className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleClick = () => {
    if (material.type === 'youtube' && material.youtube_url) {
      window.open(material.youtube_url, '_blank');
    } else if (material.type === 'file' && material.file_url) {
      window.open(material.file_url, '_blank');
    }
  };

  return (
    <div
      onClick={material.type !== 'text' ? handleClick : undefined}
      className={`p-3 rounded-xl border border-gray-200 ${
        material.type !== 'text' ? 'cursor-pointer hover:bg-gray-50' : ''
      } transition-colors`}
    >
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{material.title}</h4>
          {material.type === 'text' && material.content && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-3">{material.content}</p>
          )}
          {material.type === 'youtube' && (
            <span className="text-xs text-gray-500 mt-1 block">Видеоурок</span>
          )}
          {material.type === 'file' && (
            <span className="text-xs text-gray-500 mt-1 block">Скачать файл</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitTask;
