import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Code,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { fetchSubmissions } from '../utils/tasksApi.js';

const MyGrades = ({ onPageChange }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchSubmissions({
        studentId: user.id,
        size: 100
      });
      setSubmissions(response.data?.submissions || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить оценки');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === 'student') {
      loadSubmissions();
    }
  }, [user, loadSubmissions]);

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


  return (
    <div className="bg-white min-h-screen">
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 mt-12">
            <h1 className="text-4xl font-bold text-gray-900 ml-8">ЖУРНАЛ</h1>
            <button
              onClick={loadSubmissions}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-24">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Загрузка оценок...
            </div>
          ) : submissions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                У вас пока нет отправленных работ
              </h3>
              <p className="text-gray-600 mb-4">Начните выполнять задания из ваших курсов</p>
              <button
                onClick={() => onPageChange?.('courses')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Перейти к курсам
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">№</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border border-gray-200">Название задания</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">Дата отправки</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">Оценка</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">Статус</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">Операции</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission, index) => {
                    const evaluation = submission.evaluation;
                    const hasEvaluation = evaluation && evaluation.final_score !== null;
                    const date = new Date(submission.created_at).toLocaleDateString('ru-RU');
                    
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-center text-sm text-gray-900 border border-gray-200">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200 break-words">
                          {submission.task?.title || 'Задание'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900 border border-gray-200">
                          {date}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-900 border border-gray-200">
                          {hasEvaluation ? (
                            <span className="font-medium">
                              {evaluation.final_score} / 100
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm border border-gray-200">
                          {hasEvaluation ? (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                evaluation.final_score >= 90
                                  ? 'bg-green-100 text-green-700'
                                  : evaluation.final_score >= 70
                                  ? 'bg-blue-100 text-blue-700'
                                  : evaluation.final_score >= 50
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {getLetterGrade(evaluation.final_score)}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                              Ожидает оценки
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center border border-gray-200">
                          <button
                            onClick={() => setSelectedSubmission(submission)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {selectedSubmission && (
          <GradeModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const getLetterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
};

const GradeModal = ({ submission, onClose }) => {
  const evaluation = submission.evaluation;

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
              {submission.task?.title || 'Задание'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Отправлено: {new Date(submission.created_at).toLocaleString('ru-RU')}
            </p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>
            ✕
          </button>
        </div>

        {evaluation ? (
          <>
            {/* Scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">AI Similarity</div>
                <div className="text-2xl font-bold text-blue-900">
                  {(evaluation.ai_similarity * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Схожесть с AI-решениями. Чем выше, тем больше вероятность использования AI.
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Group Similarity</div>
                <div className="text-2xl font-bold text-purple-900">
                  {evaluation.intra_group_similarity !== null
                    ? `${(evaluation.intra_group_similarity * 100).toFixed(1)}%`
                    : '—'}
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  Схожесть с работами других студентов в группе.
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Итоговая оценка</div>
                <div className="text-2xl font-bold text-green-900">
                  {evaluation.final_score} / 100
                </div>
                <div className="mt-2">
                  <span
                    className={`px-3 py-1 text-sm rounded-full font-medium ${
                      evaluation.final_score >= 90
                        ? 'bg-green-100 text-green-700'
                        : evaluation.final_score >= 70
                        ? 'bg-blue-100 text-blue-700'
                        : evaluation.final_score >= 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    Оценка: {getLetterGrade(evaluation.final_score)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {(evaluation.ai_similarity > 0.8 || evaluation.intra_group_similarity > 0.8) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      Обнаружена высокая схожесть
                    </h4>
                    <p className="text-sm text-red-800">
                      Ваша работа имеет высокую схожесть с{' '}
                      {evaluation.ai_similarity > 0.8 && evaluation.intra_group_similarity > 0.8
                        ? 'AI-решениями и работами других студентов'
                        : evaluation.ai_similarity > 0.8
                        ? 'AI-решениями'
                        : 'работами других студентов'}
                      . Это может повлиять на вашу оценку.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rationale */}
            {evaluation.rationale && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Обоснование оценки от AI:
                </h4>
                <p className="text-sm text-amber-800 whitespace-pre-wrap">{evaluation.rationale}</p>
              </div>
            )}
          </>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-blue-900 mb-2">Работа ожидает оценивания</h4>
            <p className="text-sm text-blue-800">
              Преподаватель еще не запустил автоматическое оценивание. Результаты появятся после проверки.
            </p>
          </div>
        )}

        {/* Code */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Ваш код
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

export default MyGrades;
