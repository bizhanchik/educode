import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Database, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { 
  getUserStats, 
  exportDatabase, 
  importDatabase, 
  clearDatabase,
  getUsers 
} from '../utils/auth.js';

const AdminPanel = () => {
  // Безопасное получение useAuth
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('AdminPanel: useAuth not available', error);
    return null;
  }
  
  const [stats, setStats] = useState(getUserStats());
  const [users, setUsers] = useState(getUsers());
  const [isLoading, setIsLoading] = useState(false);

  // Показать только админам
  if (!user || user.role !== 'admin') {
    return null;
  }

  const handleExport = () => {
    exportDatabase();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      importDatabase(file)
        .then(() => {
          setStats(getUserStats());
          setUsers(getUsers());
          alert('База данных успешно импортирована!');
        })
        .catch((error) => {
          alert('Ошибка импорта: ' + error.error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleClear = () => {
    if (confirm('Вы уверены, что хотите очистить всю базу данных?')) {
      const result = clearDatabase();
      if (result.success) {
        setStats(getUserStats());
        setUsers(getUsers());
        alert('База данных очищена и переинициализирована!');
      } else {
        alert('Ошибка: ' + result.error);
      }
    }
  };

  const handleRefresh = () => {
    setStats(getUserStats());
    setUsers(getUsers());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/30 p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Панель администратора</h2>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-600">Всего пользователей</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
          <p className="text-sm text-gray-600">Администраторы</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.students}</p>
          <p className="text-sm text-gray-600">Студенты</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.regular}</p>
          <p className="text-sm text-gray-600">Обычные пользователи</p>
        </div>
      </div>

      {/* Управление базой данных */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Управление базой данных</h3>
        <div className="flex flex-wrap gap-3">
          <motion.button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4" />
            Экспорт
          </motion.button>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Импорт
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={isLoading}
            />
          </label>
          
          <motion.button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </motion.button>
          
          <motion.button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-4 h-4" />
            Очистить
          </motion.button>
        </div>
      </div>

      {/* Список пользователей */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Пользователи</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'student' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.role === 'admin' ? 'Админ' :
                   user.role === 'student' ? 'Студент' : 'Пользователь'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Тестовые данные */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">Тестовые аккаунты:</h4>
        <div className="space-y-1 text-sm text-yellow-700">
          <p><strong>Админ:</strong> admin@educode.com / admin123</p>
          <p><strong>Тест:</strong> test@educode.com / test123</p>
          <p><strong>Студент:</strong> student@educode.com / student123</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPanel;
