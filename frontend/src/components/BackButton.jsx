import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ onClick, children = "Назад", className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className={`mb-6 sm:mb-8 px-16 sm:px-24 ${className}`}
    >
      <motion.button
        onClick={onClick}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm sm:text-base"
        whileHover={{ x: -4 }}
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{children}</span>
      </motion.button>
    </motion.div>
  );
};

export default BackButton;
