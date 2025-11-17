import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, Calendar, RefreshCw, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import BackButton from '../components/BackButton.jsx';
import { fetchSubjects, fetchSubjectWithLessons } from '../utils/curriculumApi.js';

const MyCourses = ({ onPageChange }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState('');

  const [lessonProgress, setLessonProgress] = useState({});

  const storageKey = useMemo(
    () => (user ? `lessonProgress:${user.id}` : 'lessonProgress:guest'),
    [user]
  );

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setLessonProgress(JSON.parse(saved));
      } catch {
        setLessonProgress({});
      }
    } else {
      setLessonProgress({});
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(lessonProgress));
  }, [lessonProgress, storageKey]);

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    setSubjectsError('');
    try {
      const response = await fetchSubjects({ size: 50 });
      setSubjects(response.data?.subjects || []);
    } catch (error) {
      setSubjectsError(error.message || 'Не удалось загрузить список курсов');
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadSubjectLessons = useCallback(async (subjectId) => {
    if (!subjectId) return;
    setLessonsLoading(true);
    setLessonsError('');
    try {
      const response = await fetchSubjectWithLessons(subjectId);
      setSelectedSubject(response.data);
      setLessons(response.data?.lessons || []);
    } catch (error) {
      setLessonsError(error.message || 'Не удалось загрузить уроки предмета');
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  const handleSubjectClick = (subject) => {
    loadSubjectLessons(subject.id);
  };

  const handleMarkLessonComplete = (lessonId) => {
    setLessonProgress((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const completedLessons = useMemo(
    () => lessons.filter((lesson) => lessonProgress[lesson.id]),
    [lessons, lessonProgress]
  );

  const progressPercent = lessons.length
    ? Math.round((completedLessons.length / lessons.length) * 100)
    : 0;

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <BackButton onClick={() => onPageChange('home')} label="Вернуться на главную" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
            📚 {t('courses.myCourses')}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Ваши образовательные программы
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Продолжайте обучение по актуальным предметам. Курсы подгружаются из бэкенда и
            синхронизируются с вашим прогрессом.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Доступные курсы</h2>
                <button
                  onClick={loadSubjects}
                  className="p-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {subjectsError && (
                <div className="rounded-xl border border-red-200 bg-red-50/90 text-red-800 px-3 py-2 text-sm mb-4">
                  {subjectsError}
                </div>
              )}

              <div className="space-y-4">
                {subjectsLoading ? (
                  <div className="text-center text-gray-400 py-10">Загрузка предметов...</div>
                ) : subjects.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    Курсы пока не созданы. Обратитесь к администратору.
                  </div>
                ) : (
                  subjects.map((subject) => (
                    <motion.button
                      key={subject.id}
                      onClick={() => handleSubjectClick(subject)}
                      className={`w-full text-left rounded-2xl p-4 border border-white/10 transition-all duration-300 ${
                        selectedSubject?.id === subject.id
                          ? 'bg-white/15 shadow-lg shadow-blue-500/10 scale-[1.01]'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-1">{subject.name}</h3>
                      <p className="text-sm text-gray-400">ID предмета: {subject.id}</p>
                      <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Обновлено {new Date(subject.updated_at).toLocaleDateString()}
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            {selectedSubject ? (
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-blue-400 uppercase text-sm font-semibold tracking-wider mb-2">
                      Текущий курс
                    </p>
                    <h2 className="text-3xl font-bold text-white">{selectedSubject.name}</h2>
                    <p className="text-gray-300 mt-2">
                      {lessons.length > 0
                        ? `Всего уроков: ${lessons.length}`
                        : 'Для этого предмета пока нет уроков'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
                      onClick={() =>
                        onPageChange &&
                        onPageChange('programming-basics', {
                          subjectId: selectedSubject.id,
                        })
                      }
                    >
                      Перейти к материалам
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
                      onClick={() => setSelectedSubject(null)}
                    >
                      Вернуться к списку
                    </button>
                  </div>
                </div>

                {lessonsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50/90 text-red-800 px-3 py-2 text-sm mb-6">
                    {lessonsError}
                  </div>
                )}

                <div className="bg-white/5 rounded-2xl border border-white/5 p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Прогресс курса</p>
                      <p className="text-xl font-semibold text-white">
                        {completedLessons.length}/{lessons.length || 1} уроков завершено
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-400">{progressPercent}%</p>
                      <p className="text-sm text-gray-400">готовность</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <motion.div
                      className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Уроки предмета</h3>

                  {lessonsLoading ? (
                    <div className="text-center text-gray-400 py-10">Загрузка уроков...</div>
                  ) : lessons.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                      Для этого предмета пока нет уроков.
                    </div>
                  ) : (
                    lessons.map((lesson, index) => {
                      const completed = !!lessonProgress[lesson.id];
                      return (
                        <motion.div
                          key={lesson.id}
                          className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
                          whileHover={{ x: 5 }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                completed ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {completed ? <CheckCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                <span>Урок {index + 1}</span>
                              </div>
                              <h4 className="text-lg font-semibold text-white">{lesson.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">
                                {lesson.description ||
                                  'Описание урока будет доступно после обновления материалов.'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleMarkLessonComplete(lesson.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                                  completed
                                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                    : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                }`}
                              >
                                {completed ? 'Завершено' : 'Отметить выполненным'}
                              </button>
                              <button
                                onClick={() =>
                                  onPageChange &&
                                  onPageChange('programming-basics', {
                                    subjectId: selectedSubject.id,
                                    lessonId: lesson.id,
                                  })
                                }
                                className="px-4 py-2 rounded-xl border border-white/20 text-white text-sm hover:bg-white/10 transition-colors"
                              >
                                Открыть урок
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center">
                <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Выберите курс для просмотра деталей
                </h3>
                <p className="text-gray-400 max-w-2xl mx-auto mb-6">
                  Нажмите на один из курсов слева, чтобы увидеть материалы, прогресс и рекомендованные действия.
                </p>
                <button
                  onClick={() => subjects[0] && handleSubjectClick(subjects[0])}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
                  disabled={subjects.length === 0}
                >
                  <PlayCircle className="w-5 h-5" />
                  Начать обучение
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MyCourses;
