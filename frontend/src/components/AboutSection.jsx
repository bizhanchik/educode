import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section id="about" className="bg-[#f8f9ff] text-gray-800 py-32 px-8 flex flex-col items-center">
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="text-5xl font-bold mb-6 text-center"
      >
        О проекте <span className="text-indigo-500">EduCode</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        viewport={{ once: true }}
        className="text-lg text-center text-gray-600 max-w-2xl mb-8 leading-relaxed"
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
        className="max-w-2xl text-center text-gray-600 space-y-5"
      >
        <p>
          Мы создаём пространство, где теория превращается в реальные навыки.
          EduCode анализирует ваш код, помогает находить ошибки, предлагает улучшения
          и оценивает прогресс.
        </p>
        <p>
          Наша цель — сделать обучение программированию понятным, живым и вдохновляющим.
          Независимо от уровня подготовки, каждый студент может развиваться в собственном темпе
          и чувствовать уверенность в своих результатах.
        </p>
      </motion.div>
    </section>
  );
};

export default AboutSection;