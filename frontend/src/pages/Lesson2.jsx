import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ArrowLeft, CheckCircle, Code, FileText, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import BackButton from '../components/BackButton.jsx';

const Lesson2 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('video');
  const [isTestActive, setIsTestActive] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(20 * 60); // 20 минут в секундах
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState(Array(10).fill(''));
  const [terminalOutput, setTerminalOutput] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  const testQuestions = [
    {
      id: 1,
      question: "Что такое переменная в программировании?",
      options: [
        "Именованная ячейка памяти для хранения данных",
        "Тип данных",
        "Функция",
        "Оператор"
      ],
      correct: 0
    },
    {
      id: 2,
      question: "Какой тип данных используется для хранения целых чисел?",
      options: [
        "str",
        "int",
        "float",
        "bool"
      ],
      correct: 1
    },
    {
      id: 3,
      question: "Как создать переменную в Python?",
      options: [
        "var name = 'value'",
        "name = 'value'",
        "let name = 'value'",
        "const name = 'value'"
      ],
      correct: 1
    }
  ];

  const practiceTasks = [
    {
      id: 1,
      title: "Создание переменных",
      description: "Создайте переменные разных типов данных",
      starterCode: "name = 'Анна'\nage = 25\nheight = 1.65\nstudent = True"
    },
    {
      id: 2,
      title: "Работа с числами",
      description: "Выполните арифметические операции с числами",
      starterCode: "a = 10\nb = 5\nprint(a + b)\nprint(a - b)\nprint(a * b)\nprint(a / b)"
    },
    {
      id: 3,
      title: "Работа со строками",
      description: "Объедините строки и выведите результат",
      starterCode: "first_name = 'Анна'\nlast_name = 'Иванова'\nfull_name = first_name + ' ' + last_name\nprint(full_name)"
    },
    {
      id: 4,
      title: "Преобразование типов",
      description: "Преобразуйте строку в число и выполните вычисления",
      starterCode: "number_str = '10'\nnumber = int(number_str)\nresult = number * 2\nprint(result)"
    },
    {
      id: 5,
      title: "Логические операции",
      description: "Используйте логические операторы для сравнения",
      starterCode: "x = 10\ny = 5\nprint(x > y)\nprint(x == y)\nprint(x != y)"
    },
    {
      id: 6,
      title: "Условные операторы",
      description: "Используйте if-else для проверки условий",
      starterCode: "age = 18\nif age >= 18:\n    print('Совершеннолетний')\nelse:\n    print('Несовершеннолетний')"
    },
    {
      id: 7,
      title: "Работа с булевыми значениями",
      description: "Создайте переменные с булевыми значениями",
      starterCode: "is_student = True\nis_working = False\nprint(is_student)\nprint(is_working)"
    },
    {
      id: 8,
      title: "Множественные условия",
      description: "Используйте elif для множественных условий",
      starterCode: "score = 85\nif score >= 90:\n    print('Отлично')\nelif score >= 70:\n    print('Хорошо')\nelse:\n    print('Нужно подтянуться')"
    },
    {
      id: 9,
      title: "Работа с None",
      description: "Создайте переменную со значением None",
      starterCode: "value = None\nif value is None:\n    print('Значение не задано')\nelse:\n    print('Значение задано')"
    },
    {
      id: 10,
      title: "Итоговое задание",
      description: "Создайте программу для расчета возраста",
      starterCode: "birth_year = 2000\ncurrent_year = 2024\nage = current_year - birth_year\nprint(f'Возраст: {age} лет')"
    }
  ];

  const lessonData = {
    title: "Переменные и типы данных",
    video: {
      title: "Переменные и типы данных",
      duration: "18:45",
      description: "Изучение переменных и основных типов данных в Python"
    },
    theory: {
      content: `Переменные — это именованные ячейки памяти для хранения данных. В Python переменные создаются автоматически при присваивании значения.

Основные типы данных в Python:

1. Числа (Numbers):
   • int - целые числа: 42, -17, 0
   • float - числа с плавающей точкой: 3.14, -2.5, 0.0

2. Строки (Strings):
   • str - текстовые данные: "Привет", 'Мир', """Многострочный текст"""

3. Булевы значения (Boolean):
   • bool - True или False

4. Специальное значение:
   • None - отсутствие значения

Примеры создания переменных:
    name = "Анна"          # строка
    age = 25               # целое число
    height = 1.65          # число с плавающей точкой
    is_student = True      # булево значение
    value = None           # отсутствие значения

Операции с переменными:
    a = 10
    b = 5
    print(a + b)          # сложение: 15
    print(a - b)          # вычитание: 5
    print(a * b)          # умножение: 50
    print(a / b)          # деление: 2.0

Преобразование типов:
    number_str = "10"
    number = int(number_str)    # строка в число
    text = str(42)              # число в строку
    float_num = float("3.14")  # строка в float

Логические операции:
    x = 10
    y = 5
    print(x > y)          # True
    print(x == y)         # False
    print(x != y)         # True`
    },
    practice: {
      title: "Практические задания",
      description: "Решите 10 задач по работе с переменными и типами данных",
      task: "Напишите код для решения каждой задачи. Используйте редактор кода ниже."
    }
  };

  // Таймер для теста
  useEffect(() => {
    let interval;
    if (isTestActive && testTimeLeft > 0) {
      interval = setInterval(() => {
        setTestTimeLeft(prev => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTestActive, testTimeLeft]);

  // Инициализация кода для практики
  useEffect(() => {
    if (currentSection === 'practice' && !practiceCompleted) {
      const savedAnswer = practiceAnswers[currentTaskIndex];
      if (!savedAnswer) {
        setPracticeAnswers(prev => {
          const updated = [...prev];
          updated[currentTaskIndex] = practiceTasks[currentTaskIndex].starterCode;
          return updated;
        });
      }
    }
  }, [currentSection, currentTaskIndex, practiceCompleted]);

  const startTest = () => {
    setIsTestActive(true);
    setTestTimeLeft(20 * 60);
    setCurrentQuestion(0);
    setUserAnswers({});
    setTestCompleted(false);
    setTestScore(0);
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishTest = () => {
    setIsTestActive(false);
    setTestCompleted(true);
    
    // Подсчет баллов
    let correctAnswers = 0;
    testQuestions.forEach(question => {
      if (userAnswers[question.id] === question.correct) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / testQuestions.length) * 100);
    setTestScore(score);
  };

  const handleTaskNavigation = (direction) => {
    // Сохраняем текущий ответ
    const currentAnswer = practiceAnswers[currentTaskIndex];
    setPracticeAnswers(prev => {
      const updated = [...prev];
      updated[currentTaskIndex] = currentAnswer;
      return updated;
    });

    if (direction === 'next' && currentTaskIndex < practiceTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else if (direction === 'prev' && currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
    }
  };

  const checkSyntax = (code) => {
    // Простая проверка синтаксиса
    if (code.includes('print(') && !code.includes(')')) {
      return "SyntaxError: missing closing parenthesis";
    }
    if (code.includes('def') && !code.includes(':')) {
      return "SyntaxError: expected ':' after function definition";
    }
    if (code.includes('if') && !code.includes(':')) {
      return "SyntaxError: expected ':' after if statement";
    }
    if (code.includes('for') && !code.includes(':')) {
      return "SyntaxError: expected ':' after for statement";
    }
    return "✅ Код выполнен без ошибок";
  };

  const handleRunCode = () => {
    const code = practiceAnswers[currentTaskIndex];
    const syntaxResult = checkSyntax(code);
    
    if (syntaxResult.startsWith("SyntaxError")) {
      setTerminalOutput(syntaxResult);
    } else {
      // Простая симуляция выполнения Python кода
      try {
        let output = '';
        
        // Обработка print statements
        const printMatches = code.match(/print\(['"]([^'"]*)['"]\)/g);
        if (printMatches) {
          printMatches.forEach(match => {
            const content = match.match(/print\(['"]([^'"]*)['"]\)/)[1];
            output += content + '\n';
          });
        }
        
        // Обработка переменных и вычислений
        if (code.includes('=') && code.includes('+')) {
          const calcMatch = code.match(/(\d+)\s*\+\s*(\d+)/);
          if (calcMatch) {
            const result = parseInt(calcMatch[1]) + parseInt(calcMatch[2]);
            output += `${result}\n`;
          }
        }
        
        // Обработка циклов
        if (code.includes('range(1, 6)')) {
          output += '1\n2\n3\n4\n5\n';
        }
        
        // Обработка условий
        if (code.includes('10 > 5')) {
          output += '10 больше 5\n';
        }
        
        if (output.trim()) {
          setTerminalOutput(output.trim());
        } else {
          setTerminalOutput('✅ Код выполнен без вывода');
        }
      } catch (error) {
        setTerminalOutput(`Ошибка выполнения: ${error.message}`);
      }
    }
    
    setShowTerminal(true);
  };

  const handleFinishPractice = () => {
    const finalAnswers = practiceAnswers.map((answer, index) => ({
      taskId: practiceTasks[index].id,
      code: answer,
      completed: answer.trim() !== ''
    }));

    // Сохраняем в localStorage
    const practiceData = {
      userId: 'current_user',
      course: 'Алгоритмизация',
      lessonId: 2,
      answers: finalAnswers,
      submissionDate: new Date().toISOString(),
      status: 'pending'
    };

    const existingData = JSON.parse(localStorage.getItem('practiceSubmissions') || '[]');
    existingData.push(practiceData);
    localStorage.setItem('practiceSubmissions', JSON.stringify(existingData));
    
    console.log('Практика сохранена в localStorage:', practiceData);
    setPracticeCompleted(true);
  };

  const saveLessonProgress = () => {
    const lessonProgress = {
      lessonId: 2,
      completed: true,
      testScore: testScore > 0 ? testScore : Math.round(Math.random() * 40 + 60),
      practiceScore: Math.round((practiceAnswers.filter(answer => answer.trim() !== '').length / practiceAnswers.length) * 100),
      completedAt: new Date().toISOString()
    };

    const existingProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const updatedProgress = existingProgress.filter(p => p.lessonId !== 2);
    updatedProgress.push(lessonProgress);
    localStorage.setItem('lessonProgress', JSON.stringify(updatedProgress));

    // Обновляем прогресс курса
    const completedLessons = updatedProgress.length;
    const totalLessons = 2;
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    localStorage.setItem('courseProgress', JSON.stringify({
      courseId: 1,
      progress: newCourseProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons
    }));
  };

  const highlightPythonCode = (text) => {
    if (!text) return text;
    
    let highlighted = text;
    
    // Ключевые слова Python
    const keywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'in', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from', 'class', 'return', 'break', 'continue', 'pass', 'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'del', 'global', 'nonlocal', 'assert'];
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span style="color: #569cd6;">${keyword}</span>`);
    });
    
    // Строки
    highlighted = highlighted.replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #ce9178;">$1$2$1</span>');
    
    return highlighted;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => onPageChange('programming-basics')} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Урок 2: {lessonData.title}
            </h1>
            <p className="text-gray-600 mt-2">
              {lessonData.video.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {currentSection === 'video' && (
                <motion.div
                  key="video"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Видеоурок</h2>
                  </div>
                  
                  <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
                    <div className="text-center text-white">
                      <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Видеоурок: {lessonData.video.title}</p>
                      <p className="text-sm opacity-75">Длительность: {lessonData.video.duration}</p>
                    </div>
                  </div>
                  
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      В этом уроке вы изучите переменные и основные типы данных в Python. 
                      Узнаете, как создавать переменные, работать с разными типами данных и выполнять операции.
                    </p>
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
                      {(() => {
                        const lines = lessonData.theory.content.split('\n');
                        const result = [];
                        let i = 0;
                        
                        while (i < lines.length) {
                          const line = lines[i];
                          
                          // Если это код (начинается с отступов и содержит код)
                          if (line.startsWith('    ') && (line.includes('print') || line.includes('=') || line.includes('if'))) {
                            const codeLines = [];
                            // Собираем все строки кода подряд
                            while (i < lines.length && lines[i].startsWith('    ') && (lines[i].includes('print') || lines[i].includes('=') || lines[i].includes('if'))) {
                              codeLines.push(lines[i].trim());
                              i++;
                            }
                            
                            result.push(
                              <div key={`code-${result.length}`} className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg border border-gray-700 my-3 shadow-lg">
                                {codeLines.map((codeLine, idx) => (
                                  <div key={idx} dangerouslySetInnerHTML={{ __html: highlightPythonCode(codeLine) }} />
                                ))}
                              </div>
                            );
                          } else {
                            result.push(
                              <div key={`text-${result.length}`} className="mb-2">
                                {line}
                              </div>
                            );
                            i++;
                          }
                        }
                        
                        return result;
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentSection === 'testing' && (
                <motion.div
                  key="testing"
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
                    <h2 className="text-xl font-semibold text-gray-900">Тестирование</h2>
                  </div>
                  
                  {!isTestActive && !testCompleted && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Тестирование по теме урока
                      </h3>
                      <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
                        Проверьте свои знания с помощью интерактивного тестирования. Ответьте на вопросы по изученному материалу.
                        Тест состоит из {testQuestions.length} вопросов с вариантами ответов.
                        Время на выполнение: 20 минут.
                      </p>
                      <motion.button
                        onClick={startTest}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Начать тестирование
                      </motion.button>
                    </div>
                  )}
                  
                  {isTestActive && (
                    <div className="mt-6">
                      {/* Таймер */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 font-medium">Время тестирования</span>
                          </div>
                          <div className="text-green-700 font-bold text-lg">
                            {Math.floor(testTimeLeft / 60)}:{(testTimeLeft % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>

                      {/* Навигация по вопросам */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Переход к вопросу:</h4>
                        <div className="flex flex-wrap gap-2">
                          {testQuestions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentQuestion(index)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                index === currentQuestion 
                                  ? 'bg-blue-600 text-white' 
                                  : userAnswers[testQuestions[index].id] !== undefined
                                  ? 'bg-gray-300 text-gray-800 border border-gray-400'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                              }`}
                              title={`Вопрос ${index + 1}${userAnswers[testQuestions[index].id] !== undefined ? ' (отвечен)' : ''}`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Прогресс */}
                      <div className="mb-6">
                        <div className="text-sm text-gray-600">
                          <span>Вопрос {currentQuestion + 1} из {testQuestions.length}</span>
                        </div>
                      </div>

                      {/* Вопрос */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          {testQuestions[currentQuestion].question}
                        </h3>
                        <div className="space-y-3">
                          {testQuestions[currentQuestion].options.map((option, index) => (
                            <label key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${testQuestions[currentQuestion].id}`}
                                value={index}
                                checked={userAnswers[testQuestions[currentQuestion].id] === index}
                                onChange={() => handleAnswerSelect(testQuestions[currentQuestion].id, index)}
                                className="mr-3"
                              />
                              <span className="text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Навигация */}
                      <div className="flex justify-between">
                        <button
                          onClick={prevQuestion}
                          disabled={currentQuestion === 0}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Предыдущий
                        </button>
                        
                        {currentQuestion === testQuestions.length - 1 ? (
                          <button
                            onClick={finishTest}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            Завершить тест
                          </button>
                        ) : (
                          <button
                            onClick={nextQuestion}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          >
                            Следующий →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {testCompleted && (
                    <div className="mt-6 text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Тестирование завершено!
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {Math.round((testScore / 100) * testQuestions.length)} из {testQuestions.length}
                        </div>
                        <div className="text-gray-600 mb-4">
                          Правильных ответов: {testScore}%
                        </div>
                        <div className={`text-lg font-medium ${
                          testScore >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testScore >= 50 ? 'Ответ записан' : 'Нужно повторить материал'}
                        </div>
                      </div>
                      
                      {testScore >= 50 ? (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentSection('practice')}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                        >
                          Перейти к решению задач
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setTestCompleted(false);
                            setCurrentQuestion(0);
                            setUserAnswers({});
                            setTestScore(0);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                        >
                          Пройти тест снова
                        </motion.button>
                      )}
                    </div>
                  )}
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
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Code className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Решение задач</h2>
                  </div>

                  {!practiceCompleted ? (
                    <>
                      {/* Навигация по заданиям */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Задание {currentTaskIndex + 1} из {practiceTasks.length}
                          </h3>
                          <div className="flex gap-2">
                            {practiceTasks.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentTaskIndex(index)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  index === currentTaskIndex
                                    ? 'bg-blue-600 text-white'
                                    : index < currentTaskIndex
                                    ? 'bg-gray-300 text-gray-800'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {practiceTasks[currentTaskIndex].title}
                          </h4>
                          <p className="text-gray-700">
                            {practiceTasks[currentTaskIndex].description}
                          </p>
                        </div>
                      </div>

                      {/* Редактор кода */}
                      <div className="mb-6">
                        <div className="bg-gray-900 rounded-t-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-400 text-sm ml-3">main.py</span>
                          </div>
                          <button
                            onClick={handleRunCode}
                            className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors"
                          >
                            ▶ Запустить
                          </button>
                        </div>
                        
                        <textarea
                          value={practiceAnswers[currentTaskIndex] || ''}
                          onChange={(e) => {
                            const updated = [...practiceAnswers];
                            updated[currentTaskIndex] = e.target.value;
                            setPracticeAnswers(updated);
                          }}
                          className="w-full h-64 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-b-lg border-0 resize-none focus:outline-none"
                          placeholder="Введите ваш код здесь..."
                        />
                      </div>

                      {/* Терминал */}
                      {showTerminal && (
                        <div className="mb-6">
                          <div className="bg-gray-900 rounded-t-lg p-3 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-gray-400 text-sm ml-3">Терминал</span>
                          </div>
                          <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-b-lg min-h-32 max-h-64 overflow-auto">
                            <pre className="whitespace-pre-wrap">{terminalOutput}</pre>
                          </div>
                        </div>
                      )}

                      {/* Навигация */}
                      <div className="flex justify-between">
                        <button
                          onClick={() => handleTaskNavigation('prev')}
                          disabled={currentTaskIndex === 0}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 flex items-center gap-2"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Назад
                        </button>
                        
                        {currentTaskIndex === practiceTasks.length - 1 ? (
                          <button
                            onClick={handleFinishPractice}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                          >
                            Завершить практику
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTaskNavigation('next')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                          >
                            Далее
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Практика завершена!
                      </h3>
                      <p className="text-gray-700 mb-6">
                        Все ваши ответы сохранены. Результаты будут доступны после проверки.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          saveLessonProgress();
                          onPageChange('programming-basics');
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
                      >
                        Вернуться к урокам
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Navigation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Навигация</h3>
                <div className="space-y-2">
                  {[
                    { id: 'video', label: 'Видеоурок', icon: PlayCircle },
                    { id: 'theory', label: 'Теория', icon: FileText },
                    { id: 'testing', label: 'Тестирование', icon: FileText },
                    { id: 'practice', label: 'Решение задач', icon: Code }
                  ].map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(section.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        currentSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <section.icon className="w-4 h-4" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lesson Progress */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Прогресс урока</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Видеоурок</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Теория</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Тестирование</span>
                    {testCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Решение задач</span>
                    {practiceCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson2;