import { createContext, useState, useContext, useEffect } from 'react';

// Данные локализации напрямую
const ru = {
  "navbar": {
    "home": "Главная",
    "about": "О проекте",
    "blog": "Блог",
    "contacts": "Контакты",
    "signin": "Войти",
    "signup": "Зарегистрироваться",
    "language": "Язык"
  },
  "hero": {
    "title": "Учись. Программируй. Проверяй.",
    "subtitle": "EduCode — образовательная платформа, где студенты получают теорию, применяют её на практике и проходят AI-проверку авторства кода.",
    "start": "Начать обучение",
    "demo": "Посмотреть демо"
  },
  "modal": {
    "welcome": "Добро пожаловать!",
    "create": "Создайте свой аккаунт",
    "login": "Войти",
    "register": "Зарегистрироваться",
    "loginWelcome": "Добро пожаловать!",
    "registerWelcome": "Создайте аккаунт",
    "fullName": "Введите ФИО",
    "email": "Электронная почта",
    "password": "Пароль",
    "confirmPassword": "Подтвердите пароль",
    "forgotPassword": "Забыли пароль?",
    "noAccount": "Нет аккаунта? Зарегистрируйтесь",
    "haveAccount": "Уже есть аккаунт? Войдите",
    "inputHeight": "ВЫСОТА ПОЛЯ",
    "continue": "Продолжить",
    "confirm": "Подтверждение пароля",
    "no_account": "Нет аккаунта? Создайте его",
    "have_account": "Уже есть аккаунт? Войти"
  },
  "code": {
    "comment": "/* \n  Этот проект создан для того, чтобы объединить теорию, практику \n  и проверку кода с помощью ИИ. EduCode помогает студентам \n  развивать навыки и уверенность в себе. \n*/"
  },
  "sections": {
    "about": {
      "title": "О проекте",
      "content": "EduCode — это ИИ-платформа, которая объединяет обучение, практику и честную проверку кода."
    },
    "why": {
      "title": "Почему важно",
      "content": "EduCode помогает студентам честно проходить практику и понимать собственный стиль кода."
    },
    "how": {
      "title": "Как работает",
      "content": "Теория → Практика → Загрузка кода → Проверка ИИ."
    }
  },
  "userMenu": {
    "admin": "Администратор",
    "student": "Студент",
    "user": "Пользователь",
    "myCourses": "Мои курсы",
    "lessons": "Уроки",
    "journal": "Журнал",
    "settings": "Настройки",
    "logout": "Выйти"
  },
  "courses": {
    "title": "Мои курсы",
    "subtitle": "Продолжайте обучение и развивайте свои навыки программирования"
  }
};

const kk = {
  "navbar": {
    "home": "Басты бет",
    "about": "Жоба туралы",
    "blog": "Блог",
    "contacts": "Байланыс",
    "signin": "Кіру",
    "signup": "Тіркелу",
    "language": "Тіл"
  },
  "hero": {
    "title": "Үйрен. Код жаз. Тексер.",
    "subtitle": "EduCode — студенттер теорияны алатын, оны практикада қолданатын және кодтың авторлығын AI тексеруінен өтетін білім беру платформасы.",
    "start": "Бастау",
    "demo": "Демонстрация"
  },
  "modal": {
    "welcome": "Қош келдіңіз!",
    "create": "Аккаунт жасаңыз",
    "login": "Кіру",
    "register": "Тіркелу",
    "loginWelcome": "Қош келдіңіз!",
    "registerWelcome": "Аккаунт жасаңыз",
    "fullName": "ФИО енгізіңіз",
    "email": "Электрондық пошта",
    "password": "Құпия сөз",
    "confirmPassword": "Құпия сөзді растаңыз",
    "forgotPassword": "Құпия сөзді ұмыттыңыз ба?",
    "noAccount": "Аккаунт жоқ па? Тіркеліңіз",
    "haveAccount": "Аккаунтыңыз бар ма? Кіріңіз",
    "inputHeight": "ӨРІСТІҢ БИІКТІГІ",
    "continue": "Жалғастыру",
    "confirm": "Құпия сөзді растау",
    "no_account": "Аккаунт жоқ па? Тіркеліңіз",
    "have_account": "Аккаунтыңыз бар ма? Кіру"
  },
  "code": {
    "comment": "/* \n  Бұл жоба теорияны, практиканы және AI көмегімен код тексеруді \n  біріктіру үшін жасалған. EduCode студенттерге дағдыларын \n  және өзіне деген сенімділігін дамытуға көмектеседі. \n*/"
  },
  "sections": {
    "about": {
      "title": "Жоба туралы",
      "content": "EduCode — бұл оқыту, практика және кодты адал тексеруді біріктіретін ИИ платформасы."
    },
    "why": {
      "title": "Неге маңызды",
      "content": "EduCode студенттерге практиканы адал өтуге және өз кодының стилін түсінуге көмектеседі."
    },
    "how": {
      "title": "Қалай жұмыс істейді",
      "content": "Теория → Практика → Кодты жүктеу → ИИ тексеру."
    }
  },
  "userMenu": {
    "admin": "Әкімші",
    "student": "Студент",
    "user": "Пайдаланушы",
    "myCourses": "Менің курстарым",
    "lessons": "Сабақтар",
    "journal": "Журнал",
    "settings": "Баптаулар",
    "logout": "Шығу"
  },
  "courses": {
    "title": "Менің курстарым",
    "subtitle": "Оқуды жалғастырыңыз және бағдарламалау дағдыларыңызды дамытыңыз"
  }
};

const en = {
  "navbar": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contacts": "Contacts",
    "signin": "Sign In",
    "signup": "Sign Up",
    "language": "Language"
  },
  "hero": {
    "title": "Learn. Code. Verify.",
    "subtitle": "EduCode is an educational platform where students receive theory, apply it in practice, and undergo AI verification of code authorship.",
    "start": "Start Learning",
    "demo": "Watch Demo"
  },
  "modal": {
    "welcome": "Welcome!",
    "create": "Create your account",
    "login": "Log in",
    "register": "Register",
    "loginWelcome": "Welcome!",
    "registerWelcome": "Create Account",
    "fullName": "Enter FIO",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account? Sign up",
    "haveAccount": "Already have an account? Sign in",
    "inputHeight": "INPUT HEIGHT",
    "continue": "Continue",
    "confirm": "Confirm Password",
    "no_account": "Don't have an account? Sign up",
    "have_account": "Already have an account? Sign in"
  },
  "code": {
    "comment": "/* \n  This project was created to combine theory, practice, \n  and AI-powered code verification. EduCode helps students \n  develop skills and confidence. \n*/"
  },
  "sections": {
    "about": {
      "title": "About the Project",
      "content": "EduCode is an AI platform that combines learning, practice, and honest code verification."
    },
    "why": {
      "title": "Why It Matters",
      "content": "EduCode helps students honestly complete practice tasks and understand their own coding style."
    },
    "how": {
      "title": "How It Works",
      "content": "Theory → Practice → Code Upload → AI Verification."
    }
  },
  "userMenu": {
    "admin": "Administrator",
    "student": "Student",
    "user": "User",
    "myCourses": "My Courses",
    "lessons": "Lessons",
    "journal": "Journal",
    "settings": "Settings",
    "logout": "Logout"
  },
  "courses": {
    "title": "My Courses",
    "subtitle": "Continue learning and develop your programming skills"
  }
};

// Создаем контекст для языка
export const LanguageContext = createContext();

// Доступные языки
export const languages = {
  ru: { name: 'Русский', code: 'ru', translations: ru },
  kk: { name: 'Қазақша', code: 'kk', translations: kk },
  en: { name: 'English', code: 'en', translations: en }
};

// Провайдер языка
export const LanguageProvider = ({ children }) => {
  // Получаем сохраненный язык из localStorage или используем русский по умолчанию
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage && languages[savedLanguage] ? savedLanguage : 'ru';
  });

  // Функция для изменения языка
  const changeLanguage = (lang) => {
    if (languages[lang]) {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  // Функция для получения перевода
  const t = (key) => {
    const keys = key.split('.');
    let translation = languages[language].translations;
    
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        return key; // Возвращаем ключ, если перевод не найден
      }
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Хук для использования языка
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};