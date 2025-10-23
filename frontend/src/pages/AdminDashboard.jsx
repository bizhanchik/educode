import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../i18n.jsx';

const AdminDashboard = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'Главная панель', icon: BarChart3 },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'teachers', label: 'Преподаватели', icon: GraduationCap },
    { id: 'statistics', label: 'Статистика', icon: BarChart3 },
    { id: 'settings', label: 'Настройки сайта', icon: Settings },
    { id: 'logout', label: 'Выйти', icon: LogOut },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Главная панель</h2>
      
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные курсы</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Преподаватели</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средняя оценка</p>
              <p className="text-2xl font-bold text-gray-900">4.7</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Последние активности */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние активности</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Новый пользователь зарегистрирован</span>
            </div>
            <span className="text-xs text-gray-500">2 мин назад</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Курс "Алгоритмизация" одобрен</span>
            </div>
            <span className="text-xs text-gray-500">15 мин назад</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Преподаватель добавил новый урок</span>
            </div>
            <span className="text-xs text-gray-500">1 час назад</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    return renderDashboard();
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
            Панель администратора
          </motion.h1>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Добро пожаловать, <span className="font-semibold">{user?.fullName || 'Администратор'}</span>
            </p>
            <p className="text-sm text-gray-500">Администратор</p>
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
              {adminNavItems.map(item => (
                <li key={item.id}>
                  <motion.button
                    onClick={() => item.id === 'logout' ? logout() : console.log(`Navigate to ${item.id}`)}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition-colors duration-200 text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    whileHover={{ x: 5 }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
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

export default AdminDashboard;