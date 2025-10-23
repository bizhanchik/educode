import { useRole } from '../hooks/useRole';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, allowedRoles = [], fallback = null }) => {
  const { role, loading, user } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-6">Необходимо войти в систему</p>
          <motion.button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Перейти на главную
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Недостаточно прав</h2>
          <p className="text-gray-600 mb-6">У вас нет доступа к этой странице</p>
          <motion.button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Перейти на главную
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
