import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  FolderTree,
  FileText,
  PlayCircle,
  Upload,
  Type
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  fetchLessons,
  fetchSubjects,
  createLesson,
  createLessonMaterial
} from '../utils/curriculumApi.js';

const initialLessonForm = {
  title: '',
  description: '',
  subjectId: '',
  videoUrl: '',
  videoDescription: '',
  textMaterialTitle: 'Текстовый материал',
  textMaterialContent: '',
  fileMaterialTitle: 'Файл с материалами',
  fileMaterialFile: null
};

const TeacherDashboard = ({ onPageChange }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectsResponse, lessonsResponse] = await Promise.all([
        fetchSubjects({ size: 100 }),
        fetchLessons({ size: 100 })
      ]);
      setSubjects(subjectsResponse.data?.subjects || []);
      setLessons(lessonsResponse.data?.lessons || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить данные преподавателя');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadData();
    }
  }, [user, loadData]);

  const lessonsBySubject = useMemo(
    () =>
      lessons.reduce((acc, lesson) => {
        if (!acc[lesson.subject_id]) acc[lesson.subject_id] = [];
        acc[lesson.subject_id].push(lesson);
        return acc;
      }, {}),
    [lessons]
  );

  const subjectsWithLessons = useMemo(
    () =>
      subjects
        .filter((subject) => lessonsBySubject[subject.id])
        .map((subject) => ({
          ...subject,
          lessons: lessonsBySubject[subject.id]
        })),
    [subjects, lessonsBySubject]
  );

  const handleLessonInputChange = (field, value) => {
    setLessonForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLessonFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setLessonForm((prev) => ({
      ...prev,
      fileMaterialFile: file
    }));
  };

  const handleCreateLesson = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!lessonForm.title.trim()) {
      setFormError('Введите название урока');
      return;
    }
    if (!lessonForm.subjectId) {
      setFormError('Выберите предмет');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || null,
        subject_id: Number(lessonForm.subjectId),
        teacher_id: user.id,
        video_url: lessonForm.videoUrl.trim() || null,
        video_description: lessonForm.videoDescription.trim() || null
      };

      const response = await createLesson(payload);
      const newLesson = response.data;

      const materialPromises = [];

      if (lessonForm.textMaterialContent.trim()) {
        const textForm = new FormData();
        textForm.append('title', lessonForm.textMaterialTitle.trim() || 'Текстовый материал');
        textForm.append('type', 'text');
        textForm.append('content', lessonForm.textMaterialContent.trim());
        materialPromises.push(createLessonMaterial(newLesson.id, textForm));
      }

      if (lessonForm.fileMaterialFile) {
        const fileForm = new FormData();
        fileForm.append(
          'title',
          lessonForm.fileMaterialTitle.trim() || lessonForm.fileMaterialFile.name
        );
        fileForm.append('type', 'file');
        fileForm.append('file', lessonForm.fileMaterialFile);
        materialPromises.push(createLessonMaterial(newLesson.id, fileForm));
      }

      if (materialPromises.length) {
        await Promise.all(materialPromises);
      }

      setFormSuccess('Урок успешно создан и материалы прикреплены.');
      setLessonForm(initialLessonForm);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Не удалось создать урок');
    } finally {
      setFormLoading(false);
    }
  };

  if (!user || user.role !== 'teacher') {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Доступ ограничен</h2>
        <p className="text-gray-600">
          Страница доступна только для преподавателей. Пожалуйста, войдите под учетной записью
          преподавателя.
        </p>
      </div>
    );
  }

  // Функции для редактирования курсов
  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCurrentView('edit-course');
  };

  const handleEditLesson = (course, lesson) => {
    setEditingCourse(course);
    setEditingLesson(lesson);
    setCurrentView('edit-lesson');
  };

  const handleAddLesson = (course) => {
    setEditingCourse(course);
    setNewLessonTitle('');
    setNewLessonDescription('');
    setCurrentView('add-lesson');
  };

  const handleSaveLesson = () => {
    if (!newLessonTitle.trim()) return;

    const newLesson = {
      id: Date.now(),
      title: newLessonTitle,
      description: newLessonDescription,
      isCompleted: false,
      tasks: []
    };

    const updatedCourse = {
      ...editingCourse,
      lessons: [...editingCourse.lessons, newLesson]
    };

    updateCourse(updatedCourse.id, updatedCourse);
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    setCurrentView('courses');
    setEditingCourse(null);
    setNewLessonTitle('');
    setNewLessonDescription('');
  };

  const handleDeleteLesson = (course, lessonId) => {
    const updatedCourse = {
      ...course,
      lessons: course.lessons.filter(lesson => lesson.id !== lessonId)
    };

    updateCourse(updatedCourse.id, updatedCourse);
    setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const teacherNavItems = [
    { id: 'groups', label: 'Группы', icon: Users },
    { id: 'courses', label: 'Данные курса', icon: BookOpen },
    { id: 'logout', label: 'Выйти', icon: LogOut },
  ];

  const renderGroups = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Группы</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Список групп будет здесь</p>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Данные курса</h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курсов...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">У вас пока нет курсов</h3>
          <p className="text-gray-600 mb-4">Создайте свой первый курс для студентов</p>
          <motion.button
            onClick={() => setCurrentView('create-course')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Создать курс
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-gray-600 mt-1">{course.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Категория: {course.category}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Активен
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {course.lessons.length} уроков
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.studentsCount || 0} студентов
                </div>
              </div>

              {/* Список уроков */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Уроки:</h4>
                <div className="space-y-2">
                  {course.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${lesson.isCompleted ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm text-gray-700">{lesson.title}</span>
                      </div>
                      <div className="flex gap-1">
                        <motion.button
                          onClick={() => handleEditLesson(course, lesson)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit className="w-3 h-3" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteLesson(course, lesson.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
                <motion.button
                  onClick={() => handleAddLesson(course)}
                  className="mt-2 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center gap-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-3 h-3" />
                  Добавить урок
                </motion.button>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleEditCourse(course)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </motion.button>
                <motion.button
                  onClick={() => {/* Просмотр курса */}}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Уведомления</h2>
      
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Новое задание от студента
              </h3>
              <p className="text-gray-600 mt-1">Алина отправила решение задачи "Сортировка массива"</p>
              <p className="text-sm text-gray-500 mt-2">
                Алгоритмизация • Сортировка массива
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Отметить как прочитанное
            </motion.button>
            <motion.button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Просмотр задания
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Форма добавления урока
  const renderAddLesson = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <motion.button
          onClick={() => setCurrentView('courses')}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← {t('courses.backToCourses')}
        </motion.button>
        <h2 className="text-2xl font-bold text-gray-900">Добавить урок</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Курс: {editingCourse?.title}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название урока
            </label>
            <input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите название урока"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание урока
            </label>
            <textarea
              value={newLessonDescription}
              onChange={(e) => setNewLessonDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
              placeholder="Введите описание урока"
            />
          </div>
          
          <div className="flex gap-3">
            <motion.button
              onClick={handleSaveLesson}
              disabled={!newLessonTitle.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save className="w-4 h-4" />
              Сохранить урок
            </motion.button>
            
            <motion.button
              onClick={() => setCurrentView('courses')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Отмена
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'groups':
        return renderGroups();
      case 'courses':
        return renderCourses();
      case 'add-lesson':
        return renderAddLesson();
      default:
        return renderGroups();
    }
  };


  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              Кабинет преподавателя
            </h1>
            <p className="text-gray-600">
              Добро пожаловать, {user?.fullName || user?.name || 'Преподаватель'}
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить данные
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <CreateLessonCard
          subjects={subjects}
          formState={lessonForm}
          onChange={handleLessonInputChange}
          onFileChange={handleLessonFileChange}
          onSubmit={handleCreateLesson}
          loading={formLoading}
          error={formError}
          success={formSuccess}
        />

        {loading ? (
          <div className="text-center text-gray-500 py-24">Загрузка материалов...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatsCard
                icon={GraduationCap}
                title="Всего уроков"
                value={lessons.length}
                accent="bg-indigo-100 text-indigo-600"
              />
              <StatsCard
                icon={FolderTree}
                title="Предметов"
                value={subjectsWithLessons.length}
                accent="bg-blue-100 text-blue-600"
              />
              <StatsCard
                icon={BookOpen}
                title="Уроков без описания"
                value={lessons.filter((lesson) => !lesson.description).length}
                accent="bg-amber-100 text-amber-600"
              />
            </div>

            {subjectsWithLessons.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
                Для вас пока не создано уроков. Создайте новый урок через форму выше.
              </div>
            ) : (
              <div className="space-y-8">
                {subjectsWithLessons.map((subject) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">Предмет</p>
                        <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                        <p className="text-gray-500 mt-1">
                          {subject.lessons.length} урок(а/ов) в этом предмете
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          onPageChange?.('programming-basics', { subjectId: subject.id })
                        }
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Открыть курс
                      </button>
                    </div>

                    <div className="space-y-4">
                      {subject.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="rounded-2xl border border-gray-100 p-4 bg-gray-50 hover:bg-white transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Урок #{lesson.id}</p>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {lesson.title}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {lesson.description || 'Описание урока ещё не добавлено.'}
                              </p>
                              {lesson.video_url && (
                                <p className="text-sm text-blue-600 mt-2">
                                  Видео: {lesson.video_url}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  onPageChange?.('lesson-1', {
                                    subjectId: subject.id,
                                    lessonId: lesson.id
                                  })
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                Открыть
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const CreateLessonCard = ({
  subjects,
  formState,
  onChange,
  onFileChange,
  onSubmit,
  loading,
  error,
  success
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-10"
  >
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Создать новый урок</h2>
    <p className="text-gray-600 mb-6">
      Добавьте видеоурок и материалы, чтобы они стали доступны студентам на соответствующих
      страницах.
    </p>

    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Предмет</label>
          <select
            value={formState.subjectId}
            onChange={(e) => onChange('subjectId', e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Выберите предмет</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название урока</label>
          <input
            value={formState.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Например, Введение в Python"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Описание урока</label>
        <textarea
          value={formState.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Кратко опишите, чему научатся студенты."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на видеоурок</label>
          <input
            value={formState.videoUrl}
            onChange={(e) => onChange('videoUrl', e.target.value)}
            placeholder="https://youtu.be/..."
            className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание видео</label>
          <input
            value={formState.videoDescription}
            onChange={(e) => onChange('videoDescription', e.target.value)}
            placeholder="Например, длительность и основные темы"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Type className="w-4 h-4 text-gray-400" />
            Текстовый материал
          </label>
          <input
            value={formState.textMaterialTitle}
            onChange={(e) => onChange('textMaterialTitle', e.target.value)}
            placeholder="Заголовок материала"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <textarea
            value={formState.textMaterialContent}
            onChange={(e) => onChange('textMaterialContent', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Добавьте текстовый конспект или инструкции"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Upload className="w-4 h-4 text-gray-400" />
            Файл с материалами
          </label>
          <input
            value={formState.fileMaterialTitle}
            onChange={(e) => onChange('fileMaterialTitle', e.target.value)}
            placeholder="Название файла"
            className="w-full rounded-xl border border-gray-200 px-4 py-2 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="file"
            onChange={handleLessonFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all disabled:opacity-60"
        >
          {loading ? 'Сохраняем...' : 'Создать урок'}
        </button>
      </div>
    </form>
  </motion.div>
);

const StatsCard = ({ icon: Icon, title, value, accent }) => (
  <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accent}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

export default TeacherDashboard;
