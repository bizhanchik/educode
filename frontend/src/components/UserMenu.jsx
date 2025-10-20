import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  BookOpen, 
  PlayCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useLanguage } from '../i18n.jsx';

const UserMenu = ({ onPageChange }) => {
  // Безопасное получение useAuth
  let user = null;
  let logout = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.warn('UserMenu: useAuth not available', error);
    return null;
  }
  
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || !logout) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleMyCourses = () => {
    if (onPageChange) {
      onPageChange('courses');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Кнопка пользователя */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/40 backdrop-blur-md text-gray-700 hover:bg-white/70 transition-all duration-300"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <User className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:block">
          {user.fullName || user.email}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Выпадающее меню */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed right-0 top-20 bg-gray-100/95 backdrop-blur-md rounded-l-xl shadow-lg border border-gray-200/50 z-50 overflow-hidden flex flex-col"
              style={{
                width: '320px',
                height: 'calc(100vh - 5rem)',
                maxHeight: 'none'
              }}
            >
              {/* Информация о пользователе (вверху) */}
              <div className="px-4 py-3 border-b border-gray-200/50 flex-shrink-0">
                <p className="font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {user.role === 'admin' ? t('userMenu.admin') : 
                   user.role === 'student' ? t('userMenu.student') : t('userMenu.user')}
                </span>
              </div>

              {/* Основные кнопки (сразу после данных пользователя) */}
              <div className="p-4 flex-1 flex flex-col justify-start space-y-2">
                <motion.button
                  onClick={handleMyCourses}
                  className="w-full px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-all duration-200 flex items-center gap-3"
                  whileHover={{ x: 4 }}
                >
                  <BookOpen className="w-5 h-5" />
                  {t('userMenu.myCourses')}
                </motion.button>
                
                <motion.button
                  className="w-full px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-all duration-200 flex items-center gap-3"
                  whileHover={{ x: 4 }}
                >
                  <PlayCircle className="w-5 h-5" />
                  {t('userMenu.lessons')}
                </motion.button>

                <motion.button
                  className="w-full px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-all duration-200 flex items-center gap-3"
                  whileHover={{ x: 4 }}
                >
                  <Calendar className="w-5 h-5" />
                  {t('userMenu.journal')}
                </motion.button>
              </div>

              {/* Настройки и выход (внизу) */}
              <div className="p-4 border-t border-gray-200/50 flex-shrink-0">
                <motion.button
                  className="w-full px-4 py-3 text-left text-gray-700 hover:text-gray-900 hover:bg-gray-200/50 rounded-lg transition-colors flex items-center gap-3 mb-2"
                  whileHover={{ x: 4 }}
                >
                  <Settings className="w-4 h-4" />
                  {t('userMenu.settings')}
                </motion.button>
                
                <motion.button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-colors flex items-center gap-3"
                  whileHover={{ x: 4 }}
                >
                  <LogOut className="w-4 h-4" />
                  {t('userMenu.logout')}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
