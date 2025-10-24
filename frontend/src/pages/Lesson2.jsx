<<<<<<< HEAD
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Code, Lightbulb, FileText, Star, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { updateUserProgress, saveGrade, addNotification, updateLessonProgress, getLessonProgress } from '../utils/auth.js';
import Toast from '../components/Toast.jsx';
import CodeRunner from '../components/CodeRunner.jsx';
import BackButton from '../components/BackButton.jsx';

const Lesson2 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('video'); // 'video', 'theory', or 'practice'
=======
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, Clock, Code, FileText, PlayCircle } from 'lucide-react';
import BackButton from '../components/BackButton';
import CodeRunner from '../components/CodeRunner';
import ResultsBlock from '../components/ResultsBlock';

const Lesson2 = ({ onPageChange }) => {
  const [currentSection, setCurrentSection] = useState('video');
>>>>>>> 706454d (ready for implementation)
  const [currentTask, setCurrentTask] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [lessonGrade, setLessonGrade] = useState(null);
  const [taskResults, setTaskResults] = useState([]);
<<<<<<< HEAD
  const [toast, setToast] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Типы данных',
      description: 'Создайте переменные разных типов и выведите их значения',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Создайте переменные разных типов
age = 25
name = "Анна"
is_student = True
print(f"Имя: {name}, Возраст: {age}, Студент: {is_student}")`
    },
    {
      id: 'task-2', 
      title: 'Арифметические операции',
      description: 'Выполните базовые арифметические операции с числами',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Выполните арифметические операции
a = 10
b = 5
print(f"Сложение: {a + b}")
print(f"Вычитание: {a - b}")
print(f"Умножение: {a * b}")
print(f"Деление: {a / b}")`
    },
    {
      id: 'task-3',
      title: 'Работа со строками', 
      description: 'Выполните операции со строками: конкатенация, форматирование',
      userAnswer: '',
      status: 'pending',
      maxPoints: 40,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Работа со строками
first_name = "Иван"
last_name = "Петров"
full_name = first_name + " " + last_name
print(f"Полное имя: {full_name}")
print(f"Длина имени: {len(full_name)}")`
=======
  const [forceUpdateCodeRef, setForceUpdateCodeRef] = useState(null);

  // Состояние для тестирования
  const [isTestActive, setIsTestActive] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(20 * 60); // 20 минут в секундах
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [testScore, setTestScore] = useState(0);

  // Состояние для практики
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState(Array(10).fill(""));
  const [terminalOutput, setTerminalOutput] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  const lessonData = {
    id: 2,
    title: "Переменные и типы данных",
    description: "Как хранить и обрабатывать информацию",
    video: {
      url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      title: "Переменные и типы данных в Python"
    },
    theory: {
      content: `Переменные в Python

Переменная — это именованная область памяти для хранения данных. В Python переменные создаются автоматически при присваивании значения.

Основные типы данных:
• Числа (int, float) - для хранения числовых значений
• Строки (str) - для хранения текста
• Логические значения (bool) - True или False
• Списки (list) - для хранения множества элементов

Примеры создания переменных:
    name = "Анна"
    age = 25
    height = 1.65
    is_student = True
    grades = [5, 4, 5, 3]

Операции с переменными:
    x = 10
    y = 5
    sum_result = x + y
    print(sum_result)  # Выведет: 15

Преобразование типов:
    number_str = "123"
    number_int = int(number_str)
    print(number_int + 1)  # Выведет: 124

Работа со строками:
    text = "Hello World"
    print(text.upper())  # HELLO WORLD
    print(text.lower())  # hello world
    print(len(text))     # 11

Условные выражения:
    age = 18
    status = "совершеннолетний" if age >= 18 else "несовершеннолетний"
    print(status)  # совершеннолетний

Списки и переменные:
    numbers = [1, 2, 3, 4, 5]
    first = numbers[0]
    last = numbers[-1]
    print(f"Первый: {first}, Последний: {last}")

Комплексные вычисления:
    radius = 5
    pi = 3.14159
    area = pi * radius ** 2
    circumference = 2 * pi * radius
    print(f"Площадь: {area:.2f}, Длина окружности: {circumference:.2f}")`
    },
    practice: {
      title: "Практическое задание",
      description: "Создайте программы с переменными и типами данных",
      task: `Задание 1: Создание переменных

Создайте переменные для хранения информации о себе:
• Имя (строка)
• Возраст (число)
• Город (строка)
• Статус студента (логическое значение)

Требования:
1. Создайте переменные разных типов
2. Выведите информацию на экран
3. Используйте f-строки для форматирования

Пример кода:
    name = "Анна"
    age = 20
    city = "Алматы"
    is_student = True
    print(f"Меня зовут {name}, мне {age} лет")
    print(f"Я живу в {city}")
    print(f"Я студент: {is_student}")

Задание 2: Арифметические операции

Выполните вычисления с переменными:
• Сложение, вычитание, умножение, деление
• Возведение в степень
• Остаток от деления

Требования:
1. Используйте переменные для чисел
2. Выполните все операции
3. Выведите результаты

Пример кода:
    a = 15
    b = 3
    print(f"Сумма: {a + b}")
    print(f"Разность: {a - b}")
    print(f"Произведение: {a * b}")
    print(f"Частное: {a / b}")
    print(f"Степень: {a ** b}")
    print(f"Остаток: {a % b}")

Задание 3: Работа со строками

Объедините строки и используйте методы:
• Конкатенация строк
• Методы upper(), lower()
• Длина строки

Требования:
1. Создайте несколько строк
2. Объедините их
3. Примените методы строк

Пример кода:
    first_name = "Иван"
    last_name = "Петров"
    full_name = first_name + " " + last_name
    print(f"Полное имя: {full_name}")
    print(f"Верхний регистр: {full_name.upper()}")
    print(f"Длина имени: {len(full_name)}")

Задание 4: Логические операции

Используйте логические переменные:
• Операции and, or, not
• Условные выражения

Требования:
1. Создайте логические переменные
2. Выполните логические операции
3. Используйте условные выражения

Пример кода:
    is_weekend = True
    is_holiday = False
    can_rest = is_weekend or is_holiday
    must_work = not can_rest
    print(f"Можно отдыхать: {can_rest}")
    print(f"Нужно работать: {must_work}")

Задание 5: Преобразование типов

Преобразуйте типы данных:
• Строка в число
• Число в строку
• Логическое значение

Требования:
1. Создайте переменные разных типов
2. Преобразуйте их
3. Выведите результаты

Пример кода:
    number_str = "123"
    number_int = int(number_str)
    number_float = float(number_str)
    text_number = str(number_int)
    print(f"Строка: {number_str}")
    print(f"Целое число: {number_int}")
    print(f"Дробное число: {number_float}")
    print(f"Обратно в строку: {text_number}")

Задание 6: Работа с числами

Выполните операции с числами:
• Округление
• Возведение в степень
• Остаток от деления

Требования:
1. Используйте дробные числа
2. Выполните математические операции
3. Округлите результаты

Пример кода:
    x = 10.5
    y = 2
    print(f"Округление: {round(x)}")
    print(f"Возведение в степень: {x ** y}")
    print(f"Остаток от деления: {x % y}")
    print(f"Квадратный корень: {x ** 0.5}")

Задание 7: Строковые методы

Используйте методы строк:
• upper(), lower()
• len() для длины
• Индексация

Требования:
1. Создайте строку
2. Примените различные методы
3. Используйте индексацию

Пример кода:
    text = "Hello World"
    print(f"Исходный текст: {text}")
    print(f"Верхний регистр: {text.upper()}")
    print(f"Нижний регистр: {text.lower()}")
    print(f"Длина строки: {len(text)}")
    print(f"Первый символ: {text[0]}")
    print(f"Последний символ: {text[-1]}")

Задание 8: Условные выражения

Используйте условные выражения:
• Тернарный оператор
• Сравнения

Требования:
1. Создайте переменные для сравнения
2. Используйте условные выражения
3. Выведите результаты

Пример кода:
    age = 18
    temperature = 25
    status = "совершеннолетний" if age >= 18 else "несовершеннолетний"
    weather = "жарко" if temperature > 20 else "прохладно"
    print(f"Возраст {age}: {status}")
    print(f"Температура {temperature}: {weather}")

Задание 9: Списки и переменные

Работайте со списками:
• Создание списков
• Индексация
• Длина списка

Требования:
1. Создайте список
2. Обратитесь к элементам
3. Найдите длину

Пример кода:
    numbers = [1, 2, 3, 4, 5]
    names = ["Анна", "Петр", "Мария"]
    first_number = numbers[0]
    last_number = numbers[-1]
    first_name = names[0]
    print(f"Первый элемент: {first_number}")
    print(f"Последний элемент: {last_number}")
    print(f"Первое имя: {first_name}")
    print(f"Количество чисел: {len(numbers)}")

Задание 10: Комплексные вычисления

Выполните комплексные вычисления:
• Геометрические расчеты
• Форматирование чисел

Требования:
1. Выполните геометрические расчеты
2. Отформатируйте результаты
3. Используйте константы

Пример кода:
    radius = 5
    pi = 3.14159
    area = pi * radius ** 2
    circumference = 2 * pi * radius
    volume = (4/3) * pi * radius ** 3
    print(f"Радиус: {radius}")
    print(f"Площадь круга: {area:.2f}")
    print(f"Длина окружности: {circumference:.2f}")
    print(f"Объем шара: {volume:.2f}")`
    }
  };

  const tasks = [
    {
      id: 1,
      title: "Создание переменных",
      description: "Создайте переменные для хранения информации о себе",
      initialCode: '# Создайте переменные\nname = "Ваше имя"\nage = 20\ncity = "Ваш город"\nis_student = True\nprint(f"Меня зовут {name}, мне {age} лет, я живу в {city}")\nprint(f"Я студент: {is_student}")',
      expectedOutput: "Меня зовут Ваше имя, мне 20 лет, я живу в Ваш город\nЯ студент: True"
    },
    {
      id: 2,
      title: "Арифметические операции",
      description: "Выполните вычисления с переменными",
      initialCode: '# Выполните вычисления\na = 15\nb = 3\nprint(f"Сумма: {a + b}")\nprint(f"Разность: {a - b}")\nprint(f"Произведение: {a * b}")\nprint(f"Частное: {a / b}")\nprint(f"Степень: {a ** b}")\nprint(f"Остаток: {a % b}")',
      expectedOutput: "Сумма: 18\nРазность: 12\nПроизведение: 45\nЧастное: 5.0\nСтепень: 3375\nОстаток: 0"
    },
    {
      id: 3,
      title: "Работа со строками",
      description: "Объедините строки и выведите результат",
      initialCode: '# Работа со строками\nfirst_name = "Иван"\nlast_name = "Петров"\nfull_name = first_name + " " + last_name\nprint(f"Полное имя: {full_name}")\nprint(f"Верхний регистр: {full_name.upper()}")\nprint(f"Длина имени: {len(full_name)}")',
      expectedOutput: "Полное имя: Иван Петров\nВерхний регистр: ИВАН ПЕТРОВ\nДлина имени: 11"
>>>>>>> 706454d (ready for implementation)
    }
  ]);
  const [code, setCode] = useState(tasks[0].initialCode);

<<<<<<< HEAD
  // Загружаем прогресс урока при монтировании компонента
  React.useEffect(() => {
    if (user) {
      const progress = getLessonProgress(user.id, 'algorithms', 2);
      setLessonProgress(progress);
=======
  // Вопросы для тестирования
  const testQuestions = [
    {
      id: 1,
      question: "Как создать переменную в Python?",
      options: [
        "var name = 'Python'",
        "name = 'Python'",
        "string name = 'Python'",
        "declare name = 'Python'"
      ],
      correct: 1
    },
    {
      id: 2,
      question: "Какой тип данных у переменной age = 25?",
      options: ["str", "int", "float", "bool"],
      correct: 1
    },
    {
      id: 3,
      question: "Как объединить две строки в Python?",
      options: [
        "str1 + str2",
        "str1.concat(str2)",
        "str1.join(str2)",
        "str1.append(str2)"
      ],
      correct: 0
    },
    {
      id: 4,
      question: "Что выведет код: print(type(3.14))?",
      options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"],
      correct: 1
    },
    {
      id: 5,
      question: "Как преобразовать строку '123' в число?",
      options: ["int('123')", "str(123)", "float('123')", "number('123')"],
      correct: 0
    },
    {
      id: 6,
      question: "Что такое переменная в программировании?",
      options: [
        "Функция для вычислений",
        "Именованная область памяти",
        "Тип данных",
        "Оператор"
      ],
      correct: 1
    },
    {
      id: 7,
      question: "Какой результат операции: 10 / 3?",
      options: ["3", "3.33", "3.3333333333333335", "Ошибка"],
      correct: 2
    },
    {
      id: 8,
      question: "Что выведет код: print(bool(0))?",
      options: ["True", "False", "0", "Ошибка"],
      correct: 1
    },
    {
      id: 9,
      question: "Как создать список в Python?",
      options: [
        "list = [1, 2, 3]",
        "array = [1, 2, 3]",
        "vector = [1, 2, 3]",
        "Все варианты правильные"
      ],
      correct: 0
    },
    {
      id: 10,
      question: "Что такое динамическая типизация?",
      options: [
        "Тип переменной определяется автоматически",
        "Тип переменной задается явно",
        "Переменная может менять тип",
        "Тип переменной неизменен"
      ],
      correct: 0
    }
  ];

  // Задания для практики
  const practiceTasks = [
    {
      id: 1,
      title: "Создание переменных",
      description: "Создайте переменные для хранения информации о себе",
      starterCode: '# Создайте переменные\nname = "Ваше имя"\nage = 20\ncity = "Ваш город"\nis_student = True\nprint(f"Меня зовут {name}, мне {age} лет, я живу в {city}")\nprint(f"Я студент: {is_student}")'
    },
    {
      id: 2,
      title: "Арифметические операции",
      description: "Выполните вычисления с переменными",
      starterCode: '# Выполните вычисления\na = 15\nb = 3\nprint(f"Сумма: {a + b}")\nprint(f"Разность: {a - b}")\nprint(f"Произведение: {a * b}")\nprint(f"Частное: {a / b}")\nprint(f"Степень: {a ** b}")\nprint(f"Остаток: {a % b}")'
    },
    {
      id: 3,
      title: "Работа со строками",
      description: "Объедините строки и выведите результат",
      starterCode: '# Работа со строками\nfirst_name = "Иван"\nlast_name = "Петров"\nfull_name = first_name + " " + last_name\nprint(f"Полное имя: {full_name}")\nprint(f"Верхний регистр: {full_name.upper()}")\nprint(f"Длина имени: {len(full_name)}")'
    },
    {
      id: 4,
      title: "Логические операции",
      description: "Используйте логические переменные",
      starterCode: '# Логические операции\nis_weekend = True\nis_holiday = False\ncan_rest = is_weekend or is_holiday\nmust_work = not can_rest\nprint(f"Можно отдыхать: {can_rest}")\nprint(f"Нужно работать: {must_work}")'
    },
    {
      id: 5,
      title: "Преобразование типов",
      description: "Преобразуйте типы данных",
      starterCode: '# Преобразование типов\nnumber_str = "123"\nnumber_int = int(number_str)\nnumber_float = float(number_str)\ntext_number = str(number_int)\nprint(f"Строка: {number_str}")\nprint(f"Целое число: {number_int}")\nprint(f"Дробное число: {number_float}")\nprint(f"Обратно в строку: {text_number}")'
    },
    {
      id: 6,
      title: "Работа с числами",
      description: "Выполните операции с числами",
      starterCode: '# Работа с числами\nx = 10.5\ny = 2\nprint(f"Округление: {round(x)}")\nprint(f"Возведение в степень: {x ** y}")\nprint(f"Остаток от деления: {x % y}")\nprint(f"Квадратный корень: {x ** 0.5}")'
    },
    {
      id: 7,
      title: "Строковые методы",
      description: "Используйте методы строк",
      starterCode: '# Строковые методы\ntext = "Hello World"\nprint(f"Исходный текст: {text}")\nprint(f"Верхний регистр: {text.upper()}")\nprint(f"Нижний регистр: {text.lower()}")\nprint(f"Длина строки: {len(text)}")\nprint(f"Первый символ: {text[0]}")\nprint(f"Последний символ: {text[-1]}")'
    },
    {
      id: 8,
      title: "Условные выражения",
      description: "Используйте условные выражения",
      starterCode: '# Условные выражения\nage = 18\ntemperature = 25\nstatus = "совершеннолетний" if age >= 18 else "несовершеннолетний"\nweather = "жарко" if temperature > 20 else "прохладно"\nprint(f"Возраст {age}: {status}")\nprint(f"Температура {temperature}: {weather}")'
    },
    {
      id: 9,
      title: "Списки и переменные",
      description: "Работайте со списками",
      starterCode: '# Списки и переменные\nnumbers = [1, 2, 3, 4, 5]\nnames = ["Анна", "Петр", "Мария"]\nfirst_number = numbers[0]\nlast_number = numbers[-1]\nfirst_name = names[0]\nprint(f"Первый элемент: {first_number}")\nprint(f"Последний элемент: {last_number}")\nprint(f"Первое имя: {first_name}")\nprint(f"Количество чисел: {len(numbers)}")'
    },
    {
      id: 10,
      title: "Комплексные вычисления",
      description: "Выполните комплексные вычисления",
      starterCode: '# Комплексные вычисления\nradius = 5\npi = 3.14159\narea = pi * radius ** 2\ncircumference = 2 * pi * radius\nvolume = (4/3) * pi * radius ** 3\nprint(f"Радиус: {radius}")\nprint(f"Площадь круга: {area:.2f}")\nprint(f"Длина окружности: {circumference:.2f}")\nprint(f"Объем шара: {volume:.2f}")'
    }
  ];

  // Функции для управления тестированием
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
    let correctAnswers = 0;
    testQuestions.forEach(question => {
      if (userAnswers[question.id] === question.correct) {
        correctAnswers++;
      }
    });
    
    const scorePercentage = Math.round((correctAnswers / testQuestions.length) * 100);
    setTestScore(scorePercentage);
    setTestCompleted(true);
    setIsTestActive(false);
  };

  // Таймер для тестирования
  useEffect(() => {
    let interval;
    if (isTestActive && testTimeLeft > 0) {
      interval = setInterval(() => {
        setTestTimeLeft(testTimeLeft => {
          if (testTimeLeft <= 1) {
            finishTest();
            return 0;
          }
          return testTimeLeft - 1;
        });
      }, 1000);
    } else if (!isTestActive || testTimeLeft === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTestActive, testTimeLeft]);

  // Инициализация кода для практики
  useEffect(() => {
    if (currentSection === 'practice' && !practiceCompleted) {
      setCode(practiceAnswers[currentTaskIndex] || practiceTasks[currentTaskIndex]?.starterCode || '');
    }
  }, [currentSection, currentTaskIndex, practiceCompleted]);

  // Функции для управления практикой
  const handleTaskNavigation = (direction) => {
    // Сохраняем текущий код
    setPracticeAnswers(prev => {
      const updated = [...prev];
      updated[currentTaskIndex] = code;
      return updated;
    });

    if (direction === 'next' && currentTaskIndex < practiceTasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      // Загружаем код для следующего задания
      setCode(practiceAnswers[currentTaskIndex + 1] || practiceTasks[currentTaskIndex + 1].starterCode);
    } else if (direction === 'prev' && currentTaskIndex > 0) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      // Загружаем код для предыдущего задания
      setCode(practiceAnswers[currentTaskIndex - 1] || practiceTasks[currentTaskIndex - 1].starterCode);
    }
    setShowTerminal(false);
  };

  const checkSyntax = (code) => {
    // Проверка синтаксиса Python
    if (code.includes("print(") && !code.includes(")")) {
      return "SyntaxError: missing closing parenthesis";
    }
    if (code.includes("def ") && !code.includes(":")) {
      return "SyntaxError: expected ':' after function definition";
    }
    if (code.includes("if ") && !code.includes(":")) {
      return "SyntaxError: expected ':' after if statement";
    }
    if (code.includes("for ") && !code.includes(":")) {
      return "SyntaxError: expected ':' after for statement";
    }
    if (code.includes("while ") && !code.includes(":")) {
      return "SyntaxError: expected ':' after while statement";
    }
    return null;
  };

  const handleRunCode = () => {
    // Проверяем синтаксис
    const syntaxError = checkSyntax(code);
    if (syntaxError) {
      setTerminalOutput(syntaxError);
      setShowTerminal(true);
      return;
    }

    // Простая симуляция выполнения Python кода
    let output = "";
    let hasOutput = false;
    
    try {
      const lines = code.split('\n');
      for (let line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue; // Пропускаем пустые строки и комментарии
        }
        
        if (trimmedLine.startsWith('print(')) {
          // Извлекаем содержимое print
          const match = trimmedLine.match(/print\((.+)\)/);
          if (match) {
            let content = match[1];
            // Простая обработка f-строк
            if (content.startsWith('f"') && content.endsWith('"')) {
              content = content.slice(2, -1);
              // Заменяем переменные на их значения (упрощенно)
              content = content.replace(/\{([^}]+)\}/g, (match, varName) => {
                const varMatch = code.match(new RegExp(`${varName.trim()}\\s*=\\s*"([^"]+)"`));
                if (varMatch) return varMatch[1];
                const numMatch = code.match(new RegExp(`${varName.trim()}\\s*=\\s*(\\d+(?:\\.\\d+)?)`));
                if (numMatch) return numMatch[1];
                return match;
              });
            } else if (content.startsWith('"') && content.endsWith('"')) {
              content = content.slice(1, -1);
            }
            output += content + "\n";
            hasOutput = true;
          }
        } else if (trimmedLine.includes('=') && !trimmedLine.includes('print')) {
          // Обработка присваивания переменных
          continue;
        } else if (trimmedLine.includes('def ') || trimmedLine.includes('class ')) {
          // Обработка определений функций и классов
          continue;
        } else {
          // Неизвестная команда - ошибка
          setTerminalOutput(`NameError: name '${trimmedLine.split(' ')[0]}' is not defined`);
          setShowTerminal(true);
          return;
        }
      }
      
      if (!hasOutput) {
        output = "✅ Код выполнен без вывода";
      } else {
        output = output.trim();
      }
      
      setTerminalOutput(output);
      setShowTerminal(true);
    } catch (error) {
      setTerminalOutput(`Ошибка выполнения: ${error.message}`);
      setShowTerminal(true);
    }
  };

  const handleFinishPractice = async () => {
    // Сохраняем последний код
    const finalAnswers = [...practiceAnswers];
    finalAnswers[currentTaskIndex] = code;
    
    try {
      // Сохраняем в localStorage (поскольку backend не используется)
      const practiceData = {
        userId: 'current_user',
        course: 'Алгоритмизация',
        lessonId: 2,
        answers: finalAnswers,
        submissionDate: new Date().toISOString(),
        status: 'pending'
      };
      
      // Получаем существующие данные или создаем новый массив
      const existingData = JSON.parse(localStorage.getItem('practiceSubmissions') || '[]');
      existingData.push(practiceData);
      
      // Сохраняем в localStorage
      localStorage.setItem('practiceSubmissions', JSON.stringify(existingData));
      
      console.log('Практика сохранена в localStorage:', practiceData);
      
      // Показываем завершение
      setPracticeCompleted(true);
      
    } catch (error) {
      console.error('Ошибка при сохранении практики:', error);
      // Даже при ошибке показываем завершение
      setPracticeCompleted(true);
    }
  };

  // Функция для подсветки синтаксиса Python как в VS Code
  const highlightPythonCode = (code) => {
    const lines = code.split('\n');
    const highlightedLines = lines.map(line => {
      let highlightedLine = line;
      
      // Ключевые слова Python
      const keywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'in', 'range', 'len', 'print', 'return', 'True', 'False', 'None'];
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        highlightedLine = highlightedLine.replace(regex, `<span style="color: #569cd6;">${keyword}</span>`);
      });
      
      // Строки
      highlightedLine = highlightedLine.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #ce9178;">$1$2$1</span>');
      
      // Числа
      highlightedLine = highlightedLine.replace(/\b\d+(\.\d+)?\b/g, '<span style="color: #b5cea8;">$&</span>');
      
      // Комментарии
      highlightedLine = highlightedLine.replace(/(#.*)$/gm, '<span style="color: #6a9955;">$1</span>');
      
      return highlightedLine;
    });
    
    return highlightedLines.join('\n');
  };

  const handleStartTasks = () => {
    setShowTasks(true);
    setCurrentTask(0);
    setCode(tasks[0].initialCode);
    setTaskResults(tasks.map(task => ({ completed: false, error: null })));
  };

  const handleRunCodeFromTasks = (success, output) => {
    const newTaskResults = [...taskResults];
    newTaskResults[currentTask] = {
      completed: success,
      error: success ? null : output
    };
    setTaskResults(newTaskResults);

    if (success) {
      if (currentTask < tasks.length - 1) {
        setTimeout(() => {
          setCurrentTask(currentTask + 1);
          setCode(tasks[currentTask + 1].initialCode);
        }, 1000);
      } else {
        setTimeout(() => {
          setShowResults(true);
        }, 1000);
      }
>>>>>>> 706454d (ready for implementation)
    }
  }, [user]);

<<<<<<< HEAD
  const handleRunCode = (isSuccess, result) => {
    // Проверяем текущее задание
    const task = tasks[currentTask];
    
    // Обновляем статус задания на основе результата выполнения
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === task.id 
          ? {
              ...t,
              status: isSuccess ? 'passed' : 'failed',
              gainedPoints: isSuccess ? task.maxPoints : Math.floor(task.maxPoints * 0.3),
              userAnswer: code,
              errorExplanation: isSuccess ? '' : result || 'Ошибка выполнения кода'
            }
          : t
      )
    );
    
    console.log('Задание проверено:', task.title, 'Статус:', isSuccess ? 'passed' : 'failed');
    console.log('Все задания:', tasks.map(t => ({ title: t.title, status: t.status })));
    
    // Показываем toast
    setToast({
      message: isSuccess ? 'Задание выполнено правильно!' : 'Найдены ошибки в коде',
      type: isSuccess ? 'success' : 'error',
      duration: 3000
    });
=======
  const handleCodeChange = (newCode, forceUpdateFunction) => {
    setCode(newCode);
    setForceUpdateCodeRef(() => forceUpdateFunction);
  };

  const saveLessonProgress = () => {
    // Сохраняем прогресс урока
    const lessonProgress = {
      lessonId: 2,
      completed: true,
      testScore: testScore > 0 ? testScore : Math.round(Math.random() * 40 + 60), // Используем реальный балл или симуляцию
      practiceScore: Math.round((practiceAnswers.filter(answer => answer.trim() !== '').length / practiceAnswers.length) * 100),
      completedAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    const existingProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const updatedProgress = existingProgress.filter(p => p.lessonId !== 2);
    updatedProgress.push(lessonProgress);
    localStorage.setItem('lessonProgress', JSON.stringify(updatedProgress));

    // Обновляем прогресс курса
    const completedLessons = updatedProgress.length;
    const totalLessons = 2; // У нас 2 урока
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    console.log('Сохранение прогресса урока 2:', {
      lessonProgress,
      completedLessons,
      totalLessons,
      newCourseProgress
    });
    
    // Сохраняем прогресс курса
    localStorage.setItem('courseProgress', JSON.stringify({
      courseId: 1,
      progress: newCourseProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons
    }));
  };

  const handleBackToLessons = () => {
    // Сохраняем прогресс перед переходом
    saveLessonProgress();
    
    if (onPageChange) {
      onPageChange('programming-basics');
    }
  };

  const handleBackToLessonsFromResults = () => {
    // Сохраняем прогресс урока
    const lessonProgress = {
      lessonId: 2,
      completed: true,
      testScore: Math.round(Math.random() * 40 + 60), // Симуляция балла тестирования (60-100%)
      practiceScore: Math.round((taskResults.filter(t => t.completed).length / taskResults.length) * 100),
      completedAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    const existingProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const updatedProgress = existingProgress.filter(p => p.lessonId !== 2);
    updatedProgress.push(lessonProgress);
    localStorage.setItem('lessonProgress', JSON.stringify(updatedProgress));

    // Обновляем прогресс курса
    const completedLessons = updatedProgress.length;
    const totalLessons = 2; // У нас 2 урока
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    // Сохраняем прогресс курса
    localStorage.setItem('courseProgress', JSON.stringify({
      courseId: 1,
      progress: newCourseProgress,
      completedLessons: completedLessons,
      totalLessons: totalLessons
    }));

    // Возвращаемся к урокам курса
    onPageChange('programming-basics');
>>>>>>> 706454d (ready for implementation)
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
  };

<<<<<<< HEAD
  const handleNextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setCode(tasks[currentTask + 1].initialCode);
    }
  };

  const handlePrevTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
      setCode(tasks[currentTask - 1].userAnswer || tasks[currentTask - 1].initialCode);
    }
  };

  const handleSubmitResults = async () => {
    const allChecked = tasks.every(t => t.status !== 'pending');
    
    if (!allChecked) {
      setToast({
        message: 'Проверьте все задания перед завершением урока',
        type: 'error',
        duration: 3000
      });
      return;
    }

    const totalMaxPoints = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const totalGainedPoints = tasks.reduce((s, t) => s + t.gainedPoints, 0);
    const passed = tasks.filter(t => t.status === 'passed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const percent = Math.round((totalGainedPoints / totalMaxPoints) * 100);

    // Симуляция отправки результатов
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Показываем результаты
      setShowResults(true);
      
      // Показываем toast
      setToast({
        message: 'Результаты отправлены. Баллы появятся в журнале через несколько минут.',
        type: 'success',
        duration: 5000
      });

      // Добавляем уведомление
      addNotification(
        user.id,
        'grade',
        'Новый результат в журнале',
        `Практика по Алгоритмизации - Урок 2: ${totalGainedPoints}/${totalMaxPoints}. Нажмите, чтобы открыть.`,
        1,
        2
      );

    } catch (error) {
      setToast({
        message: 'Ошибка при отправке результатов',
        type: 'error',
        duration: 3000
      });
    }
  };

  const handleBackToLessons = () => {
    if (onPageChange) {
      onPageChange('programming-basics');
    }
  };

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    
    // Обновляем прогресс секции для всех разделов
    if (user) {
      updateLessonProgress(user.id, 'algorithms', 2, section);
      
      // Обновляем локальное состояние прогресса
      const updatedProgress = getLessonProgress(user.id, 'algorithms', 2);
      setLessonProgress(updatedProgress);
      
      // Показываем toast при завершении урока
      if (updatedProgress.completed && !lessonProgress?.completed) {
        setToast({
          message: 'Поздравляем! Урок завершен!',
          type: 'success',
          duration: 5000
        });
      }
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen pt-20 sm:pt-24">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>

=======
  const handleCodeChangeFromInput = (e) => {
    setCode(e.target.value);
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
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Назад к урокам</span>
        </motion.button>
      </motion.div>

>>>>>>> 706454d (ready for implementation)
      {/* Lesson Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-12 px-4 sm:px-6"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Переменные и типы данных
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Изучите как хранить и обрабатывать информацию в программах
        </p>
      </motion.div>

      {/* Section Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <motion.button
              onClick={() => handleSectionChange('video')}
=======
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Урок 2. {lessonData.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
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
                        <div className="text-sm font-medium">Переменные и типы данных в Python</div>
                        <div className="text-xs text-white/80">18:45</div>
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
                    
                    <div className="prose max-w-none">
                      {lessonData.theory.content.split('\n').map((line, index) => {
                        if (line.trim().startsWith('    ')) {
                          // Это код - выделяем его
                          return (
                            <div key={index} className="bg-gray-900 text-green-400 font-mono p-4 rounded-lg border border-gray-700 my-3 shadow-lg">
                              <div className="flex">
                                <div className="flex flex-col text-gray-500 text-xs w-6 text-right mr-3">
                                  {line.split('\n').map((_, idx) => (
                                    <div key={idx}>{idx + 1}</div>
                                  ))}
                                </div>
                                <div className="flex-1">
                                  {line.split('\n').map((codeLine, codeIdx) => (
                                    <div key={codeIdx} dangerouslySetInnerHTML={{ __html: highlightPythonCode(codeLine) }} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Обычный текст
                          return (
                            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                              {line}
                            </p>
                          );
                        }
                      })}
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

                    {isTestActive && !testCompleted && (
                      <div className="space-y-6">
                        {/* Timer */}
                        <div className="flex justify-between items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">
                              Осталось времени: {Math.floor(testTimeLeft / 60)}:{(testTimeLeft % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>

                        {/* Question Navigation */}
                        <div className="flex flex-wrap gap-2">
                          {testQuestions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentQuestion(index)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                index === currentQuestion
                                  ? 'bg-blue-600 text-white'
                                  : userAnswers[index + 1] !== undefined
                                  ? 'bg-gray-300 text-gray-800 border border-gray-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>

                        {/* Progress */}
                        <div className="text-center">
                          <p className="text-gray-600">
                            Вопрос {currentQuestion + 1} из {testQuestions.length}
                          </p>
                        </div>

                        {/* Question */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {testQuestions[currentQuestion].question}
                          </h3>
                          <div className="space-y-3">
                            {testQuestions[currentQuestion].options.map((option, index) => (
                              <label key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`question-${testQuestions[currentQuestion].id}`}
                                  value={index}
                                  checked={userAnswers[testQuestions[currentQuestion].id] === index}
                                  onChange={() => handleAnswerSelect(testQuestions[currentQuestion].id, index)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between">
                          <button
                            onClick={prevQuestion}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                          >
                            ← Предыдущий
                          </button>
                          
                          {currentQuestion === testQuestions.length - 1 ? (
                            <button
                              onClick={finishTest}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Завершить тест
                            </button>
                          ) : (
                            <button
                              onClick={nextQuestion}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Следующий →
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {testCompleted && (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Тестирование завершено!
                        </h3>
                        <p className="text-gray-700 mb-4">
                          Ваш результат: {testScore}%
                        </p>
                        <p className={`text-lg font-medium mb-6 ${
                          testScore >= 50 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testScore >= 50 ? 'Ответ записан' : 'Нужно повторить материал'}
                        </p>
                        
                        {testScore >= 50 ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentSection('practice')}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
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
                              startTest();
                            }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
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
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Решение задач</h2>
                    </div>
                    
                    {!practiceCompleted ? (
                      <div className="space-y-6">
                        {/* Task Navigation */}
                        <div className="flex flex-wrap gap-2">
                          {practiceTasks.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                // Сохраняем текущий код
                                setPracticeAnswers(prev => {
                                  const updated = [...prev];
                                  updated[currentTaskIndex] = code;
                                  return updated;
                                });
                                // Переключаемся на задание
                                setCurrentTaskIndex(index);
                                setCode(practiceAnswers[index] || practiceTasks[index].starterCode);
                                setShowTerminal(false);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                index === currentTaskIndex
                                  ? 'bg-blue-600 text-white'
                                  : practiceAnswers[index] && practiceAnswers[index].trim() !== ''
                                  ? 'bg-gray-300 text-gray-800 border border-gray-400'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>

                        {/* Current Task */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Задание {currentTaskIndex + 1}: {practiceTasks[currentTaskIndex].title}
                          </h3>
                          <p className="text-gray-700 mb-4">
                            {practiceTasks[currentTaskIndex].description}
                          </p>
                        </div>

                        {/* Code Editor */}
                        <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden">
                          <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                            <span className="text-gray-300 text-sm font-medium">main.py</span>
                            <button
                              onClick={handleRunCode}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              ▶ Запустить
                            </button>
                          </div>
                          <div className="p-4">
                            <div className="flex">
                              <div className="flex flex-col text-gray-500 text-xs w-6 text-right mr-3">
                                {code.split('\n').map((_, idx) => (
                                  <div key={idx}>{idx + 1}</div>
                                ))}
                              </div>
                              <textarea
                                value={code}
                                onChange={handleCodeChangeFromInput}
                                className="flex-1 bg-transparent text-green-400 font-mono text-sm resize-none outline-none caret-green-400"
                                style={{
                                  minHeight: '200px',
                                  maxHeight: '500px',
                                  height: `${Math.max(200, code.split('\n').length * 20)}px`
                                }}
                                placeholder="Введите ваш код здесь..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Terminal */}
                        {showTerminal && (
                          <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden">
                            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700">
                              <span className="text-gray-300 text-sm font-medium">Terminal Python 3.x</span>
                            </div>
                            <div 
                              className="p-4 text-green-400 font-mono text-sm whitespace-pre-wrap"
                              style={{
                                minHeight: '100px',
                                maxHeight: '300px',
                                height: `${Math.max(100, terminalOutput.split('\n').length * 20)}px`,
                                overflowY: 'auto'
                              }}
                            >
                              {terminalOutput}
                            </div>
                          </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between">
                          <button
                            onClick={() => handleTaskNavigation('prev')}
                            disabled={currentTaskIndex === 0}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                          >
                            ⬅ Назад
                          </button>
                          
                          {currentTaskIndex === practiceTasks.length - 1 ? (
                            <button
                              onClick={handleFinishPractice}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Завершить практику
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTaskNavigation('next')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              Далее ➡
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                          Практика успешно завершена!
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
                          <p className="text-green-800 text-lg mb-3">
                            Ваш ответ записан
                          </p>
                          <p className="text-green-700 mb-2">
                            • Все задания сохранены в системе
                          </p>
                          <p className="text-green-700 mb-2">
                            • Баллы будут выставлены позже
                          </p>
                          <p className="text-green-700">
                            • Результаты появятся в вашем журнале
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            // Сохраняем прогресс и возвращаемся к урокам
                            saveLessonProgress();
                            onPageChange('programming-basics');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors duration-200"
                        >
                          Вернуться к урокам
                        </motion.button>
                      </div>
                    )}
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
>>>>>>> 706454d (ready for implementation)
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
<<<<<<< HEAD
                Видео
              </span>
            </motion.button>
            
            <motion.button
              onClick={() => handleSectionChange('theory')}
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
                <BookOpen className={`w-3 h-3 ${
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
              onClick={() => handleSectionChange('practice')}
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
        </div>
      </motion.div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        {/* Video Section */}
        {currentSection === 'video' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Play className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Видеоурок</h2>
            </div>
            
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-6">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <p className="text-lg font-medium">Видео "Переменные и типы данных"</p>
                <p className="text-sm opacity-70 mt-2">Длительность: 10 минут</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Что вы изучите:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Что такое переменные и как их создавать
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Основные типы данных: числа, строки, логические значения
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Арифметические операции с числами
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Работа со строками и форматирование
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Theory Section */}
        {currentSection === 'theory' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Теория</h2>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Что такое переменные?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Переменная</strong> — это именованная область памяти для хранения данных. 
                В Python переменные создаются автоматически при присваивании значения.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные типы данных:</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Числа (int, float)</h4>
                  <p className="text-gray-700 mb-2">Целые и дробные числа для математических операций.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    age = 25<br/>
                    price = 99.99<br/>
                    result = age + price
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Строки (str)</h4>
                  <p className="text-gray-700 mb-2">Текстовые данные в кавычках.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    name = "Анна"<br/>
                    message = f"Привет, {name}!"<br/>
                    print(message)
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Логические значения (bool)</h4>
                  <p className="text-gray-700 mb-2">True или False для условий.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    is_student = True<br/>
                    is_working = False<br/>
                    if is_student: print("Студент")
                  </code>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Practice Section */}
        {currentSection === 'practice' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Code className="w-6 h-6 text-green-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Практика</h2>
            </div>

            {/* Task Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Задание {currentTask + 1} из {tasks.length}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {tasks[currentTask].title}
              </h3>
              <p className="text-gray-700">
                {tasks[currentTask].description}
              </p>
            </div>

            {/* Code Editor */}
            <CodeRunner
              initialCode={code}
              onCodeChange={handleCodeChange}
              onRunResult={handleRunCode}
            />

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <motion.button
                onClick={handlePrevTask}
                disabled={currentTask === 0}
                className={`flex-1 px-6 py-3 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${
                  currentTask === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                whileHover={currentTask > 0 ? { scale: 1.02 } : {}}
                whileTap={currentTask > 0 ? { scale: 0.98 } : {}}
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </motion.button>
              
              {currentTask === tasks.length - 1 ? (
                <motion.button
                  onClick={handleSubmitResults}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Trophy className="w-4 h-4" />
                  Показать результаты
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNextTask}
                  className="flex-1 px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Далее
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Modal */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Результаты практики
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Итоги</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tasks.filter(t => t.status === 'passed').length}
                    </div>
                    <div className="text-sm text-gray-600">Правильно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => t.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-600">Неправильно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tasks.reduce((s, t) => s + t.gainedPoints, 0)} / {tasks.reduce((s, t) => s + t.maxPoints, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Баллы</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((tasks.reduce((s, t) => s + t.gainedPoints, 0) / tasks.reduce((s, t) => s + t.maxPoints, 0)) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Процент</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Детали по заданиям</h3>
                {tasks.map((task, index) => (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Задание {index + 1}: {task.title}</h4>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'passed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {task.status === 'passed' ? 'Выполнено' : 'Ошибка'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Баллы: {task.gainedPoints} / {task.maxPoints}
                    </div>
                    {task.errorExplanation && (
                      <div className="text-sm text-red-600 mt-2">
                        {task.errorExplanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  Ваши баллы будут добавлены в журнал в течение нескольких минут.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <motion.button
                  onClick={() => setShowResults(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Закрыть
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowResults(false);
                    onPageChange && onPageChange('journal');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Перейти в журнал
                </motion.button>
=======
                Видеоурок
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
                    onClick={() => setCurrentSection('testing')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === 'testing'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentSection === 'testing' ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                      <FileText className={`w-3 h-3 ${
                  currentSection === 'testing' ? 'text-white' : 'text-gray-600'
                }`} />
>>>>>>> 706454d (ready for implementation)
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'testing' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Тестирование
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
                Решение задач
              </span>
            </motion.button>
                </div>
              </motion.div>

            </div>
<<<<<<< HEAD
          </motion.div>
        </motion.div>
      )}
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}
=======
          </div>
        </div>
      </section>
>>>>>>> 706454d (ready for implementation)
    </div>
  );
};

export default Lesson2;