import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section id="about" className="bg-[#f8f9ff] text-gray-800 py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 flex flex-col items-center">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-center"
      >
        О проекте <span className="text-indigo-500">EduCode</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        viewport={{ once: true }}
        className="text-base sm:text-lg text-center text-gray-600 max-w-2xl mb-6 sm:mb-8 leading-relaxed px-4"
      >
        EduCode — это образовательная платформа нового поколения, которая помогает
        студентам изучать программирование, применять знания на практике и проверять
        авторство кода с помощью искусственного интеллекта.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-2xl text-center text-gray-600 space-y-4 sm:space-y-5 px-4"
      >
        <p className="text-sm sm:text-base">
          Мы создаём пространство, где теория превращается в реальные навыки.
          EduCode анализирует ваш код, помогает находить ошибки, предлагает улучшения
          и оценивает прогресс.
        </p>
        <p className="text-sm sm:text-base">
          Наша цель — сделать обучение программированию понятным, живым и вдохновляющим.
          Независимо от уровня подготовки, каждый студент может развиваться в собственном темпе
          и чувствовать уверенность в своих результатах.
        </p>
      </motion.div>
    </section>
  );
};

export default AboutSection;