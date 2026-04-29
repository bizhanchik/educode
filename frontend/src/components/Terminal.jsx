import React from 'react';
import { motion } from 'framer-motion';

const Terminal = ({ output, isVisible }) => {
  if (!isVisible) return null;

  // Разбиваем вывод на строки
  const lines = output.split('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-[#0d1117] text-[#d1d5db] rounded-lg p-4 font-mono text-sm mt-4 border border-gray-700"
    >
      <div className="space-y-1">
        {lines.map((line, index) => (
          <div key={index} className="text-[#d1d5db]">
            {line}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Terminal;
