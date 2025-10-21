import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Code, FileText, Play, CheckCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';

const Lesson1 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [currentSection, setCurrentSection] = useState('video'); // 'video', 'theory', or 'practice'
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [code, setCode] = useState('# Напишите здесь вашу программу\nprint("Hello, World!")');

  const lessonData = {
    id: 1,
    title: "Введение в программирование",
    description: "Основные понятия и принципы программирования",
    theory: {
      title: "Что такое программирование?",
      content: `
Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить для решения определенной задачи.

## Основные принципы программирования:

### 1. Алгоритмическое мышление
Алгоритм — это пошаговая инструкция для решения задачи. Программист должен уметь разбивать сложные задачи на простые шаги.

### 2. Логика
Программирование требует логического мышления. Каждая инструкция должна быть четкой и последовательной.

### 3. Структурированность
Хороший код организован, читаем и понятен. Используйте комментарии и следуйте соглашениям.

### 4. Тестирование
Всегда проверяйте свой код на разных данных и сценариях.

## Популярные языки программирования:

- **Python** — простой и мощный язык для начинающих
- **JavaScript** — язык веб-разработки
- **Java** — универсальный язык для больших проектов
- **C++** — язык системного программирования
- **C#** — язык для разработки приложений Windows

## Первая программа

Традиционно первой программой является "Hello World" — простая программа, которая выводит приветствие.
      `
    },
    practice: {
      title: "Практическое задание",
      description: "Создайте свою первую программу 'Hello World'",
      task: `
## Задание: Hello World

Создайте программу, которая выводит на экран сообщение "Hello, World!".

### Требования:
1. Программа должна выводить текст "Hello, World!"
2. Добавьте комментарий с вашим именем
3. Попробуйте изменить сообщение на что-то свое

### Пример кода на Python:
\`\`\`python
# Программа создана: [Ваше имя]
print("Hello, World!")
print("Добро пожаловать в мир программирования!")
\`\`\`

### Пример кода на JavaScript:
\`\`\`javascript
// Программа создана: [Ваше имя]
console.log("Hello, World!");
console.log("Добро пожаловать в мир программирования!");
\`\`\`

### Что делать:
1. Выберите язык программирования
2. Напишите код в редакторе ниже
3. Проверьте результат
4. Попробуйте изменить сообщение
      `,
      editor: {
        language: 'python',
        placeholder: '# Напишите здесь вашу программу\nprint("Hello, World!")'
      }
    }
  };

  const handleBackToLessons = () => {
    if (onPageChange) {
      onPageChange('programming-basics');
    }
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleRunCode = () => {
    // Здесь будет логика выполнения кода
    alert('Код проверен! Результат: Hello, World!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Код скопирован!');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 pt-16 sm:pt-20 md:pt-24">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <motion.button
              onClick={handleBackToLessons}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileHover={{ x: -4 }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к урокам</span>
            </motion.button>
          </motion.div>

          {/* Lesson Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              1. {lessonData.title}
            </h1>
            <p className="text-gray-600">
              {lessonData.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Dynamic Content */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {currentSection === 'video' && (
                  <motion.div
                    key="video"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="relative aspect-video bg-gray-900">
                      {/* Video Placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.button
                          className="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Play className="w-8 h-8 text-gray-800 ml-1" />
                        </motion.button>
                      </div>
                      
                      {/* Video Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Video Info */}
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="text-sm font-medium">Введение в программирование</div>
                        <div className="text-xs text-white/80">15:30</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentSection === 'theory' && (
                  <motion.div
                    key="theory"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Теория</h2>
                    </div>
                    
                    <div className="prose prose-gray max-w-none">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {lessonData.theory.content}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentSection === 'practice' && (
                  <motion.div
                    key="practice"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Практическое задание</h2>
                    </div>
                    
                    <div className="prose prose-gray max-w-none mb-6">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {lessonData.practice.task}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setShowPracticeModal(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Открыть редактор кода
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column - Navigation */}
            <div className="space-y-6">
              {/* Lesson Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Навигация по уроку</h3>
                
                <div className="space-y-3">
                  <motion.button
                    onClick={() => setCurrentSection('video')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      currentSection === 'video'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentSection === 'video' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <Play className={`w-3 h-3 ${
                        currentSection === 'video' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      currentSection === 'video' ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      Видео
                    </span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setCurrentSection('theory')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      currentSection === 'theory'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentSection === 'theory' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <FileText className={`w-3 h-3 ${
                        currentSection === 'theory' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      currentSection === 'theory' ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      Теория
                    </span>
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setCurrentSection('practice')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      currentSection === 'practice'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      currentSection === 'practice' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <Code className={`w-3 h-3 ${
                        currentSection === 'practice' ? 'text-white' : 'text-gray-600'
                      }`} />
                    </div>
                    <span className={`text-sm font-medium ${
                      currentSection === 'practice' ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      Практика
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Modal */}
      {showPracticeModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-gray-50 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setShowPracticeModal(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  whileHover={{ x: -4 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Назад</span>
                </motion.button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-green-600" />
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900">Практическое задание</h1>
                </div>
              </div>
              <motion.button
                onClick={() => setShowPracticeModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Далее
              </motion.button>
            </div>
          </div>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="grid lg:grid-cols-2 gap-8 h-full">
                {/* Left Column - Task Description */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Задание</h2>
                    </div>
                    <div className="prose prose-gray max-w-none">
                      <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                        {lessonData.practice.task}
                      </div>
                    </div>
                  </motion.div>

                  {/* Tips */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">💡</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Подсказка</h3>
                        <p className="text-blue-800 text-sm leading-relaxed">
                          Используйте функцию print() для вывода результата. Не забудьте про кавычки для строк!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Code Editor */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
                  >
                    {/* Editor Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
                            <Code className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <span className="text-gray-800 font-semibold">Редактор кода</span>
                            <span className="text-gray-500 text-sm ml-2">Python</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={handleCopyCode}
                            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors rounded-md text-sm"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Копировать
                          </motion.button>
                          <motion.button
                            onClick={handleRunCode}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Проверить
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 p-6">
                      <div className="h-full">
                        <textarea
                          value={code}
                          onChange={handleCodeChange}
                          placeholder={lessonData.practice.editor.placeholder}
                          className="w-full h-full bg-gray-50 text-gray-800 font-mono text-sm rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
                          style={{ fontFamily: 'Monaco, Consolas, "Courier New", monospace' }}
                        />
                      </div>
                    </div>

                    {/* Output */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">📋</span>
                        <h3 className="text-sm font-medium text-gray-700">Результат выполнения</h3>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 min-h-[80px]">
                        <div className="text-gray-600 font-mono text-sm">
                          {code ? 'Нажмите "Проверить" чтобы увидеть результат' : 'Напишите код выше и проверьте его'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Lesson1;
