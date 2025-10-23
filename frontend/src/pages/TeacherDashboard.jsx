import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Save,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../i18n.jsx';
import { getTeacherCourses, updateCourse } from '../utils/auth.js';

const TeacherDashboard = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('courses');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');

  useEffect(() => {
    const loadTeacherCourses = async () => {
      setLoading(true);
      try {
        console.log('Teacher ID:', user?.teacherId);
        console.log('User:', user);
        
        // Получаем курсы преподавателя
        const teacherCourses = getTeacherCourses(user?.teacherId);
        console.log('Teacher courses:', teacherCourses);
        
        setCourses(teacherCourses);
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.teacherId) {
      loadTeacherCourses();
    } else {
      console.log('No teacherId found for user:', user);
      setLoading(false);
    }
  }, [user]);

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
    { id: 'courses', label: 'Мои курсы', icon: BookOpen },
    { id: 'create-course', label: 'Создать курс', icon: Plus },
    { id: 'assignments', label: 'Задания студентов', icon: Users },
    { id: 'notifications', label: 'Уведомления', icon: Bell, count: 2 },
    { id: 'results', label: 'Результаты студентов', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
    { id: 'logout', label: 'Выйти', icon: LogOut },
  ];

  const renderCourses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Мои курсы</h2>
        <motion.button
          onClick={() => setCurrentView('create-course')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Создать курс
        </motion.button>
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
          ← Назад к курсам
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
      case 'courses':
        return renderCourses();
      case 'add-lesson':
        return renderAddLesson();
      case 'notifications':
        return renderNotifications();
      case 'create-course':
        return (
          <div className="text-center py-12">
            <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Создать курс</h2>
            <p className="text-gray-600">Здесь будет форма создания курса</p>
          </div>
        );
      case 'assignments':
        return (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Задания студентов</h2>
            <p className="text-gray-600">Здесь будут задания от студентов</p>
          </div>
        );
      case 'results':
        return (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Результаты студентов</h2>
            <p className="text-gray-600">Здесь будут графики и статистика</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Настройки</h2>
            <p className="text-gray-600">Здесь будут настройки профиля</p>
          </div>
        );
      default:
        return renderCourses();
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center"
          >
            Панель преподавателя
          </motion.h1>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Добро пожаловать, <span className="font-semibold">{user?.fullName || 'Преподаватель'}</span>
            </p>
            <p className="text-sm text-gray-500">Преподаватель</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Навигация</h2>
            <ul className="space-y-2">
              {teacherNavItems.map(item => (
                <li key={item.id}>
                  <motion.button
                    onClick={() => item.id === 'logout' ? logout() : setCurrentView(item.id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                      currentView === item.id 
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.count > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.count}
                      </span>
                    )}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TeacherDashboard;