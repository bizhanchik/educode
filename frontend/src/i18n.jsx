import { createContext, useState, useContext, useEffect } from 'react';

// Данные локализации напрямую
const ru = {
  "navbar": {
    "home": "Главная",
    "about": "О проекте",
    "blog": "Блог",
    "contacts": "Контакты",
    "signin": "Войти",
    "signup": "Регистрация",
    "signupMobile": "Регистр.",
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
    "notifications": "Уведомления",
    "journal": "Журнал",
    "settings": "Настройки",
    "logout": "Выйти"
  },
  "courses": {
    "title": "Мои курсы",
    "subtitle": "Продолжайте обучение и развивайте свои навыки программирования"
  },
  "admin": {
    "journal": {
      "title": "ЖУРНАЛ КУРСОВ",
      "courses": "Курсы",
      "groups": "Группы",
      "students": "Студенты",
      "teachers": "Преподаватели",
      "settings": "Настройки",
      "addCourse": "Добавить курс",
      "exportExcel": "Экспорт в Excel",
      "all": "Все",
      "active": "Активен",
      "archive": "Архив",
      "searchCourse": "Поиск по названию курса или преподавателю",
      "searchTeacher": "Поиск по ФИО или предмету",
      "searchGroup": "Поиск по названию группы",
      "searchStudent": "Поиск по имени или email",
      "noData": "Нет данных",
      "actions": "Действия",
      "view": "Просмотр",
      "edit": "Редактировать",
      "delete": "Удалить",
      "details": "Детали курса",
      "name": "Название",
      "code": "Код",
      "teacher": "Преподаватель",
      "status": "Статус",
      "updateDate": "Дата обновления",
      "description": "Описание",
      "close": "Закрыть",
      "save": "Сохранить",
      "cancel": "Отмена",
      "deleteConfirm": "Вы уверены, что хотите удалить курс",
      "cannotUndo": "Это действие нельзя отменить.",
      "addStudent": "Добавить студента",
      "addTeacher": "Добавить преподавателя",
      "addGroup": "Создать группу",
      "fullName": "ФИО",
      "email": "Email",
      "password": "Пароль",
      "group": "Группа",
      "coursesCompleted": "Пройдено курсов",
      "phone": "Телефон",
      "subject": "Предмет",
      "curator": "Куратор",
      "studentsCount": "Кол-во студентов",
      "assignedCourses": "Назначенные курсы",
      "selectGroup": "Выберите группу или воспользуйтесь поиском, чтобы просмотреть студентов.",
      "allGroups": "Все группы",
      "studentsOfGroup": "Студенты группы",
      "noStudentsInGroup": "Нет студентов в этой группе",
      "backToGroups": "Назад к группам",
      "number": "№",
      "codeHeader": "Код",
      "teacherHeader": "Преподаватель",
      "groupsHeader": "Группы",
      "statusHeader": "Статус",
      "dateHeader": "Дата",
      "dateUpdateHeader": "Дата обновления",
      "fullNameHeader": "ФИО",
      "fullNameTeacherHeader": "ФИО преподавателя",
      "phoneHeader": "Телефон",
      "subjectHeader": "Предмет",
      "emailHeader": "Email",
      "passwordHeader": "Пароль",
      "groupHeader": "Группа",
      "coursesCompletedHeader": "Пройдено курсов",
      "curatorHeader": "Куратор",
      "studentsCountHeader": "Кол-во студентов",
      "assignedCoursesHeader": "Назначенные курсы",
      "noMatches": "Нет совпадений по запросу",
      "addCourseButton": "Добавить курс",
      "exportExcelButton": "Экспорт в Excel",
      "editCourseTitle": "Редактировать курс",
      "inactive": "Неактивен",
      "courseCompleted": "курс",
      "coursesCompleted2": "курса",
      "coursesCompleted3": "курсов",
      "completed": "завершено"
    },
    "settings": {
      "title": "Настройки",
      "adminProfile": "Профиль администратора",
      "fullName": "Имя и фамилия",
      "email": "Email",
      "phone": "Телефон",
      "changePassword": "Изменить пароль",
      "userManagement": "Управление пользователями",
      "platform": "Платформа",
      "platformName": "Название платформы",
      "supportEmail": "Контактный email для поддержки",
      "maintenanceMode": "Режим обслуживания",
      "saveChanges": "Сохранить изменения",
      "changesSaved": "Изменения сохранены",
      "language": "Язык интерфейса",
      "russian": "Русский",
      "kazakh": "Казахский",
      "english": "English",
      "backToSettings": "Назад в настройки",
      "userManagementTitle": "Управление пользователями",
      "addUser": "Добавить пользователя",
      "allUsers": "Все пользователи",
      "onlyStudents": "Только студенты",
      "onlyTeachers": "Только преподаватели",
      "number": "№",
      "role": "Роль",
      "student": "Студент",
      "teacher": "Преподаватель",
      "administrator": "Администратор",
      "change": "Изменить",
      "resetPassword": "Сбросить пароль",
      "resetPasswordConfirm": "Вы уверены, что хотите сбросить пароль для пользователя",
      "yesReset": "Да, сбросить",
      "changeRole": "Изменить роль пользователя",
      "currentName": "Текущее имя",
      "selectNewRole": "Выберите новую роль",
      "deleteUser": "Удалить пользователя",
      "deleteUserConfirm": "Вы уверены, что хотите удалить пользователя"
    }
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
    "signupMobile": "Тірк.",
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
    "notifications": "Хабарландырулар",
    "journal": "Журнал",
    "settings": "Баптаулар",
    "logout": "Шығу"
  },
  "courses": {
    "title": "Менің курстарым",
    "subtitle": "Оқуды жалғастырыңыз және бағдарламалау дағдыларыңызды дамытыңыз"
  },
  "admin": {
    "journal": {
      "title": "КУРСТАР КІТАБЫ",
      "courses": "Курстар",
      "groups": "Топтар",
      "students": "Студенттер",
      "teachers": "Мұғалімдер",
      "settings": "Баптаулар",
      "addCourse": "Курс қосу",
      "exportExcel": "Excel-ге экспорт",
      "all": "Барлығы",
      "active": "Белсенді",
      "archive": "Мұрағат",
      "searchCourse": "Курс атауы немесе мұғалім бойынша іздеу",
      "searchTeacher": "Аты-жөні немесе пән бойынша іздеу",
      "searchGroup": "Топ атауы бойынша іздеу",
      "searchStudent": "Аты немесе email бойынша іздеу",
      "noData": "Деректер жоқ",
      "actions": "Әрекеттер",
      "view": "Көру",
      "edit": "Өңдеу",
      "delete": "Жою",
      "details": "Курс мәліметтері",
      "name": "Атауы",
      "code": "Код",
      "teacher": "Мұғалім",
      "status": "Күйі",
      "updateDate": "Жаңарту күні",
      "description": "Сипаттама",
      "close": "Жабу",
      "save": "Сақтау",
      "cancel": "Болдырмау",
      "deleteConfirm": "Сіз шынымен курсты жойғыңыз келе ме",
      "cannotUndo": "Бұл әрекетті болдыруға болмайды.",
      "addStudent": "Студент қосу",
      "addTeacher": "Мұғалім қосу",
      "addGroup": "Топ құру",
      "fullName": "Аты-жөні",
      "email": "Email",
      "password": "Құпия сөз",
      "group": "Топ",
      "coursesCompleted": "Аяқталған курстар",
      "phone": "Телефон",
      "subject": "Пән",
      "curator": "Куратор",
      "studentsCount": "Студенттер саны",
      "assignedCourses": "Тағайындалған курстар",
      "selectGroup": "Студенттерді көру үшін топты таңдаңыз немесе іздеуді пайдаланыңыз.",
      "allGroups": "Барлық топтар",
      "studentsOfGroup": "Топ студенттері",
      "noStudentsInGroup": "Бұл топта студенттер жоқ",
      "backToGroups": "Топтарға оралу",
      "number": "№",
      "codeHeader": "Код",
      "teacherHeader": "Мұғалім",
      "groupsHeader": "Топтар",
      "statusHeader": "Күйі",
      "dateHeader": "Күні",
      "dateUpdateHeader": "Жаңарту күні",
      "fullNameHeader": "Аты-жөні",
      "fullNameTeacherHeader": "Мұғалім аты-жөні",
      "phoneHeader": "Телефон",
      "subjectHeader": "Пән",
      "emailHeader": "Email",
      "passwordHeader": "Құпия сөз",
      "groupHeader": "Топ",
      "coursesCompletedHeader": "Аяқталған курстар",
      "curatorHeader": "Куратор",
      "studentsCountHeader": "Студенттер саны",
      "assignedCoursesHeader": "Тағайындалған курстар",
      "noMatches": "Сұрау бойынша сәйкестіктер жоқ",
      "addCourseButton": "Курс қосу",
      "exportExcelButton": "Excel-ге экспорт",
      "editCourseTitle": "Курсты өңдеу",
      "inactive": "Белсенді емес",
      "courseCompleted": "курс",
      "coursesCompleted2": "курс",
      "coursesCompleted3": "курстар",
      "completed": "аяқталды"
    },
    "settings": {
      "title": "Баптаулар",
      "adminProfile": "Әкімші профилі",
      "fullName": "Аты және тегі",
      "email": "Email",
      "phone": "Телефон",
      "changePassword": "Құпия сөзді өзгерту",
      "userManagement": "Пайдаланушыларды басқару",
      "platform": "Платформа",
      "platformName": "Платформа атауы",
      "supportEmail": "Қолдау email",
      "maintenanceMode": "Техникалық қызмет режимі",
      "saveChanges": "Өзгерістерді сақтау",
      "changesSaved": "Өзгерістер сақталды",
      "language": "Интерфейс тілі",
      "russian": "Орысша",
      "kazakh": "Қазақша",
      "english": "English",
      "backToSettings": "Баптауларға оралу",
      "userManagementTitle": "Пайдаланушыларды басқару",
      "addUser": "Пайдаланушы қосу",
      "allUsers": "Барлық пайдаланушылар",
      "onlyStudents": "Тек студенттер",
      "onlyTeachers": "Тек мұғалімдер",
      "number": "№",
      "role": "Рөлі",
      "student": "Студент",
      "teacher": "Мұғалім",
      "administrator": "Әкімші",
      "change": "Өзгерту",
      "resetPassword": "Құпия сөзді қалпына келтіру",
      "resetPasswordConfirm": "Сіз шынымен пайдаланушы үшін құпия сөзді қалпына келтіргіңіз келе ме",
      "yesReset": "Иә, қалпына келтіру",
      "changeRole": "Пайдаланушы рөлін өзгерту",
      "currentName": "Ағымдағы аты",
      "selectNewRole": "Жаңа рөлді таңдаңыз",
      "deleteUser": "Пайдаланушыны жою",
      "deleteUserConfirm": "Сіз шынымен пайдаланушыны жойғыңыз келе ме"
    }
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
    "notifications": "Notifications",
    "journal": "Journal",
    "settings": "Settings",
    "logout": "Logout"
  },
  "courses": {
    "title": "My Courses",
    "subtitle": "Continue learning and develop your programming skills"
  },
  "admin": {
    "journal": {
      "title": "COURSES JOURNAL",
      "courses": "Courses",
      "groups": "Groups",
      "students": "Students",
      "teachers": "Teachers",
      "settings": "Settings",
      "addCourse": "Add Course",
      "exportExcel": "Export to Excel",
      "all": "All",
      "active": "Active",
      "archive": "Archive",
      "searchCourse": "Search by course name or teacher",
      "searchTeacher": "Search by name or subject",
      "searchGroup": "Search by group name",
      "searchStudent": "Search by name or email",
      "noData": "No data",
      "actions": "Actions",
      "view": "View",
      "edit": "Edit",
      "delete": "Delete",
      "details": "Course Details",
      "name": "Name",
      "code": "Code",
      "teacher": "Teacher",
      "status": "Status",
      "updateDate": "Update Date",
      "description": "Description",
      "close": "Close",
      "save": "Save",
      "cancel": "Cancel",
      "deleteConfirm": "Are you sure you want to delete the course",
      "cannotUndo": "This action cannot be undone.",
      "addStudent": "Add Student",
      "addTeacher": "Add Teacher",
      "addGroup": "Create Group",
      "fullName": "Full Name",
      "email": "Email",
      "password": "Password",
      "group": "Group",
      "coursesCompleted": "Courses Completed",
      "phone": "Phone",
      "subject": "Subject",
      "curator": "Curator",
      "studentsCount": "Students Count",
      "assignedCourses": "Assigned Courses",
      "selectGroup": "Select a group or use search to view students.",
      "allGroups": "All Groups",
      "studentsOfGroup": "Students of Group",
      "noStudentsInGroup": "No students in this group",
      "backToGroups": "Back to Groups",
      "number": "#",
      "codeHeader": "Code",
      "teacherHeader": "Teacher",
      "groupsHeader": "Groups",
      "statusHeader": "Status",
      "dateHeader": "Date",
      "dateUpdateHeader": "Update Date",
      "fullNameHeader": "Full Name",
      "fullNameTeacherHeader": "Teacher Full Name",
      "phoneHeader": "Phone",
      "subjectHeader": "Subject",
      "emailHeader": "Email",
      "passwordHeader": "Password",
      "groupHeader": "Group",
      "coursesCompletedHeader": "Courses Completed",
      "curatorHeader": "Curator",
      "studentsCountHeader": "Students Count",
      "assignedCoursesHeader": "Assigned Courses",
      "noMatches": "No matches found for query",
      "addCourseButton": "Add Course",
      "exportExcelButton": "Export to Excel",
      "editCourseTitle": "Edit Course",
      "inactive": "Inactive",
      "courseCompleted": "course",
      "coursesCompleted2": "courses",
      "coursesCompleted3": "courses",
      "completed": "completed"
    },
    "settings": {
      "title": "Settings",
      "adminProfile": "Admin Profile",
      "fullName": "First and Last Name",
      "email": "Email",
      "phone": "Phone",
      "changePassword": "Change Password",
      "userManagement": "User Management",
      "platform": "Platform",
      "platformName": "Platform Name",
      "supportEmail": "Support Contact Email",
      "maintenanceMode": "Maintenance Mode",
      "saveChanges": "Save Changes",
      "changesSaved": "Changes saved",
      "language": "Interface Language",
      "russian": "Russian",
      "kazakh": "Kazakh",
      "english": "English",
      "backToSettings": "Back to Settings",
      "userManagementTitle": "User Management",
      "addUser": "Add User",
      "allUsers": "All Users",
      "onlyStudents": "Students Only",
      "onlyTeachers": "Teachers Only",
      "number": "#",
      "role": "Role",
      "student": "Student",
      "teacher": "Teacher",
      "administrator": "Administrator",
      "change": "Change",
      "resetPassword": "Reset Password",
      "resetPasswordConfirm": "Are you sure you want to reset the password for user",
      "yesReset": "Yes, reset",
      "changeRole": "Change User Role",
      "currentName": "Current Name",
      "selectNewRole": "Select New Role",
      "deleteUser": "Delete User",
      "deleteUserConfirm": "Are you sure you want to delete user"
    }
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