import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import CodeBlock from './CodeBlock';

const Hero = ({ onOpenModal, onPageChange }) => {
  const { t } = useLanguage();
  
  // Безопасное получение useAuth
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
  } catch (error) {
    console.warn('Hero: useAuth not available', error);
  }

  const handleStartLearning = () => {
    if (isAuthenticated) {
      // Если пользователь авторизован, переходим к курсам
      if (onPageChange) {
        onPageChange('courses');
      }
    } else {
      // Если не авторизован, открываем модальное окно регистрации
      if (onOpenModal) {
        onOpenModal('signup');
      }
    }
  };

  return (
    <motion.section 
      className="flex flex-col md:flex-row items-center justify-center min-h-screen px-4 sm:px-6 md:px-12 gap-8 md:gap-16 bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] py-8 md:py-0"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Левая часть — текст */}
      <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left max-w-lg w-full">
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('hero.title')}
        </motion.h1>
        
        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 px-4 md:px-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {t('hero.subtitle')}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 sm:px-8 py-3 rounded-lg shadow-md transition-all duration-300 text-sm sm:text-base"
            onClick={handleStartLearning}
          >
            {t('hero.start')}
          </button>
        </motion.div>
      </div>

      {/* Правая часть — код */}
      <div className="flex justify-center items-center w-full md:w-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
          <CodeBlock />
        </div>
      </div>
    </motion.section>
  );
};

export default Hero;