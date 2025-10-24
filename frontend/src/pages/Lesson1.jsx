import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Code, Lightbulb, FileText, Star, Trophy } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { updateUserProgress, saveGrade, addNotification, updateLessonProgress, getLessonProgress } from '../utils/auth.js';
import Toast from '../components/Toast.jsx';
import CodeRunner from '../components/CodeRunner.jsx';
import BackButton from '../components/BackButton.jsx';

const Lesson1 = ({ onPageChange }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState('video'); // 'video', 'theory', or 'practice'
  const [currentTask, setCurrentTask] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [lessonGrade, setLessonGrade] = useState(null);
  const [taskResults, setTaskResults] = useState([]);
  const [toast, setToast] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Вывод чисел от 1 до 5',
      description: 'Напишите алгоритм, который выводит числа от 1 до 5',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Напишите алгоритм, который выводит числа от 1 до 5
for i in range(1, 6):
    print(i)`
    },
    {
      id: 'task-2', 
      title: 'Проверка четности числа',
      description: 'Напишите программу, которая проверяет, является ли число четным',
      userAnswer: '',
      status: 'pending',
      maxPoints: 30,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Проверка четности числа
number = int(input("Введите число: "))
if number % 2 == 0:
    print("Число четное")
else:
    print("Число нечетное")`
    },
    {
      id: 'task-3',
      title: 'Сумма элементов списка', 
      description: 'Напишите программу, которая вычисляет сумму всех элементов списка',
      userAnswer: '',
      status: 'pending',
      maxPoints: 40,
      gainedPoints: 0,
      errorExplanation: '',
      initialCode: `# Вычисление суммы элементов списка
numbers = [1, 2, 3, 4, 5]
total = 0
for num in numbers:
    total += num
print(f"Сумма: {total}")`
    }
  ]);
  const [code, setCode] = useState(tasks[0].initialCode);

  // Загружаем прогресс урока при монтировании компонента
  React.useEffect(() => {
    if (user) {
      const progress = getLessonProgress(user.id, 'algorithms', 1);
      setLessonProgress(progress);
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
>>>>>>> 706454d (ready for implementation)
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
  };

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

<<<<<<< HEAD
    const totalMaxPoints = tasks.reduce((s, t) => s + t.maxPoints, 0);
    const totalGainedPoints = tasks.reduce((s, t) => s + t.gainedPoints, 0);
    const passed = tasks.filter(t => t.status === 'passed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const percent = Math.round((totalGainedPoints / totalMaxPoints) * 100);
=======
    // Если синтаксис правильный, выполняем код
    try {
      let output = "";
      let hasOutput = false;
      
      // Простая симуляция выполнения Python кода
      const lines = code.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Пропускаем пустые строки и комментарии
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
          continue;
        }
        
        if (trimmedLine.startsWith('print(') && trimmedLine.endsWith(')')) {
          hasOutput = true;
          // Извлекаем содержимое print()
          const content = trimmedLine.slice(6, -1);
          if (content.startsWith('"') && content.endsWith('"')) {
            output += content.slice(1, -1) + '\n';
          } else if (content.startsWith("'") && content.endsWith("'")) {
            output += content.slice(1, -1) + '\n';
          } else {
            // Обработка выражений в print()
            if (content.includes('+')) {
              const parts = content.split('+');
              if (parts.length === 2) {
                const left = parts[0].trim();
                const right = parts[1].trim();
                if (left.startsWith('"') && right.startsWith('"')) {
                  const leftStr = left.slice(1, -1);
                  const rightStr = right.slice(1, -1);
                  output += leftStr + rightStr + '\n';
                } else if (!isNaN(left) && !isNaN(right)) {
                  output += (parseInt(left) + parseInt(right)) + '\n';
                } else {
                  output += content + '\n';
                }
              } else {
                output += content + '\n';
              }
            } else if (content.includes('*')) {
              const parts = content.split('*');
              if (parts.length === 2) {
                const left = parts[0].trim();
                const right = parts[1].trim();
                if (left.startsWith('"') && !isNaN(right)) {
                  const str = left.slice(1, -1);
                  const count = parseInt(right);
                  output += str.repeat(count) + '\n';
                } else if (!isNaN(left) && !isNaN(right)) {
                  output += (parseInt(left) * parseInt(right)) + '\n';
                } else {
                  output += content + '\n';
                }
              } else {
                output += content + '\n';
              }
            } else if (content.includes('len(')) {
              const strContent = content.slice(4, -1);
              if (strContent.startsWith('"') && strContent.endsWith('"')) {
                const str = strContent.slice(1, -1);
                output += str.length + '\n';
              } else if (strContent.startsWith("'") && strContent.endsWith("'")) {
                const str = strContent.slice(1, -1);
                output += str.length + '\n';
              } else {
                output += content + '\n';
              }
            } else {
              output += content + '\n';
            }
          }
        } else if (trimmedLine.includes('for ') && trimmedLine.includes('range(')) {
          hasOutput = true;
          // Обработка циклов for
          const rangeMatch = trimmedLine.match(/range\((\d+),\s*(\d+)\)/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            for (let i = start; i < end; i++) {
              output += i + '\n';
            }
          }
        } else if (trimmedLine.includes('while ') && trimmedLine.includes('<=')) {
          hasOutput = true;
          // Обработка циклов while
          const whileMatch = trimmedLine.match(/while\s+(\w+)\s*<=\s*(\d+)/);
          if (whileMatch) {
            const varName = whileMatch[1];
            const limit = parseInt(whileMatch[2]);
            for (let i = 1; i <= limit; i++) {
              output += i + '\n';
            }
          }
        } else if (trimmedLine.includes('if ') && trimmedLine.includes('>')) {
          hasOutput = true;
          // Обработка условий
          const ifMatch = trimmedLine.match(/if\s+(\w+)\s*>\s*(\d+)/);
          if (ifMatch) {
            const varName = ifMatch[1];
            const value = parseInt(ifMatch[2]);
            output += "Число больше " + value + "\n";
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
>>>>>>> 706454d (ready for implementation)

    // Симуляция отправки результатов
    try {
<<<<<<< HEAD
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
        `Практика по Алгоритмизации - Урок 1: ${totalGainedPoints}/${totalMaxPoints}. Нажмите, чтобы открыть.`,
        1,
        1
      );

    } catch (error) {
      setToast({
        message: 'Ошибка при отправке результатов',
        type: 'error',
        duration: 3000
      });
=======
      // Сохраняем в localStorage (поскольку backend не используется)
      const practiceData = {
        userId: 'current_user',
        course: 'Алгоритмизация',
        lessonId: 1,
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
      let highlighted = line;
      
      // Подсветка строк в кавычках - оранжевый
      highlighted = highlighted.replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #ce9178;">$&</span>');
      
      // Подсветка ключевых слов - синий
      highlighted = highlighted.replace(/\bprint\b/g, '<span style="color: #569cd6;">print</span>');
      highlighted = highlighted.replace(/\bif\b/g, '<span style="color: #569cd6;">if</span>');
      highlighted = highlighted.replace(/\belse\b/g, '<span style="color: #569cd6;">else</span>');
      highlighted = highlighted.replace(/\belif\b/g, '<span style="color: #569cd6;">elif</span>');
      highlighted = highlighted.replace(/\bfor\b/g, '<span style="color: #569cd6;">for</span>');
      highlighted = highlighted.replace(/\bwhile\b/g, '<span style="color: #569cd6;">while</span>');
      highlighted = highlighted.replace(/\bin\b/g, '<span style="color: #569cd6;">in</span>');
      highlighted = highlighted.replace(/\brange\b/g, '<span style="color: #569cd6;">range</span>');
      highlighted = highlighted.replace(/\blen\b/g, '<span style="color: #569cd6;">len</span>');
      highlighted = highlighted.replace(/\bdef\b/g, '<span style="color: #569cd6;">def</span>');
      highlighted = highlighted.replace(/\breturn\b/g, '<span style="color: #569cd6;">return</span>');
      
      // Подсветка операторов - белый
      highlighted = highlighted.replace(/[+\-*/=<>!&|]/g, '<span style="color: #d4d4d4;">$&</span>');
      
      // Подсветка чисел - голубой
      highlighted = highlighted.replace(/\b\d+\b/g, '<span style="color: #b5cea8;">$&</span>');
      
      // Подсветка комментариев - серый
      highlighted = highlighted.replace(/#.*$/g, '<span style="color: #6a9955;">$&</span>');
      
      return highlighted;
    });
    
    return highlightedLines.join('\n');
  };


  const lessonData = {
    id: 1,
    title: "Введение в языки программирования. Классификация языков программирования. Язык программирования Python. Выбор среды разработки",
    description: "",
    theory: {
      title: "Что такое программирование?",
      content: `Программирование — это процесс создания компьютерных программ. Программа — это набор инструкций, которые компьютер может выполнить для решения определенной задачи.

Установка Python:

1. Скачайте Python с официального сайта python.org
2. Запустите установщик и следуйте инструкциям
3. Убедитесь, что галочка "Add Python to PATH" отмечена
4. Проверьте установку командой: python --version

Установка VS Code:

1. Скачайте VS Code с официального сайта code.visualstudio.com
2. Установите расширение Python
3. Создайте файл с расширением .py
4. Напишите код и нажмите F5 для запуска

Что такое Python?

Python — это простой язык программирования для начинающих. Он имеет понятный синтаксис и подходит для изучения основ программирования.

Преимущества Python:
• Простой синтаксис
• Много готовых библиотек
• Подходит для начинающих

Пример простой программы:

    print("Привет!")

Пример с переменной:

    имя = "Анна"
    print(имя)

Основные принципы программирования:

1. Алгоритмическое мышление
Алгоритм — это пошаговая инструкция для решения задачи. Например, алгоритм приготовления чая:
• Вскипятить воду
• Положить чай в чашку
• Залить кипятком
• Подождать 3 минуты
• Добавить сахар по вкусу

2. Логика
Программирование требует логического мышления. Компьютер выполняет команды строго по порядку и не понимает двусмысленности.

3. Структурированность
Хороший код организован и понятен. Используйте отступы, комментарии и понятные имена переменных.

Типы данных в Python:

• Строки (str) — текст в кавычках: "Привет", 'Мир'
• Числа (int) — целые числа: 1, 25, -10, 0
• Дробные числа (float) — числа с точкой: 3.14, 2.5, -1.0
• Логические (bool) — True или False

Работа с переменными:

Переменная — это контейнер для хранения данных. В Python переменные создаются автоматически при присваивании значения.

    имя = "Анна"
    возраст = 20
    рост = 165.5
    студент = True

Арифметические операции:

    a = 15
    b = 3
    
    print(a + b)    # Сложение: 18
    print(a - b)    # Вычитание: 12
    print(a * b)    # Умножение: 45
    print(a / b)    # Деление: 5.0
    print(a // b)   # Целочисленное деление: 5
    print(a % b)    # Остаток от деления: 0
    print(a ** b)   # Возведение в степень: 3375

Работа со строками:

    имя = "Иван"
    фамилия = "Петров"
    
    # Объединение строк
    полное_имя = имя + " " + фамилия
    print(полное_имя)  # Иван Петров
    
    # Повторение строки
    print(имя * 3)  # ИванИванИван
    
    # Длина строки
    print(len(имя))  # 4

Условные операторы:

Условия позволяют программе принимать решения в зависимости от ситуации.

    возраст = 17
    
    if возраст >= 18:
        print("Вы совершеннолетний")
        print("Можете голосовать")
    elif возраст >= 16:
        print("Вы можете работать")
        print("Но не можете голосовать")
    else:
        print("Вы несовершеннолетний")
        print("Нужно разрешение родителей")

Циклы в Python:

Циклы позволяют повторять действия несколько раз.

# Цикл for — повторение определенное количество раз
    print("Счет от 1 до 5:")
    for i in range(1, 6):
        print(i)

# Цикл while — повторение пока условие истинно
    счетчик = 0
    while счетчик < 3:
        print("Шаг", счетчик + 1)
        счетчик += 1

Работа со списками:

Список — это коллекция элементов в определенном порядке.

    # Создание списка
    фрукты = ["яблоко", "банан", "апельсин"]
    числа = [1, 2, 3, 4, 5]
    
    # Обращение к элементам
    print(фрукты[0])    # Первый элемент: яблоко
    print(фрукты[-1])   # Последний элемент: апельсин
    
    # Добавление элементов
    фрукты.append("виноград")
    print(фрукты)  # ["яблоко", "банан", "апельсин", "виноград"]

Функции в Python:

Функция — это блок кода, который можно вызывать многократно.

    def приветствие(имя):
        print("Привет,", имя + "!")
        print("Добро пожаловать в мир программирования!")
    
    # Вызов функции
    приветствие("Анна")
    приветствие("Петр")

Ошибки в программировании:

• Синтаксические ошибки — неправильный синтаксис кода
• Ошибки времени выполнения — ошибки при выполнении программы
• Логические ошибки — программа работает, но дает неправильный результат

Как избежать ошибок:

• Внимательно читайте сообщения об ошибках
• Тестируйте код на простых примерах
• Используйте отладчик в VS Code
• Читайте документацию Python
• Пишите комментарии к сложным частям кода

Первая программа

Традиционно первой программой является "Hello World" — простая программа, которая выводит приветствие. Это позволяет убедиться, что среда разработки настроена правильно.`
    },
    practice: {
      title: "Практическое задание",
      description: "Создайте свою первую программу 'Hello World'",
      task: `Задание 1: Hello World

Создайте программу, которая выводит на экран сообщение "Hello, World!".

Требования:
1. Программа должна выводить текст "Hello, World!"
2. Добавьте комментарий с вашим именем
3. Попробуйте изменить сообщение на что-то свое

Пример кода на Python:

    # Меня зовут Анна
    print("Hello, World!")
    print("Я изучаю Python!")

Задание 2: Работа с переменными

Создайте программу, которая использует переменные для хранения информации о себе.

Требования:
1. Создайте переменные для имени, возраста и города
2. Выведите информацию о себе
3. Попробуйте изменить значения переменных

Пример кода:

    имя = "Анна"
    возраст = 20
    город = "Москва"
    
    print("Меня зовут", имя)
    print("Мне", возраст, "лет")
    print("Я живу в городе", город)

Задание 3: Арифметические операции

Создайте программу, которая выполняет различные математические операции.

Требования:
1. Создайте две переменные с числами
2. Выполните все основные операции (+, -, *, /)
3. Выведите результаты на экран

Пример кода:

    a = 15
    b = 3
    
    print("Первое число:", a)
    print("Второе число:", b)
    print("Сложение:", a + b)
    print("Вычитание:", a - b)
    print("Умножение:", a * b)
    print("Деление:", a / b)

Задание 4: Работа со строками

Создайте программу, которая работает с текстом.

Требования:
1. Создайте переменные с именами и фамилиями
2. Объедините их в полное имя
3. Выведите длину имени

Пример кода:

    имя = "Иван"
    фамилия = "Петров"
    
    полное_имя = имя + " " + фамилия
    print("Полное имя:", полное_имя)
    print("Длина имени:", len(имя))
    print("Длина фамилии:", len(фамилия))

Задание 5: Условные операторы

Создайте программу, которая проверяет возраст и выводит соответствующее сообщение.

Требования:
1. Создайте переменную с возрастом
2. Используйте if-elif-else для проверки
3. Выведите разные сообщения для разных возрастов

Пример кода:

    возраст = 17
    
    if возраст >= 18:
        print("Вы совершеннолетний")
        print("Можете голосовать")
    elif возраст >= 16:
        print("Вы можете работать")
        print("Но не можете голосовать")
    else:
        print("Вы несовершеннолетний")
        print("Нужно разрешение родителей")

Задание 6: Циклы

Создайте программу, которая использует циклы для вывода чисел.

Требования:
1. Используйте цикл for для вывода чисел от 1 до 10
2. Используйте цикл while для обратного счета
3. Добавьте комментарии к коду

Пример кода:

    # Цикл for - счет от 1 до 10
    print("Счет от 1 до 10:")
    for i in range(1, 11):
        print(i)
    
    # Цикл while - обратный счет
    print("Обратный счет:")
    счетчик = 5
    while счетчик > 0:
        print(счетчик)
        счетчик -= 1
    print("Старт!")

Задание 7: Работа со списками

Создайте программу, которая работает со списком любимых предметов.

Требования:
1. Создайте список с предметами
2. Выведите все предметы
3. Добавьте новый предмет
4. Выведите количество предметов

Пример кода:

    предметы = ["математика", "физика", "химия"]
    
    print("Мои любимые предметы:")
    for предмет in предметы:
        print("-", предмет)
    
    предметы.append("информатика")
    print("Добавил информатику!")
    print("Всего предметов:", len(предметы))

Задание 8: Функции

Создайте функцию, которая приветствует пользователя.

Требования:
1. Создайте функцию приветствия
2. Функция должна принимать имя как параметр
3. Вызовите функцию несколько раз с разными именами

Пример кода:

    def приветствие(имя):
        print("Привет,", имя + "!")
        print("Добро пожаловать в мир программирования!")
        print("Удачи в изучении Python!")
    
    # Вызов функции
    приветствие("Анна")
    приветствие("Петр")
    приветствие("Мария")

Советы для выполнения заданий:

• Начинайте с простых заданий и постепенно усложняйте
• Не бойтесь экспериментировать с кодом
• Если что-то не работает, читайте сообщения об ошибках
• Используйте комментарии для объяснения кода
• Тестируйте код на разных значениях`
>>>>>>> 706454d (ready for implementation)
    }
  };

  const saveLessonProgress = () => {
    // Сохраняем прогресс урока
    const lessonProgress = {
      lessonId: 1,
      completed: true,
      testScore: testScore > 0 ? testScore : Math.round(Math.random() * 40 + 60), // Используем реальный балл или симуляцию
      practiceScore: Math.round((practiceAnswers.filter(answer => answer.trim() !== '').length / practiceAnswers.length) * 100),
      completedAt: new Date().toISOString()
    };

    // Сохраняем в localStorage
    const existingProgress = JSON.parse(localStorage.getItem('lessonProgress') || '[]');
    const updatedProgress = existingProgress.filter(p => p.lessonId !== 1);
    updatedProgress.push(lessonProgress);
    localStorage.setItem('lessonProgress', JSON.stringify(updatedProgress));

    // Обновляем прогресс курса
    const completedLessons = updatedProgress.length;
    const totalLessons = 2; // У нас 2 урока
    const newCourseProgress = Math.round((completedLessons / totalLessons) * 100);
    
    console.log('Сохранение прогресса урока 1:', {
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

  const handleSectionChange = (section) => {
    setCurrentSection(section);
    
    // Обновляем прогресс секции для всех разделов
    if (user) {
      updateLessonProgress(user.id, 'algorithms', 1, section);
      
      // Обновляем локальное состояние прогресса
      const updatedProgress = getLessonProgress(user.id, 'algorithms', 1);
      setLessonProgress(updatedProgress);
      
      // Показываем toast при завершении урока
      if (updatedProgress.completed && !lessonProgress?.completed) {
        setToast({
          message: 'Поздравляем! Урок завершен. Следующий урок разблокирован!',
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

      {/* Lesson Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 sm:mb-12 px-4 sm:px-6"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Введение в программирование
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
          Изучите основы программирования и алгоритмического мышления
        </p>
      </motion.div>

<<<<<<< HEAD
      {/* Section Navigation */}
=======
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
                        <div className="text-sm font-medium">Введение в языки программирования. Классификация языков программирования. Язык программирования Python. Выбор среды разработки</div>
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
                                  <div className="space-y-1">
                                    {codeLines.map((codeLine, idx) => (
                                      <div key={idx} className="flex items-center">
                                        <span className="text-gray-500 text-xs mr-4 w-6 text-right">{idx + 1}</span>
                                        <code 
                                          className="text-green-400"
                                          dangerouslySetInnerHTML={{ __html: highlightPythonCode(codeLine) }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else {
                              // Обычный текст
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
                    
                    <div className="text-center py-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Основы языка программирования Python
                      </h3>
                      <p className="text-gray-700 mb-4">
                        Пройдите интерактивный тест для проверки знаний по основам Python
                      </p>
                    </div>

                    {/* Wayground тест */}
                    <div style={{width:'100%',display:'flex',flexDirection:'column',gap:'8px',minHeight:'635px'}}>
                      <iframe 
                        src="https://wayground.com/embed/quiz/68faf5cea9f13847b19aeeef" 
                        title="Основы языка программирования Python - Wayground" 
                        style={{flex:'1'}} 
                        frameBorder="0" 
                        allowFullScreen
                        className="w-full rounded-lg"
                      />
                      <a 
                        href="https://wayground.com/admin?source=embedFrame" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-gray-700 text-center"
                      >
                        Explore more at Wayground.
                      </a>
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
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-gray-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Решение задач</h2>
                    </div>
                    
                    {!practiceCompleted ? (
                      <div>
                        {/* Навигация по заданиям */}
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-800 mb-3">
                            Задание {currentTaskIndex + 1} из {practiceTasks.length}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {practiceTasks.map((task, index) => (
                              <button
                                key={task.id}
                                onClick={() => {
                                  // Сохраняем текущий код
                                  setPracticeAnswers(prev => {
                                    const updated = [...prev];
                                    updated[currentTaskIndex] = code;
                                    return updated;
                                  });
                                  setCurrentTaskIndex(index);
                                  setCode(practiceAnswers[index] || task.starterCode);
                                  setShowTerminal(false);
                                }}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                  index === currentTaskIndex 
                                    ? 'bg-blue-600 text-white' 
                                    : practiceAnswers[index] && practiceAnswers[index].trim() !== ""
                                    ? 'bg-gray-300 text-gray-800 border border-gray-400'
                                    : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                }`}
                                title={`Задание ${index + 1}: ${task.title}`}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Текущее задание */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {practiceTasks[currentTaskIndex].title}
                          </h4>
                          <p className="text-gray-700">
                            {practiceTasks[currentTaskIndex].description}
                          </p>
                        </div>

                        {/* Редактор кода в стиле VS Code */}
                        <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden">
                          {/* Заголовок редактора */}
                          <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-sm">main.py</span>
                            </div>
                            <button
                              onClick={handleRunCode}
                              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              Запустить
                            </button>
                          </div>
                          
                          {/* Редактор с номерами строк */}
                          <div className="flex" style={{ minHeight: '200px', maxHeight: '500px' }}>
                            {/* Номера строк */}
                            <div className="bg-[#252526] text-gray-500 text-sm font-mono py-4 px-2 select-none">
                              {code.split('\n').map((_, index) => (
                                <div key={index} className="h-5 leading-5 text-right">
                                  {index + 1}
                                </div>
                              ))}
                            </div>
                            
                            {/* Код с подсветкой синтаксиса */}
                            <div className="flex-1 relative bg-[#1e1e1e]">
                              <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full bg-transparent text-green-400 font-mono text-sm p-4 resize-none focus:outline-none caret-green-400"
                                placeholder={practiceTasks[currentTaskIndex].starterCode}
                                style={{ 
                                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                  lineHeight: '20px',
                                  minHeight: '200px',
                                  maxHeight: '500px',
                                  height: `${Math.max(200, code.split('\n').length * 20 + 32)}px`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Терминал */}
                        {showTerminal && (
                          <div className="mt-4 bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden">
                            {/* Заголовок терминала */}
                            <div className="bg-[#2d2d2d] px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                              <span className="text-gray-400 text-sm">Terminal</span>
                              <span className="text-gray-500 text-xs">Python 3.x</span>
                            </div>
                            
                            {/* Вывод терминала */}
                            <div className={`p-4 overflow-auto whitespace-pre-wrap font-mono text-sm ${
                              terminalOutput.includes('SyntaxError') || terminalOutput.includes('Ошибка') || terminalOutput.includes('NameError')
                                ? 'text-red-400' 
                                : 'text-green-400'
                            }`} style={{ 
                              minHeight: '100px', 
                              maxHeight: '300px',
                              height: `${Math.max(100, terminalOutput.split('\n').length * 20 + 32)}px`
                            }}>
                              {terminalOutput}
                            </div>
                          </div>
                        )}

                        {/* Навигация */}
                        <div className="flex justify-between mt-6">
                          <button
                            onClick={() => handleTaskNavigation('prev')}
                            disabled={currentTaskIndex === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ⬅ Назад
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
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
>>>>>>> 706454d (ready for implementation)
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
<<<<<<< HEAD
              onClick={() => handleSectionChange('practice')}
=======
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
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'testing' ? 'text-blue-900' : 'text-gray-600'
              }`}>
                Тестирование
              </span>
            </motion.button>
            
            <motion.button
                    onClick={() => {
                      // Блокируем переход на практику во время тестирования
                      if (isTestActive && !testCompleted) {
                        return;
                      }
                      setCurrentSection('practice');
                    }}
>>>>>>> 706454d (ready for implementation)
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                currentSection === 'practice'
                  ? 'bg-blue-50 border border-blue-200'
                  : isTestActive && !testCompleted 
                    ? 'bg-gray-100 border border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-gray-50 hover:bg-gray-100'
              }`}
              whileHover={{ scale: isTestActive && !testCompleted ? 1 : 1.02 }}
              whileTap={{ scale: isTestActive && !testCompleted ? 1 : 0.98 }}
              disabled={isTestActive && !testCompleted}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentSection === 'practice' ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <Code className={`w-3 h-3 ${
                  currentSection === 'practice' ? 'text-white' : 'text-gray-600'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                currentSection === 'practice' ? 'text-blue-900' : 
                isTestActive && !testCompleted ? 'text-gray-400' : 'text-gray-600'
              }`}>
<<<<<<< HEAD
                Практика
=======
                Решение задач
                {isTestActive && !testCompleted && (
                  <span className="ml-2 text-xs text-gray-400">(заблокировано)</span>
                )}
>>>>>>> 706454d (ready for implementation)
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
                <p className="text-lg font-medium">Видео "Основы программирования"</p>
                <p className="text-sm opacity-70 mt-2">Длительность: 12 минут</p>
              </div>
            </div>
<<<<<<< HEAD
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Что вы изучите:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Что такое программа и алгоритм
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Как компьютер выполняет инструкции
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Логика и последовательность команд
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Основные шаги написания программы
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Что такое программирование?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Программирование</strong> — это процесс создания инструкций, которые компьютер может выполнять.
                Программа состоит из последовательности команд, которые определяют, что должен делать компьютер.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Основные принципы:</h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Алгоритмическое мышление</h4>
                  <p className="text-gray-700 mb-2">Разбиение сложных задач на простые шаги.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    1. Прочитать число<br/>
                    2. Проверить четность<br/>
                    3. Вывести результат
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Логика</h4>
                  <p className="text-gray-700 mb-2">Четкие и последовательные инструкции.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    if number % 2 == 0:<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;print("Четное")<br/>
                    else:<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;print("Нечетное")
                  </code>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Структурированность</h4>
                  <p className="text-gray-700 mb-2">Организованный и читаемый код.</p>
                  <code className="bg-gray-800 text-green-400 p-2 rounded text-sm block">
                    for i in range(1, 6):<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;print(i)
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
=======
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
>>>>>>> 706454d (ready for implementation)
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

<<<<<<< HEAD
      {/* Results Modal */}
      {showResults && (
        <motion.div
=======
          {/* Main Content */}
          <motion.div
>>>>>>> 706454d (ready for implementation)
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
<<<<<<< HEAD
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
                        {(() => {
                          const lines = lessonData.practice.task.split('\n');
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
                                  <div className="space-y-1">
                                    {codeLines.map((codeLine, idx) => (
                                      <div key={idx} className="flex items-center">
                                        <span className="text-gray-500 text-xs mr-4 w-6 text-right">{idx + 1}</span>
                                        <code 
                                          className="text-green-400"
                                          dangerouslySetInnerHTML={{ __html: highlightPythonCode(codeLine) }}
                                        />
                </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            } else {
                              // Обычный текст
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
>>>>>>> 706454d (ready for implementation)
              </div>
            </div>
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
    </div>
  );
};

export default Lesson1;