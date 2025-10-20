// Мини база данных для аутентификации
const USERS_DB = 'educode_users';
const CURRENT_USER_DB = 'educode_current_user';

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
    email: 'test@educode.com',
    password: 'test123',
    fullName: 'Тестовый пользователь',
    role: 'user',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    email: 'student@educode.com',
    password: 'student123',
    fullName: 'Алина',
    role: 'student',
    createdAt: new Date().toISOString()
  }
];

// Инициализация базы данных
export const initDatabase = () => {
  const existingUsers = localStorage.getItem(USERS_DB);
  if (!existingUsers) {
    localStorage.setItem(USERS_DB, JSON.stringify(DEFAULT_USERS));
    console.log('📊 База данных инициализирована с тестовыми пользователями');
  }
};

// Получить всех пользователей
export const getUsers = () => {
  const users = localStorage.getItem(USERS_DB);
  return users ? JSON.parse(users) : [];
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
    role: 'user',
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
