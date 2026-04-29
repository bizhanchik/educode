import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';

const CodeBlock = () => {
  const { language } = useLanguage();
  const [displayedCode, setDisplayedCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [blockWidth, setBlockWidth] = useState(500);

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth < 640) {
        setBlockWidth(320);
      } else if (window.innerWidth < 768) {
        setBlockWidth(400);
      } else {
        setBlockWidth(500);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Код на разных языках
  const codeByLanguage = {
    ru: `function startEduCode() {
  console.log("Добро пожаловать в EduCode!");
  console.log("Изучай теорию, применяй практику и улучшай свои навыки.");
  console.log("EduCode объединяет теорию, практику и проверку кода, помогая студентам развивать навыки и уверенность.");
}

startEduCode();`,
    kk: `function startEduCode() {
  console.log("EduCode жобасына қош келдіңіз!");
  console.log("Теорияны үйреніп, практиканы қолданыңыз және дағдыларыңызды жақсартыңыз.");
  console.log("EduCode теорияны, практиканы және код тексеруді біріктіріп,студенттерге дағдыларын және сенімділікті дамытуға көмектеседі.");
}

startEduCode();`,
    en: `function startEduCode() {
  console.log("Welcome to EduCode Project!");
  console.log("Learn theory, apply practice, and improve your skills.");
  console.log("EduCode combines theory, practice, and code verification, helping students develop skills and confidence.");
}

startEduCode();`
  };

  const codeText = codeByLanguage[language] || codeByLanguage.ru;

  useEffect(() => {
    if (currentIndex < codeText.length) {
      const timeout = setTimeout(() => {
        setDisplayedCode(prev => prev + codeText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);

      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [currentIndex, codeText]);

  useEffect(() => {
    setDisplayedCode('');
    setCurrentIndex(0);
    setIsTyping(true);
  }, [codeText]);

  const createHighlightedCode = (text) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const tokens = [];
      let currentToken = '';
      let inString = false;
      let stringChar = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (!inString && (char === '"' || char === "'")) {
          if (currentToken.trim()) {
            tokens.push({ text: currentToken, type: 'code' });
            currentToken = '';
          }
          inString = true;
          stringChar = char;
          currentToken = char;
        } else if (inString && char === stringChar) {
          currentToken += char;
          tokens.push({ text: currentToken, type: 'string' });
          currentToken = '';
          inString = false;
        } else {
          currentToken += char;
        }
      }

      if (currentToken.trim()) {
        tokens.push({ text: currentToken, type: 'code' });
      }

      return (
        <div key={lineIndex}>
          {tokens.map((token, tokenIndex) => {
            if (token.type === 'string') {
              return <span key={tokenIndex} className="text-green-400">{token.text}</span>;
            } else {
              const words = token.text.split(/(\b\w+\b|[^\w\s])/);
              
              return (
                <span key={tokenIndex}>
                  {words.map((word, wordIndex) => {
                    if (!word) return null;
                    
                    if (word === 'function') {
                      return <span key={wordIndex} className="text-purple-400">{word}</span>;
                    } else if (word === 'console') {
                      return <span key={wordIndex} className="text-blue-400">{word}</span>;
                    } else if (word === 'log') {
                      return <span key={wordIndex} className="text-orange-400">{word}</span>;
                    } else if (word === 'startEduCode') {
                      return <span key={wordIndex} className="text-yellow-400">{word}</span>;
                    } else if (word.match(/[(){};.]/)) {
                      return <span key={wordIndex} className="text-white">{word}</span>;
                    } else {
                      return <span key={wordIndex} className="text-gray-300">{word}</span>;
                    }
                  })}
                </span>
              );
            }
          })}
          {lineIndex < lines.length - 1 && <br />}
        </div>
      );
    });
  };

  return (
    <motion.div
      className="bg-[#0d1117] rounded-xl sm:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] overflow-hidden border border-gray-700 flex-shrink-0"
      style={{
        width: `${blockWidth}px`,
        maxWidth: `${blockWidth}px`,
        minWidth: `${blockWidth}px`,
        height: '400px',
        maxHeight: '400px',
        minHeight: '400px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {/* Заголовок окна как в Mac */}
      <div 
        className="bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex items-center"
        style={{ height: '50px', minHeight: '50px', maxHeight: '50px', boxSizing: 'border-box' }}
      >
        <div className="flex space-x-1 sm:space-x-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="ml-3 sm:ml-4 text-xs sm:text-sm text-gray-400 font-medium">eduCode.js</div>
      </div>
      
      {/* Код с подсветкой синтаксиса */}
      <div 
        className="bg-[#0d1117] text-gray-100 font-mono leading-normal whitespace-pre-wrap break-words overflow-hidden"
        style={{
          width: '100%',
          height: '350px',
          maxHeight: '350px',
          minHeight: '350px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          padding: '20px',
          fontSize: '16px',
          lineHeight: '1.7'
        }}
      >
        <code style={{ display: 'block', width: '100%', height: '100%' }}>
          {createHighlightedCode(displayedCode)}
        </code>
      </div>
    </motion.div>
  );
};

export default CodeBlock;