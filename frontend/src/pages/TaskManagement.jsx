import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Clock,
  Code,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { fetchLessons } from '../utils/curriculumApi.js';
import {
  fetchTasks,
  createTask,
  deleteTask,
  prepareAISolutions,
  fetchAISolutions,
  gradeTask,
  fetchSubmissionStats
} from '../utils/tasksApi.js';

const PROGRAMMING_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' }
];

const TaskManagement = ({ onPageChange, pageParams }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskStats, setTaskStats] = useState({});
  const [aiGenerationStatus, setAiGenerationStatus] = useState({});

  const [filterLesson, setFilterLesson] = useState(pageParams?.lessonId || '');
  const [filterLanguage, setFilterLanguage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksResponse, lessonsResponse] = await Promise.all([
        fetchTasks({
          size: 100,
          lessonId: filterLesson || undefined,
          language: filterLanguage || undefined,
          activeOnly: true
        }),
        fetchLessons({ size: 100 })
      ]);
      setTasks(tasksResponse.data?.tasks || []);
      setLessons(lessonsResponse.data?.lessons || []);

      // Load stats for each task
      const stats = {};
      for (const task of tasksResponse.data?.tasks || []) {
        try {
          const statsResponse = await fetchSubmissionStats(task.id);
          stats[task.id] = statsResponse.data;
        } catch (err) {
          console.error(`Failed to load stats for task ${task.id}`, err);
        }
      }
      setTaskStats(stats);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить задания');
    } finally {
      setLoading(false);
    }
  }, [filterLesson, filterLanguage]);

  useEffect(() => {
    if (user?.role === 'teacher' || user?.role === 'admin') {
      loadData();
    }
  }, [user, loadData]);

  const handleCreateTask = async (formData) => {
    try {
      await createTask({
        title: formData.title,
        body: formData.body,
        language: formData.language,
        lesson_id: Number(formData.lesson_id),
        deadline_at: new Date(formData.deadline_at).toISOString()
      });
      setSuccess('Задание успешно создано');
      setShowCreateModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Не удалось создать задание');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Удалить задание? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await deleteTask(taskId);
      setSuccess('Задание удалено');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Не удалось удалить задание');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleGenerateAI = async (taskId) => {
    setAiGenerationStatus(prev => ({ ...prev, [taskId]: 'loading' }));
    try {
      await prepareAISolutions(taskId);
      setSuccess('Генерация AI решений запущена. Это займет 1-2 минуты...');
      setTimeout(() => setSuccess(''), 5000);

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetchAISolutions(taskId);
          const solutions = response.data?.ai_solutions || [];
          if (solutions.length >= 4) {
            setAiGenerationStatus(prev => ({ ...prev, [taskId]: 'completed' }));
            clearInterval(pollInterval);
            setSuccess('AI решения успешно сгенерированы!');
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setAiGenerationStatus(prev => ({ ...prev, [taskId]: 'error' }));
        }
      }, 5000);

      setTimeout(() => clearInterval(pollInterval), 120000); // Stop after 2 min
    } catch (err) {
      setAiGenerationStatus(prev => ({ ...prev, [taskId]: 'error' }));
      setError(err.message || 'Не удалось запустить генерацию AI решений');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleGradeAll = async (taskId) => {
    if (!window.confirm('Запустить автоматическое оценивание всех работ? Это займет несколько минут.')) {
      return;
    }
    try {
      await gradeTask(taskId);
      setSuccess('Оценивание запущено. Результаты появятся через несколько минут.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Не удалось запустить оценивание');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewSubmissions = (taskId) => {
    onPageChange?.('task-submissions', { taskId });
  };

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Доступ ограничен</h2>
        <p className="text-gray-600">
          Эта страница доступна только для преподавателей.
        </p>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Управление заданиями
            </h1>
            <p className="text-gray-600">
              Создавайте задания, генерируйте AI решения и оценивайте работы студентов
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать задание
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фильтр по уроку</label>
              <select
                value={filterLesson}
                onChange={(e) => setFilterLesson(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все уроки</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Язык программирования</label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Все языки</option>
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                Всего заданий: {tasks.length}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-24">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Загрузка заданий...
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              У вас пока нет заданий
            </h3>
            <p className="mb-4">Создайте первое задание для студентов</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Создать задание
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                lessons={lessons}
                stats={taskStats[task.id]}
                aiStatus={aiGenerationStatus[task.id]}
                onDelete={handleDeleteTask}
                onGenerateAI={handleGenerateAI}
                onGradeAll={handleGradeAll}
                onViewSubmissions={handleViewSubmissions}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          lessons={lessons}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </section>
  );
};

const TaskCard = ({ task, lessons, stats, aiStatus, onDelete, onGenerateAI, onGradeAll, onViewSubmissions }) => {
  const lesson = lessons.find((l) => l.id === task.lesson_id);
  const isExpired = new Date(task.deadline_at) < new Date();
  const timeRemaining = new Date(task.deadline_at) - new Date();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{task.title}</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
              {PROGRAMMING_LANGUAGES.find((l) => l.value === task.language)?.label || task.language}
            </span>
            {isExpired ? (
              <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                Истек срок
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                Активно
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">{lesson?.title || 'Урок не найден'}</p>
          <p className="text-gray-700 whitespace-pre-wrap">{task.body}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {isExpired ? (
                <span className="text-red-600">Дедлайн истек</span>
              ) : (
                <span>
                  Осталось: {daysRemaining}д {hoursRemaining}ч
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {stats?.total_submissions || 0} работ
            </div>
            {stats?.evaluated_count > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                {stats.evaluated_count} оценено
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {aiStatus === 'loading' && (
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Генерация AI...
            </div>
          )}
          {aiStatus === 'completed' && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              AI готовы
            </div>
          )}

          <button
            onClick={() => onGenerateAI(task.id)}
            disabled={aiStatus === 'loading'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiStatus === 'completed' ? 'Перегенерировать AI' : 'Генерировать AI'}
          </button>

          <button
            onClick={() => onGradeAll(task.id)}
            disabled={!stats?.total_submissions}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            Оценить все
          </button>

          <button
            onClick={() => onViewSubmissions(task.id)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Просмотр работ
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Удалить
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const CreateTaskModal = ({ lessons, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    language: 'python',
    lesson_id: '',
    deadline_at: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim() || !formData.lesson_id || !formData.deadline_at) {
      alert('Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-900">Создать новое задание</h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Урок <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.lesson_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, lesson_id: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Выберите урок</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название задания <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: Сортировка массива"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Язык программирования <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {PROGRAMMING_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание задания <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
              rows={8}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Подробно опишите требования к заданию..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дедлайн <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.deadline_at}
              onChange={(e) => setFormData((prev) => ({ ...prev, deadline_at: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Создание...' : 'Создать задание'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TaskManagement;
