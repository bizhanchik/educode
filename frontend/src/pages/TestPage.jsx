import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';
import useRole from '../hooks/useRole';

const TestPage = () => {
  const { t } = useLanguage();
  const { user, role, loading, getRoleDisplayName } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center"
        >
          Тестовая страница
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Информация о пользователе</h2>
          
          <div className="space-y-4">
            <div>
              <strong>Пользователь:</strong> {user ? user.fullName : 'Не авторизован'}
            </div>
            <div>
              <strong>Email:</strong> {user ? user.email : 'Не авторизован'}
            </div>
            <div>
              <strong>Роль:</strong> {role || 'Не определена'}
            </div>
            <div>
              <strong>Отображение роли:</strong> {getRoleDisplayName()}
            </div>
            <div>
              <strong>Данные из localStorage:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestPage;
