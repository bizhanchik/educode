import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';
import CodeBlock from './CodeBlock';

const Hero = () => {
  const { t } = useLanguage();

  return (
    <motion.section 
      className="flex flex-col md:flex-row items-center justify-center h-screen px-12 gap-16 bg-gradient-to-b from-[#f9fafb] to-[#edf2f7]"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      {/* Левая часть — текст */}
      <div className="flex flex-col justify-center items-start text-left max-w-lg">
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('hero.title')}
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-gray-600 mb-8"
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
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-md transition-all duration-300">
            {t('hero.start')}
          </button>
        </motion.div>
      </div>

      {/* Правая часть — код */}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-lg">
          <CodeBlock />
        </div>
      </div>
    </motion.section>
  );
};

export default Hero;