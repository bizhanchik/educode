import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, PlayCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import BackButton from '../components/BackButton.jsx';
import { fetchSubjects, fetchSubjectWithLessons } from '../utils/curriculumApi.js';


const buildVideoEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const ProgrammingBasics = ({ onPageChange, pageParams }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);
  const videoEmbedUrl = useMemo(
    () => buildVideoEmbedUrl(selectedLesson?.video_url),
    [selectedLesson?.video_url]
  );

  const loadFallbackSubject = useCallback(async () => {
    const response = await fetchSubjects({ size: 1 });
    const firstSubject = response.data?.subjects?.[0];
    if (firstSubject) {
      return firstSubject.id;
    }
    return null;
  }, []);

  const loadSubjectData = useCallback(
    async (subjectId) => {
      setLoading(true);
      setError('');
      try {
        let targetId = subjectId;
        if (!targetId) {
          targetId = await loadFallbackSubject();
        }

        if (!targetId) {
          throw new Error('В системе пока нет предметов. Обратитесь к администратору.');
        }

        const response = await fetchSubjectWithLessons(targetId);
        setSubject(response.data);
        setLessons(response.data?.lessons || []);
        if (response.data?.lessons?.length) {
          setSelectedLessonId(pageParams?.lessonId || response.data.lessons[0].id);
        } else {
          setSelectedLessonId(null);
        }
      } catch (err) {
        setError(err.message || 'Не удалось загрузить данные предмета');
        setSubject(null);
        setLessons([]);
        setSelectedLessonId(null);
      } finally {
        setLoading(false);
      }
    },
    [loadFallbackSubject, pageParams?.lessonId]
  );

  useEffect(() => {
    loadSubjectData(pageParams?.subjectId);
  }, [loadSubjectData, pageParams?.subjectId]);

<<<<<<< HEAD
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
=======
  const handleLessonSelect = (lessonId) => {
    setSelectedLessonId(lessonId);
>>>>>>> 7cbcffa (frontend updates)
  };

  const handleOpenLesson = () => {
    if (!subject || !selectedLessonId) return;
    onPageChange?.('lesson-1', { lessonId: selectedLessonId, subjectId: subject.id });
  };

  return (
<<<<<<< HEAD
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
=======
    <section className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <BackButton onClick={() => onPageChange('courses')} label="Вернуться к курсам" />
          <button
            onClick={() => loadSubjectData(pageParams?.subjectId)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить данные
          </button>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-6 rounded-2xl border border-red-200 bg-red-100/90 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
>>>>>>> 7cbcffa (frontend updates)
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400 py-24">
            Загрузка материалов...
          </div>
        ) : !subject ? (
          <div className="text-center text-gray-400 py-24">
            Данные по предмету недоступны.
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 p-8 mb-10"
            >
<<<<<<< HEAD
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
=======
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
                📘 {subject.name}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Материалы предмета
              </h1>
              <p className="text-lg text-gray-300 max-w-3xl">
                {lessons.length > 0
                  ? 'Выберите урок слева, чтобы увидеть подробное описание и перейти к материалам.'
                  : 'Для этого предмета пока не создано ни одного урока.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 p-6 h-full">
                  <h2 className="text-2xl font-bold text-white mb-6">Уроки</h2>
                  <div className="space-y-4">
                    {lessons.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        Нет доступных уроков.
                      </p>
                    ) : (
                      lessons.map((lesson, index) => (
                        <motion.button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson.id)}
                          className={`w-full text-left rounded-2xl p-4 border border-white/10 transition-all duration-300 ${
                            selectedLessonId === lesson.id
                              ? 'bg-white/15 shadow-lg shadow-blue-500/10 scale-[1.01]'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                          whileHover={{ x: 5 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <p className="text-sm text-gray-400 mb-1">Урок {index + 1}</p>
                          <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                          <p className="text-sm text-gray-500 mt-2 truncate">
                            {lesson.description || 'Описание появится позже'}
                          </p>
                        </motion.button>
                      ))
                    )}
>>>>>>> 7cbcffa (frontend updates)
                  </div>
                </div>
              </motion.div>

<<<<<<< HEAD
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
=======
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                {selectedLesson ? (
                  <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
                    <div className="flex flex-col gap-4 mb-6">
                      <button
                        onClick={() => setSelectedLessonId(null)}
                        className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Вернуться к списку уроков
                      </button>
                      <div>
                        <p className="text-blue-400 uppercase text-sm font-semibold tracking-wider mb-2">
                          Лекция
                        </p>
                        <h2 className="text-3xl font-bold text-white">{selectedLesson.title}</h2>
                      </div>
                    </div>

                    {selectedLesson.video_url && (
                      <div className="mb-8">
                        <p className="text-gray-300 mb-3">
                          {selectedLesson.video_description || 'Видео-материал к уроку'}
                        </p>
                        <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                          {videoEmbedUrl ? (
                            <iframe
                              src={videoEmbedUrl}
                              title={selectedLesson.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          ) : (
                            <video
                              src={selectedLesson.video_url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-black/30 rounded-2xl border border-white/5 p-6 mb-8">
                      <p className="text-gray-300 whitespace-pre-line">
                        {selectedLesson.description ||
                          'Подробное описание урока будет добавлено преподавателем.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={handleOpenLesson}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all"
                      >
                        <PlayCircle className="w-5 h-5" />
                        Изучить материалы
                      </button>
                      <button
                        onClick={() => onPageChange('courses')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition-all"
                      >
                        <BookOpen className="w-5 h-5" />
                        Вернуться к курсам
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
                    <div className="flex flex-col gap-4 mb-6">
                      <button
                        onClick={() => setSelectedLessonId(null)}
                        className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Вернуться к списку уроков
                      </button>
                      <div>
                        <p className="text-blue-400 uppercase text-sm font-semibold tracking-wider mb-2">
                          Лекция
                        </p>
                        <h2 className="text-3xl font-bold text-white">{selectedLesson.title}</h2>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl border border-white/5 p-6 mb-8">
                      <p className="text-gray-300 whitespace-pre-line">
                        {selectedLesson.description ||
                          'Подробное описание урока будет добавлено преподавателем.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={handleOpenLesson}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all"
                      >
                        <PlayCircle className="w-5 h-5" />
                        Изучить материалы
                      </button>
                      <button
                        onClick={() => onPageChange('courses')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/20 text-white hover:bg-white/10 transition-all"
                      >
                        <BookOpen className="w-5 h-5" />
                        Вернуться к курсам
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center">
                    <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Выберите урок для просмотра деталей
                    </h3>
                    <p className="text-gray-400 max-w-2xl mx-auto mb-6">
                      Нажмите на урок слева, чтобы увидеть подробное описание и перейти к материалам.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
>>>>>>> 7cbcffa (frontend updates)
      </div>
    </section>
  );
};

export default ProgrammingBasics;
