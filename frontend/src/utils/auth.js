// Мини база данных для аутентификации
const USERS_DB = 'educode_users';
const CURRENT_USER_DB = 'educode_current_user';
const COURSES_DB = 'educode_courses';
const NOTIFICATIONS_DB = 'educode_notifications';
const SUBMISSIONS_DB = 'educode_submissions';
const PROGRESS_DB = 'educode_progress';
const GRADES_DB = 'educode_grades';
const JOURNAL_DB = 'educode_journal';

// Предустановленные пользователи для тестирования
const DEFAULT_USERS = [
  {
    id: 1,
    email: 'admin@educode.com',
    password: 'admin123',
    fullName: 'Администратор EduCode',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    email: 'algoritmika@educode.com',
    password: 'algoritmika123',
    fullName: 'Алгоритмика Преподаватель',
    role: 'teacher',
    teacherId: 'teacher_algoritmika',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    email: 'database@educode.com',
    password: 'database123',
    fullName: 'База Данных Преподаватель',
    role: 'teacher',
    teacherId: 'teacher_database',
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    email: 'ict@educode.com',
    password: 'ict123',
    fullName: 'ИКТ Преподаватель',
    role: 'teacher',
    teacherId: 'teacher_ict',
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    email: 'teacher@educode.com',
    password: 'teacher123',
    fullName: 'Преподаватель',
    role: 'teacher',
    teacherId: 'teacher_main',
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    email: 'student@educode.com',
    password: 'student123',
    fullName: 'Алина',
    role: 'student',
    createdAt: new Date().toISOString()
  }
];

// Предустановленные курсы
const DEFAULT_COURSES = [
  {
    id: 1,
    title: 'Алгоритмизация',
    description: 'Основы программирования и алгоритмов',
    teacherId: 'teacher_algoritmika',
    teacherName: 'Алгоритмика Преподаватель',
    category: 'Программирование',
    status: 'active',
    lessons: [
      {
        id: 1,
        title: 'Введение в программирование',
        description: 'Основы алгоритмов и структур данных',
        content: 'В этом уроке мы изучим основы программирования...',
        videoUrl: '',
        tasks: [
          {
            id: 1,
            title: 'Сортировка массива',
            description: 'Реализуйте алгоритм сортировки пузырьком',
            initialCode: 'def bubble_sort(arr):\n    # Ваш код здесь\n    pass',
            expectedOutput: 'Отсортированный массив'
          }
        ]
      },
      {
        id: 2,
        title: 'Рекурсия',
        description: 'Изучаем рекурсивные алгоритмы',
        content: 'Рекурсия - это когда функция вызывает сама себя...',
        videoUrl: '',
        tasks: [
          {
            id: 2,
            title: 'Факториал',
            description: 'Напишите рекурсивную функцию для вычисления факториала',
            initialCode: 'def factorial(n):\n    # Ваш код здесь\n    pass',
            expectedOutput: 'Факториал числа'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'База данных',
    description: 'SQL и управление данными',
    teacherId: 'teacher_database',
    teacherName: 'База Данных Преподаватель',
    category: 'База данных',
    status: 'active',
    lessons: [
      {
        id: 3,
        title: 'Основы SQL',
        description: 'Изучаем язык запросов SQL',
        content: 'SQL - это язык для работы с базами данных...',
        videoUrl: '',
        tasks: [
          {
            id: 3,
            title: 'Создание таблиц',
            description: 'Создайте таблицу пользователей',
            initialCode: 'CREATE TABLE users (\n    -- Ваш код здесь\n);',
            expectedOutput: 'Таблица создана'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: 'ИКТ',
    description: 'Информационно-коммуникационные технологии',
    teacherId: 'teacher_ict',
    teacherName: 'ИКТ Преподаватель',
    category: 'ИКТ',
    status: 'active',
    lessons: [
      {
        id: 4,
        title: 'Введение в ИКТ',
        description: 'Основы информационных технологий',
        content: 'ИКТ включает в себя различные технологии...',
        videoUrl: '',
        tasks: [
          {
            id: 4,
            title: 'Создание презентации',
            description: 'Создайте презентацию на тему ИКТ',
            initialCode: '// Создайте презентацию\n// Используйте PowerPoint или аналоги',
            expectedOutput: 'Презентация готова'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  }
];

// Предустановленные уведомления
const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    teacherId: 'teacher_algoritmika',
    type: 'submission',
    title: 'Новое задание от студента',
    message: 'Алина отправила решение задачи "Сортировка массива"',
    studentName: 'Алина',
    courseTitle: 'Алгоритмизация',
    taskTitle: 'Сортировка массива',
    submissionId: 1,
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 2,
    teacherId: 'teacher_database',
    type: 'submission',
    title: 'Новое задание от студента',
    message: 'Максим отправил решение задачи "Создание таблиц"',
    studentName: 'Максим',
    courseTitle: 'База данных',
    taskTitle: 'Создание таблиц',
    submissionId: 2,
    timestamp: new Date().toISOString(),
    read: false
  }
];

// Предустановленные отправки заданий
const DEFAULT_SUBMISSIONS = [
  {
    id: 1,
    studentId: 5,
    studentName: 'Алина',
    courseId: 1,
    courseTitle: 'Алгоритмизация',
    lessonId: 1,
    taskId: 1,
    taskTitle: 'Сортировка массива',
    code: 'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr',
    originality: 95,
    aiCheck: 'passed',
    score: 85,
    feedback: '',
    status: 'pending',
    submittedAt: new Date().toISOString()
  },
  {
    id: 2,
    studentId: 5,
    studentName: 'Алина',
    courseId: 2,
    courseTitle: 'База данных',
    lessonId: 3,
    taskId: 3,
    taskTitle: 'Создание таблиц',
    code: 'CREATE TABLE users (\n    id INT PRIMARY KEY,\n    name VARCHAR(100),\n    email VARCHAR(100)\n);',
    originality: 88,
    aiCheck: 'warning',
    score: 0,
    feedback: '',
    status: 'pending',
    submittedAt: new Date().toISOString()
  }
];

// Инициализация базы данных
export const initDatabase = () => {
  const existingUsers = localStorage.getItem(USERS_DB);
  if (!existingUsers) {
    localStorage.setItem(USERS_DB, JSON.stringify(DEFAULT_USERS));
    console.log('📊 База данных пользователей инициализирована');
  } else {
    // Обновляем список пользователей, добавляя новых из DEFAULT_USERS
    const users = JSON.parse(existingUsers);
    const existingEmails = users.map(u => u.email);
    
    DEFAULT_USERS.forEach(defaultUser => {
      if (!existingEmails.includes(defaultUser.email)) {
        users.push(defaultUser);
        console.log(`✅ Добавлен новый пользователь: ${defaultUser.email}`);
      }
    });
    
    localStorage.setItem(USERS_DB, JSON.stringify(users));
  }

  const existingCourses = localStorage.getItem(COURSES_DB);
  if (!existingCourses) {
    localStorage.setItem(COURSES_DB, JSON.stringify(DEFAULT_COURSES));
    console.log('📚 База данных курсов инициализирована');
  }

  const existingNotifications = localStorage.getItem(NOTIFICATIONS_DB);
  if (!existingNotifications) {
    localStorage.setItem(NOTIFICATIONS_DB, JSON.stringify(DEFAULT_NOTIFICATIONS));
    console.log('🔔 База данных уведомлений инициализирована');
  }

  const existingSubmissions = localStorage.getItem(SUBMISSIONS_DB);
  if (!existingSubmissions) {
    localStorage.setItem(SUBMISSIONS_DB, JSON.stringify(DEFAULT_SUBMISSIONS));
    console.log('📝 База данных отправок инициализирована');
  }

  const existingProgress = localStorage.getItem(PROGRESS_DB);
  if (!existingProgress) {
    localStorage.setItem(PROGRESS_DB, JSON.stringify({}));
    console.log('📈 База данных прогресса инициализирована');
  }

  const existingGrades = localStorage.getItem(GRADES_DB);
  if (!existingGrades) {
    localStorage.setItem(GRADES_DB, JSON.stringify({}));
    console.log('📊 База данных оценок инициализирована');
  }
};

// Получить всех пользователей
export const getUsers = () => {
  const users = localStorage.getItem(USERS_DB);
  return users ? JSON.parse(users) : [];
};

// Получить все курсы
export const getCourses = () => {
  const courses = localStorage.getItem(COURSES_DB);
  return courses ? JSON.parse(courses) : [];
};

// Получить курсы преподавателя
export const getTeacherCourses = (teacherId) => {
  const courses = getCourses();
  return courses.filter(course => course.teacherId === teacherId);
};

// Получить курс по ID
export const getCourseById = (courseId) => {
  const courses = getCourses();
  return courses.find(course => course.id === parseInt(courseId));
};

// Обновить курс
export const updateCourse = (courseId, updatedCourse) => {
  const courses = getCourses();
  const index = courses.findIndex(course => course.id === parseInt(courseId));
  if (index !== -1) {
    courses[index] = { ...courses[index], ...updatedCourse };
    localStorage.setItem(COURSES_DB, JSON.stringify(courses));
    return true;
  }
  return false;
};

// Получить уведомления преподавателя
export const getTeacherNotifications = (teacherId) => {
  const notifications = localStorage.getItem(NOTIFICATIONS_DB);
  const allNotifications = notifications ? JSON.parse(notifications) : [];
  return allNotifications.filter(notification => notification.teacherId === teacherId);
};


// Получить отправки для преподавателя
export const getTeacherSubmissions = (teacherId) => {
  const submissions = localStorage.getItem(SUBMISSIONS_DB);
  const allSubmissions = submissions ? JSON.parse(submissions) : [];
  const courses = getCourses();
  const teacherCourses = courses.filter(course => course.teacherId === teacherId);
  const teacherCourseIds = teacherCourses.map(course => course.id);
  return allSubmissions.filter(submission => teacherCourseIds.includes(submission.courseId));
};

// Обновить отправку (оценка, обратная связь)
export const updateSubmission = (submissionId, updates) => {
  const submissions = localStorage.getItem(SUBMISSIONS_DB);
  const allSubmissions = submissions ? JSON.parse(submissions) : [];
  const index = allSubmissions.findIndex(s => s.id === submissionId);
  if (index !== -1) {
    allSubmissions[index] = { ...allSubmissions[index], ...updates };
    localStorage.setItem(SUBMISSIONS_DB, JSON.stringify(allSubmissions));
    return true;
  }
  return false;
};

// Найти пользователя по email
export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
};

// Проверить пароль
export const verifyPassword = (user, password) => {
  return user && user.password === password;
};

// Вход в систему
export const login = (email, password) => {
  const user = findUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }
  
  if (!verifyPassword(user, password)) {
    return { success: false, error: 'Неверный пароль' };
  }
  
  // Сохранить текущего пользователя
  localStorage.setItem(CURRENT_USER_DB, JSON.stringify(user));
  
  return { success: true, user };
};

// Регистрация нового пользователя
export const register = (email, password, fullName) => {
  const users = getUsers();
  
  // Проверить, существует ли пользователь
  if (findUserByEmail(email)) {
    return { success: false, error: 'Пользователь с таким email уже существует' };
  }
  
  // Создать нового пользователя
  const newUser = {
    id: Date.now(), // Простой ID
    email: email.toLowerCase(),
    password,
    fullName,
    role: 'student', // По умолчанию студент
    createdAt: new Date().toISOString()
  };
  
  // Добавить в базу
  users.push(newUser);
  localStorage.setItem(USERS_DB, JSON.stringify(users));
  
  // Автоматически войти
  localStorage.setItem(CURRENT_USER_DB, JSON.stringify(newUser));
  
  return { success: true, user: newUser };
};

// Получить текущего пользователя
export const getCurrentUser = () => {
  const user = localStorage.getItem(CURRENT_USER_DB);
  return user ? JSON.parse(user) : null;
};

// Выход из системы
export const logout = () => {
  localStorage.removeItem(CURRENT_USER_DB);
  return { success: true };
};

// Проверить, авторизован ли пользователь
export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

// Получить роль пользователя
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Проверить, является ли пользователь админом
export const isAdmin = () => {
  return getUserRole() === 'admin';
};

// Обновить данные пользователя
export const updateUser = (userId, updates) => {
  const users = getUsers();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'Пользователь не найден' };
  }
  
  // Обновить данные
  users[userIndex] = { ...users[userIndex], ...updates };
  localStorage.setItem(USERS_DB, JSON.stringify(users));
  
  // Обновить текущего пользователя, если это он
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    localStorage.setItem(CURRENT_USER_DB, JSON.stringify(users[userIndex]));
  }
  
  return { success: true, user: users[userIndex] };
};

// Удалить пользователя (только для админов)
export const deleteUser = (userId) => {
  if (!isAdmin()) {
    return { success: false, error: 'Недостаточно прав' };
  }
  
  const users = getUsers();
  const filteredUsers = users.filter(user => user.id !== userId);
  
  if (filteredUsers.length === users.length) {
    return { success: false, error: 'Пользователь не найден' };
  }
  
  localStorage.setItem(USERS_DB, JSON.stringify(filteredUsers));
  
  // Если удаляем текущего пользователя, выйти из системы
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    logout();
  }
  
  return { success: true };
};

// Получить статистику пользователей
export const getUserStats = () => {
  const users = getUsers();
  const stats = {
    total: users.length,
    admins: users.filter(user => user.role === 'admin').length,
    students: users.filter(user => user.role === 'student').length,
    regular: users.filter(user => user.role === 'user').length
  };
  return stats;
};

// Экспорт базы данных (для бэкапа)
export const exportDatabase = () => {
  const users = getUsers();
  const dataStr = JSON.stringify(users, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `educode_users_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
};

// Импорт базы данных
export const importDatabase = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const users = JSON.parse(e.target.result);
        localStorage.setItem(USERS_DB, JSON.stringify(users));
        resolve({ success: true, message: 'База данных импортирована' });
      } catch (error) {
        reject({ success: false, error: 'Неверный формат файла' });
      }
    };
    reader.readAsText(file);
  });
};

// Очистить всю базу данных (только для админов)
export const clearDatabase = () => {
  if (!isAdmin()) {
    return { success: false, error: 'Недостаточно прав' };
  }
  
  localStorage.removeItem(USERS_DB);
  localStorage.removeItem(CURRENT_USER_DB);
  
  // Переинициализировать с дефолтными пользователями
  initDatabase();
  
  return { success: true, message: 'База данных очищена и переинициализирована' };
};

// Функции для управления прогрессом
export const getUserProgress = (userId) => {
  const progress = localStorage.getItem(PROGRESS_DB);
  const progressData = progress ? JSON.parse(progress) : {};
  return progressData[userId] || {};
};

export const updateUserProgress = (userId, courseId, lessonId, completed = true) => {
  const progress = localStorage.getItem(PROGRESS_DB);
  const progressData = progress ? JSON.parse(progress) : {};
  
  if (!progressData[userId]) {
    progressData[userId] = {};
  }
  
  if (!progressData[userId][courseId]) {
    progressData[userId][courseId] = {};
  }
  
  progressData[userId][courseId][lessonId] = {
    completed,
    completedAt: completed ? new Date().toISOString() : null
  };
  
  localStorage.setItem(PROGRESS_DB, JSON.stringify(progressData));
  return { success: true };
};


export const getCourseProgress = (userId, courseId) => {
  const progress = getUserProgress(userId);
  const courseProgress = progress[courseId] || {};
  const completedLessons = Object.values(courseProgress).filter(lesson => lesson.completed).length;
  return completedLessons;
};

// Функции для управления оценками
export const getUserGrades = (userId) => {
  const grades = localStorage.getItem(GRADES_DB);
  const gradesData = grades ? JSON.parse(grades) : {};
  return gradesData[userId] || {};
};

export const saveGrade = (userId, courseId, lessonId, grade, maxGrade = 100) => {
  const grades = localStorage.getItem(GRADES_DB);
  const gradesData = grades ? JSON.parse(grades) : {};
  
  if (!gradesData[userId]) {
    gradesData[userId] = {};
  }
  
  if (!gradesData[userId][courseId]) {
    gradesData[userId][courseId] = {};
  }
  
  gradesData[userId][courseId][lessonId] = {
    grade,
    maxGrade,
    percentage: Math.round((grade / maxGrade) * 100),
    completedAt: new Date().toISOString(),
    status: grade >= 70 ? 'passed' : 'failed'
  };
  
  localStorage.setItem(GRADES_DB, JSON.stringify(gradesData));
  return { success: true };
};

export const getLessonGrade = (userId, courseId, lessonId) => {
  const grades = getUserGrades(userId);
  return grades[courseId]?.[lessonId] || null;
};

export const getCourseGrades = (userId, courseId) => {
  const grades = getUserGrades(userId);
  return grades[courseId] || {};
};

export const calculateCourseAverage = (userId, courseId) => {
  const courseGrades = getCourseGrades(userId, courseId);
  const grades = Object.values(courseGrades);
  
  if (grades.length === 0) return 0;
  
  const totalPercentage = grades.reduce((sum, grade) => sum + grade.percentage, 0);
  return Math.round(totalPercentage / grades.length);
};

// Функции для управления уведомлениями
export const getUserNotifications = (userId) => {
  if (!userId) return [];
  const notifications = localStorage.getItem(NOTIFICATIONS_DB);
  const notificationsData = notifications ? JSON.parse(notifications) : {};
  const userNotifications = notificationsData[userId];
  return Array.isArray(userNotifications) ? userNotifications : [];
};

export const addNotification = (userId, type, title, message, courseId = null, lessonId = null) => {
  const notifications = localStorage.getItem(NOTIFICATIONS_DB);
  const notificationsData = notifications ? JSON.parse(notifications) : {};
  
  if (!notificationsData[userId]) {
    notificationsData[userId] = [];
  }
  
  const notification = {
    id: Date.now(),
    type, // 'grade', 'lesson_completed', 'course_unlocked'
    title,
    message,
    courseId,
    lessonId,
    createdAt: new Date().toISOString(),
    read: false
  };
  
  notificationsData[userId].unshift(notification); // Добавляем в начало
  localStorage.setItem(NOTIFICATIONS_DB, JSON.stringify(notificationsData));
  return { success: true };
};

export const markNotificationAsRead = (userId, notificationId) => {
  const notifications = localStorage.getItem(NOTIFICATIONS_DB);
  const notificationsData = notifications ? JSON.parse(notifications) : {};
  
  if (notificationsData[userId]) {
    const notification = notificationsData[userId].find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem(NOTIFICATIONS_DB, JSON.stringify(notificationsData));
    }
  }
  return { success: true };
};

export const getUnreadNotificationsCount = (userId) => {
  if (!userId) return 0;
  const notifications = getUserNotifications(userId);
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter(n => !n.read).length;
};

// Функции для управления прогрессом уроков
export const getLessonProgress = (userId, courseId, lessonId) => {
  const progress = localStorage.getItem(PROGRESS_DB);
  const progressData = progress ? JSON.parse(progress) : {};
  
  if (!progressData[userId]) {
    progressData[userId] = {};
  }
  
  if (!progressData[userId][courseId]) {
    progressData[userId][courseId] = {};
  }
  
  return progressData[userId][courseId][lessonId] || {
    completed: false,
    unlocked: lessonId === 1, // Первый урок всегда разблокирован
    sectionsCompleted: {
      video: false,
      theory: false,
      practice: false
    }
  };
};

export const updateLessonProgress = (userId, courseId, lessonId, sectionCompleted) => {
  const progress = localStorage.getItem(PROGRESS_DB);
  const progressData = progress ? JSON.parse(progress) : {};
  
  if (!progressData[userId]) {
    progressData[userId] = {};
  }
  
  if (!progressData[userId][courseId]) {
    progressData[userId][courseId] = {};
  }
  
  if (!progressData[userId][courseId][lessonId]) {
    progressData[userId][courseId][lessonId] = {
      completed: false,
      unlocked: lessonId === 1,
      sectionsCompleted: {
        video: false,
        theory: false,
        practice: false
      }
    };
  }
  
  // Обновляем секцию
  progressData[userId][courseId][lessonId].sectionsCompleted[sectionCompleted] = true;
  
  // Проверяем, завершен ли урок
  const sections = progressData[userId][courseId][lessonId].sectionsCompleted;
  const isCompleted = sections.video && sections.theory && sections.practice;
  
  if (isCompleted && !progressData[userId][courseId][lessonId].completed) {
    progressData[userId][courseId][lessonId].completed = true;
    
    // Разблокируем следующий урок
    const nextLessonId = lessonId + 1;
    if (!progressData[userId][courseId][nextLessonId]) {
      progressData[userId][courseId][nextLessonId] = {
        completed: false,
        unlocked: true,
        sectionsCompleted: {
          video: false,
          theory: false,
          practice: false
        }
      };
    } else {
      progressData[userId][courseId][nextLessonId].unlocked = true;
    }
    
    // Добавляем уведомление о разблокировке следующего урока
    addNotification(
      userId,
      'lesson_unlocked',
      'Новый урок разблокирован!',
      `Урок ${nextLessonId} курса "${courseId}" теперь доступен для изучения.`,
      courseId,
      nextLessonId
    );
  }
  
  localStorage.setItem(PROGRESS_DB, JSON.stringify(progressData));
  return { success: true };
};

export const isLessonUnlocked = (userId, courseId, lessonId) => {
  const lessonProgress = getLessonProgress(userId, courseId, lessonId);
  return lessonProgress.unlocked;
};

export const isLessonCompleted = (userId, courseId, lessonId) => {
  const lessonProgress = getLessonProgress(userId, courseId, lessonId);
  return lessonProgress.completed;
};

// Функции для работы с журналом
export const saveJournalEntry = (userId, courseId, lessonId, data) => {
  const journal = localStorage.getItem(JOURNAL_DB);
  const journalData = journal ? JSON.parse(journal) : {};
  
  if (!journalData[userId]) {
    journalData[userId] = {};
  }
  
  if (!journalData[userId][courseId]) {
    journalData[userId][courseId] = {};
  }
  
  const existingEntry = journalData[userId][courseId][lessonId] || {};
  
  journalData[userId][courseId][lessonId] = {
    ...existingEntry,
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(JOURNAL_DB, JSON.stringify(journalData));
  return { success: true };
};

export const getJournalEntry = (userId, courseId, lessonId) => {
  const journal = localStorage.getItem(JOURNAL_DB);
  const journalData = journal ? JSON.parse(journal) : {};
  return journalData[userId]?.[courseId]?.[lessonId] || null;
};

export const getCourseJournal = (userId, courseId) => {
  const journal = localStorage.getItem(JOURNAL_DB);
  const journalData = journal ? JSON.parse(journal) : {};
  return journalData[userId]?.[courseId] || {};
};

// Сохранение даты начала урока
export const startLesson = (userId, courseId, lessonId) => {
  const startDate = new Date();
  return saveJournalEntry(userId, courseId, lessonId, {
    startDate: startDate.toISOString(),
    startDateFormatted: formatDate(startDate)
  });
};

// Сохранение результатов урока (дата окончания и баллы)
export const completeLessonWithScores = (userId, courseId, lessonId, testScore, practiceScore) => {
  const endDate = new Date();
  const averageScore = Math.round((testScore + practiceScore) / 2);
  
  return saveJournalEntry(userId, courseId, lessonId, {
    endDate: endDate.toISOString(),
    endDateFormatted: formatDate(endDate),
    testGrade: testScore,
    taskGrade: practiceScore,
    averageGrade: averageScore
  });
};

// Форматирование даты в формат DD.MM
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};
