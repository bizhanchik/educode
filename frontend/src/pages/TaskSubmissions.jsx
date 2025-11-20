import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  RefreshCw,
  Code,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  fetchTask,
  fetchSubmissions,
  gradeTask,
  fetchAISolutions
} from '../utils/tasksApi.js';
import { fetchEvaluations, fetchEvaluationSummary } from '../utils/tasksApi.js';

const TaskSubmissions = ({ onPageChange, pageParams }) => {
  const { user } = useAuth();
  const taskId = pageParams?.taskId;

  const [task, setTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [summary, setSummary] = useState(null);
  const [aiSolutions, setAiSolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState(false);

  const loadData = useCallback(async () => {
    if (!taskId) {
      setError('ID задания не указан');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [taskResponse, submissionsResponse, evaluationsResponse, aiResponse] = await Promise.all([
        fetchTask(taskId),
        fetchSubmissions({ taskId, size: 100 }),
        fetchEvaluations({ taskId, size: 100 }),
        fetchAISolutions(taskId).catch(() => ({ data: { ai_solutions: [] } }))
      ]);

      setTask(taskResponse.data);
      setSubmissions(submissionsResponse.data?.submissions || []);
      setAiSolutions(aiResponse.data?.ai_solutions || []);

      const evals = {};
      (evaluationsResponse.data?.evaluations || []).forEach((evaluation) => {
        evals[evaluation.submission_id] = evaluation;
      });
      setEvaluations(evals);

      try {
        const summaryResponse = await fetchEvaluationSummary(taskId);
        setSummary(summaryResponse.data);
      } catch (err) {
        console.error('Failed to load summary:', err);
      }
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'admin') && taskId) {
      loadData();
    }
  }, [user, taskId, loadData]);

  const handleGradeAll = async () => {
    if (!window.confirm('Запустить автоматическое оценивание всех работ? Это займет несколько минут.')) {
      return;
    }
    setGrading(true);
    setError('');
    try {
      await gradeTask(taskId);
      setSuccess('Оценивание запущено. Обновите страницу через 2-3 минуты для просмотра результатов.');
      setTimeout(() => setSuccess(''), 8000);
    } catch (err) {
      setError(err.message || 'Не удалось запустить оценивание');
      setTimeout(() => setError(''), 5000);
    } finally {
      setGrading(false);
    }
  };

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
  };

  const handleCloseModal = () => {
    setSelectedSubmission(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Задание не найдено</h2>
            <p className="text-gray-600 mb-6">{error || 'Проверьте правильность ссылки'}</p>
            <button
              onClick={() => onPageChange?.('task-management')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Вернуться к заданиям
            </button>
          </div>
        </div>
      </div>
    );
  }

  const evaluatedCount = Object.keys(evaluations).length;
  const suspiciousCount = Object.values(evaluations).filter(
    (e) => e.ai_similarity > 0.8 || e.intra_group_similarity > 0.8
  ).length;

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onPageChange?.('task-management')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к заданиям
        </button>

        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {task.title}
            </h1>
            <p className="text-gray-600">
              Просмотр и оценивание работ студентов
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
              onClick={handleGradeAll}
              disabled={grading || submissions.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              {grading ? 'Оценивание...' : 'Оценить все'}
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Всего работ"
            value={submissions.length}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={CheckCircle}
            title="Оценено"
            value={evaluatedCount}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            icon={AlertTriangle}
            title="Подозрительных"
            value={suspiciousCount}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            icon={Award}
            title="Средний балл"
            value={summary?.average_score ? Math.round(summary.average_score) : '—'}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* AI Solutions Info */}
        {aiSolutions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6 mb-8">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI решения сгенерированы
                </h3>
                <p className="text-sm text-gray-700">
                  Для этого задания создано {aiSolutions.length} референсных решений от AI.
                  Используются для расчета AI Similarity студенческих работ.
                </p>
                <div className="flex gap-2 mt-3">
                  {aiSolutions.map((solution, idx) => (
                    <span
                      key={solution.id}
                      className="px-2 py-1 text-xs rounded-full bg-white border border-purple-200 text-purple-700"
                    >
                      {solution.provider === 'openai' ? `GPT #${solution.variant_index}` : 'Claude'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Статистика оценок
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => {
                const count = summary.grade_distribution?.[grade] || 0;
                return (
                  <div key={grade} className="text-center p-3 rounded-xl bg-gray-50">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">Оценка {grade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Студент', 'Дата отправки', 'AI Similarity', 'Group Similarity', 'Итоговая оценка', 'Статус', 'Действия'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Пока нет отправленных работ
                    </td>
                  </tr>
                ) : (
                  submissions.map((submission) => {
                    const evaluation = evaluations[submission.id];
                    return (
                      <SubmissionRow
                        key={submission.id}
                        submission={submission}
                        evaluation={evaluation}
                        onView={handleViewSubmission}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSubmission && (
          <SubmissionModal
            submission={selectedSubmission}
            evaluation={evaluations[selectedSubmission.id]}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

const SubmissionRow = ({ submission, evaluation, onView }) => {
  const isSuspicious = evaluation && (evaluation.ai_similarity > 0.8 || evaluation.intra_group_similarity > 0.8);

  return (
    <tr className={`hover:bg-gray-50 ${isSuspicious ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{submission.student?.name || 'Unknown'}</div>
        <div className="text-sm text-gray-500">{submission.student?.email || ''}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {new Date(submission.created_at).toLocaleString('ru-RU')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {evaluation ? (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              evaluation.ai_similarity > 0.8
                ? 'bg-red-100 text-red-700'
                : evaluation.ai_similarity > 0.5
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {(evaluation.ai_similarity * 100).toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {evaluation && evaluation.intra_group_similarity !== null ? (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              evaluation.intra_group_similarity > 0.8
                ? 'bg-red-100 text-red-700'
                : evaluation.intra_group_similarity > 0.5
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {(evaluation.intra_group_similarity * 100).toFixed(1)}%
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {evaluation && evaluation.final_score ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{evaluation.final_score}</span>
            <span className="text-sm text-gray-500">/ 100</span>
            <span
              className={`px-2 py-1 text-xs rounded-full font-medium ${
                evaluation.final_score >= 90
                  ? 'bg-green-100 text-green-700'
                  : evaluation.final_score >= 70
                  ? 'bg-blue-100 text-blue-700'
                  : evaluation.final_score >= 50
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {evaluation.final_score >= 90
                ? 'A'
                : evaluation.final_score >= 70
                ? 'B'
                : evaluation.final_score >= 50
                ? 'C'
                : evaluation.final_score >= 30
                ? 'D'
                : 'F'}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Не оценено</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isSuspicious && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3" />
            Подозрительно
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onView(submission)}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <Eye className="w-4 h-4" />
          Просмотр
        </button>
      </td>
    </tr>
  );
};

const SubmissionModal = ({ submission, evaluation, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto py-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 my-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              Работа: {submission.student?.name || 'Unknown'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Отправлено: {new Date(submission.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Evaluation Info */}
        {evaluation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">AI Similarity</div>
              <div className="text-2xl font-bold text-blue-900">
                {(evaluation.ai_similarity * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="text-sm text-purple-600 mb-1">Group Similarity</div>
              <div className="text-2xl font-bold text-purple-900">
                {evaluation.intra_group_similarity !== null
                  ? `${(evaluation.intra_group_similarity * 100).toFixed(1)}%`
                  : '—'}
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="text-sm text-green-600 mb-1">Итоговая оценка</div>
              <div className="text-2xl font-bold text-green-900">
                {evaluation.final_score ? `${evaluation.final_score} / 100` : 'Не оценено'}
              </div>
            </div>
          </div>
        )}

        {/* Rationale */}
        {evaluation?.rationale && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">Обоснование оценки от AI:</h4>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{evaluation.rationale}</p>
          </div>
        )}

        {/* Code */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Код студента
          </h4>
          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
              {submission.code}
            </pre>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Строк: {submission.code?.split('\n').length || 0} | Символов: {submission.code?.length || 0}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TaskSubmissions;
