import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, languages } from '../i18n.jsx';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Закрытие меню при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languageLabels = {
    ru: 'ru',
    kk: 'kz', 
    en: 'eng'
  };

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-white/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4" />
        <span>{languageLabels[language]}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-32 bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-1">
              {Object.keys(languages).map((lang) => (
                <motion.button
                  key={lang}
                  className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                    language === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    changeLanguage(lang);
                    setIsOpen(false);
                  }}
                  whileHover={{ x: 5 }}
                >
                  {languageLabels[lang]}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;