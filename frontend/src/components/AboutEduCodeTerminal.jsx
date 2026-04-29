import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';

const AboutEduCodeTerminal = () => {
  const { language } = useLanguage();
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);

  // Переводы для терминала
  const terminalTranslations = {
    ru: [
      '> О проекте: EduCode — это интерактивная платформа для обучения программированию.',
      '  Она сочетает теорию и практику, помогая студентам учиться через реальные задачи.',
      '  В теоретических уроках студент изучает материал и проходит тесты.',
      '  В практических — пишет код, решает задачи и получает мгновенную проверку от AI.',
      '  Все результаты автоматически сохраняются в журнал успеваемости,',
      '  который можно экспортировать в Excel — удобно и для студентов, и для преподавателей.',
      '  EduCode делает обучение простым, наглядным и ближе к реальной разработке.'
    ],
    en: [
      '> About: EduCode is an interactive platform for learning programming.',
      '  It combines theory and practice, helping students learn through real-world tasks.',
      '  In theory lessons, students study materials and take tests.',
      '  In practical lessons — they write code, solve problems, and get instant AI feedback.',
      '  All results are automatically saved to the gradebook,',
      '  which can be exported to Excel — convenient for both students and teachers.',
      '  EduCode makes learning simple, visual, and closer to real development.'
    ],
    kk: [
      '> Жоба туралы: EduCode — бағдарламалауды үйренуге арналған интерактивті платформа.',
      '  Ол теория мен практиканы біріктіреді, студенттерге нақты тапсырмалар арқылы үйренуге көмектеседі.',
      '  Теориялық сабақтарда студент материалды оқып, тест тапсырады.',
      '  Практикалық сабақтарда — код жазады, есептерді шешеді және AI-ден лезді тексеру алады.',
      '  Барлық нәтижелер автоматты түрде бағалау журналына сақталады,',
      '  оны Excel-ге экспорттауға болады — студенттер мен мұғалімдер үшін ыңғайлы.',
      '  EduCode оқуды қарапайым, көрнекі және нақты дамытуға жақын етеді.'
    ]
  };

  const terminalLines = terminalTranslations[language] || terminalTranslations.ru;

  // Отслеживание видимости секции
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isInView]);

  // Перезапуск терминала при смене языка
  useEffect(() => {
    if (!isInView) return;
    
    setIsRestarting(true);
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    
    setTimeout(() => {
      setIsRestarting(false);
    }, 300);
  }, [language, isInView]);

  // Анимация появления строк целиком (только когда секция видна)
  useEffect(() => {
    if (!isInView || isRestarting) return;

    if (currentLineIndex >= terminalLines.length) {
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedLines(prev => {
        const newLines = [...prev];
        newLines[currentLineIndex] = terminalLines[currentLineIndex];
        return newLines;
      });
      setCurrentLineIndex(prev => prev + 1);
    }, 150); // Задержка между строками

    return () => clearTimeout(timer);
  }, [currentLineIndex, terminalLines, isRestarting, isInView]);

  return (
    <section 
      ref={sectionRef}
      id="about" 
      className="bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 flex flex-col items-center relative overflow-hidden"
    >
      {/* Мягкое свечение под терминалом */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#7067FF] opacity-5 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl mx-auto relative z-10"
      >
        {/* macOS-стиль окна */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden relative group"
          whileHover={{ boxShadow: '0 20px 60px rgba(112, 103, 255, 0.15)' }}
          transition={{ duration: 0.3 }}
        >
          {/* Верхняя панель с кружками */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42]"></div>
            <div className="ml-4 text-xs sm:text-sm font-mono text-gray-700">
              EduCode Terminal
            </div>
          </div>

          {/* Терминал */}
          <AnimatePresence mode="wait">
            {!isRestarting && (
              <motion.div
                key={language}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 font-mono text-sm sm:text-base leading-relaxed min-h-[320px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {displayedLines.map((line, index) => {
                  // Выделяем символ ">" цветом
                  const renderLine = () => {
                    if (line.startsWith('>')) {
                      return (
                        <>
                          <span className="text-[#7067FF] font-bold">{'>'}</span>
                          <span className="text-gray-100">{line.substring(1)}</span>
                        </>
                      );
                    }
                    return <span className="text-gray-100">{line}</span>;
                  };

                  return (
                    <motion.div
                      key={`${language}-${index}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`${line === '' ? 'h-4 mb-2' : 'mb-2'}`}
                      style={{ whiteSpace: 'pre' }}
                    >
                      {line === '' ? ' ' : renderLine()}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutEduCodeTerminal;
