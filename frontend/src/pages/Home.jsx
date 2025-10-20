import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import AdminPanel from '../components/AdminPanel';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const AnimatedSection = ({ children, delay = 0 }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 1, delay, ease: "easeOut" }
      });
    }
  }, [controls, inView, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={controls}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const Home = () => {
  const { t } = useLanguage();
  
  // Безопасное получение useAuth
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('Home: useAuth not available', error);
  }

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7]">
      <Hero />

      <AboutSection />

      {/* Панель администратора */}
      {user && user.role === 'admin' && (
        <section className="py-16 px-8">
          <AdminPanel />
        </section>
      )}

      {/* Почему это важно */}
      <section className="py-32 bg-gray-50 text-center">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Почему это важно</h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-lg">
            Мы создаём платформу, где каждый студент может расти в собственном темпе. 
            EduCode помогает понять, как писать код осознанно, развивать стиль и 
            получать мгновенную обратную связь от AI.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="border-t border-gray-200 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            {/* Левая часть - контакты */}
            <div className="mb-8 md:mb-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Контакты</h3>
              <div className="space-y-2 text-gray-600">
                <p>📧 Email: будет добавлен позже</p>
                <p>📱 Telegram: будет добавлен позже</p>
                <p>🌐 Website: будет добавлен позже</p>
              </div>
            </div>

            {/* Правая часть - копирайт */}
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm mb-2">EduCode © 2025</p>
              <p className="text-gray-400 text-xs">Все права защищены</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;