import React, { useState } from 'react';
import { BookOpen, Users, GraduationCap, UserCog, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import BackButton from '../components/BackButton.jsx';
import { useLanguage } from '../i18n.jsx';
import * as XLSX from 'xlsx';

// SVG иконки для действий (просмотр, редактировать, удалить)
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// MOCK DATA (обновлено согласно ТЗ)
const mockCourses = [
  { id: 1, code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', teacher: 'Мартынцов Николай Викторович', groups: ['ПО2402', 'ПО2403'], status: 'Активен', updatedAt: '12.09.2025', description: 'Практический курс по составлению алгоритмов и созданию блок-схем.' },
  { id: 2, code: 'ПМ01', name: 'Администрирование баз данных', teacher: 'Ермуханбетов Жанторе Серикович', groups: ['ПО2402'], status: 'Активен', updatedAt: '15.09.2025', description: 'Управление БД, резервное копирование, доступ и безопасность.' },
  { id: 3, code: 'ООД14', name: 'Графика и проектирование', teacher: 'Галимпанова Асель Сергеевна', groups: ['ПО2401', 'ПО2403'], status: 'Архив', updatedAt: '07.09.2025', description: 'Основы графики и проектной документации.' },
];
const mockTeachers = [
  { id: 1, name: 'Мартынцов Николай Викторович', phone: '+7 (701) 123-45-67', email: 'martyn@edu.kz', course: 'Алгоритмизация и блок-схемы', groups: ['ПО2402', 'ПО2403'] },
  { id: 2, name: 'Ермуханбетов Жанторе Серикович', phone: '+7 (702) 234-56-78', email: 'j.er@edu.kz', course: 'Администрирование баз данных', groups: ['ПО2402'] },
  { id: 3, name: 'Галимпанова Асель Сергеевна', phone: '+7 (703) 345-67-89', email: 'a.galipanova@edu.kz', course: 'Графика и проектирование', groups: ['ПО2401', 'ПО2403'] },
];
const mockStudents = [
  { 
    id: 1, 
    name: 'Айгерим Касымова', 
    email: 'aigerim@edu.kz', 
    group: 'ПО2402', 
    courses: 2, 
    status: 'Активен', 
    password: '12345',
    courseDetails: [
      { code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', status: 'Завершён' },
      { code: 'ПМ01', name: 'Администрирование баз данных', status: 'В процессе' }
    ]
  },
  { 
    id: 2, 
    name: 'Рахат Толеубаев', 
    email: 'rakh@edu.kz', 
    group: 'ПО2403', 
    courses: 3, 
    status: 'Неактивен', 
    password: '67890',
    courseDetails: [
      { code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', status: 'Завершён' },
      { code: 'ООД14', name: 'Графика и проектирование', status: 'Завершён' },
      { code: 'ПМ01', name: 'Администрирование баз данных', status: 'В процессе' }
    ]
  },
  { 
    id: 3, 
    name: 'Сауле Мухамедова', 
    email: 'saule@edu.kz', 
    group: 'ПО2402', 
    courses: 1, 
    status: 'Активен', 
    password: 'password1',
    courseDetails: [
      { code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', status: 'Завершён' }
    ]
  },
  { 
    id: 4, 
    name: 'Данияр Абдуллаев', 
    email: 'daniyar@edu.kz', 
    group: 'ПО2401', 
    courses: 2, 
    status: 'Активен', 
    password: 'password2',
    courseDetails: [
      { code: 'ООД14', name: 'Графика и проектирование', status: 'Завершён' },
      { code: 'ПМ01', name: 'Администрирование баз данных', status: 'Завершён' }
    ]
  },
  { 
    id: 5, 
    name: 'Ерлан Бектасов', 
    email: 'erlan@edu.kz', 
    group: 'ПО2402', 
    courses: 2, 
    status: 'Активен', 
    password: 'password3',
    courseDetails: [
      { code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', status: 'Завершён' },
      { code: 'ПМ01', name: 'Администрирование баз данных', status: 'В процессе' }
    ]
  },
  { 
    id: 6, 
    name: 'Мадина Сагитова', 
    email: 'madina@edu.kz', 
    group: 'ПО2403', 
    courses: 0, 
    status: 'Активен', 
    password: 'password4',
    courseDetails: []
  },
];
const mockGroups = [
  { id: 1, name: 'ПО2402', studentsCount: 15, curator: 'Сауле Абдрахманова', courses: ['ПМ02', 'ПМ01'] },
  { id: 2, name: 'ПО2403', studentsCount: 12, curator: 'Мартынцов Николай Викторович', courses: ['ПМ02', 'ООД14'] },
  { id: 3, name: 'ПО2401', studentsCount: 18, curator: 'Галимпанова Асель Сергеевна', courses: ['ООД14'] },
];

const Journal = ({ onPageChange }) => {
  const { language, changeLanguage, t } = useLanguage();
  
  // Определяем админа (через контекст и запасной путь localStorage)
  let isAdmin = false;
  try {
    const { user } = useAuth();
    isAdmin = user?.role === 'admin';
  } catch {}
  if (!isAdmin) {
    try {
      const raw = localStorage.getItem('educode_current_user');
      const u = raw ? JSON.parse(raw) : null;
      if (u?.role === 'admin') isAdmin = true;
    } catch {}
  }

  const [tab, setTab] = useState('courses');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  
  // Единый поиск для всех вкладок
  const [searchQuery, setSearchQuery] = useState('');
  
  // Фильтры
  const [courseStatus, setCourseStatus] = useState('Все');
  const [studentGroupFilter, setStudentGroupFilter] = useState(''); // Для перехода из Групп в Студенты
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(''); // Фильтр группы в разделе Студенты
  
  // Состояния для модалок добавления/редактирования
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  
  // Состояние для раскрытой группы в таблице студентов (только одна группа может быть открыта)
  const [expandedGroup, setExpandedGroup] = useState(null);
  
  // Состояние для модального окна с курсами студента
  const [selectedStudentCourses, setSelectedStudentCourses] = useState(null);
  
  // Состояния для управления пользователями
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  
  // Состояния для настроек
  const [adminProfile, setAdminProfile] = useState({
    name: 'Администратор',
    email: 'admin@educode.com',
    phone: '+7 (700) 000-00-00'
  });
  const [platformSettings, setPlatformSettings] = useState({
    name: 'EduCode',
    supportEmail: 'support@educode.com',
    maintenanceMode: false
  });
  
  // Синхронизируем язык из настроек с системой переводов
  const handleLanguageChange = (langCode) => {
    if (langCode === 'ru' || langCode === 'kk' || langCode === 'en') {
      changeLanguage(langCode);
    }
  };
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // Объединяем всех пользователей (студенты + преподаватели)
  const getAllUsers = () => {
    const students = mockStudents.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: 'Студент',
      status: s.status,
      password: s.password
    }));
    const teachers = mockTeachers.map(t => ({
      id: `teacher_${t.id}`,
      name: t.name,
      email: t.email || t.phone,
      role: 'Преподаватель',
      status: 'Активен',
      password: '******'
    }));
    // Добавляем админа
    const admin = {
      id: 'admin_1',
      name: 'Администратор',
      email: 'admin@educode.com',
      role: 'Администратор',
      status: 'Активен',
      password: '******'
    };
    return [admin, ...students, ...teachers];
  };
  
  // Фильтруем пользователей по роли
  const getFilteredUsers = () => {
    const users = getAllUsers();
    if (!userRoleFilter || userRoleFilter === t('admin.settings.allUsers')) {
      return users;
    } else if (userRoleFilter === t('admin.settings.onlyStudents')) {
      return users.filter(u => u.role === 'Студент');
    } else if (userRoleFilter === t('admin.settings.onlyTeachers')) {
      return users.filter(u => u.role === 'Преподаватель');
    }
    return users;
  };

  // Функция перехода из Групп в Студенты
  const handleGroupClick = (groupName) => {
    setStudentGroupFilter(groupName);
    setSelectedStudentGroup(groupName); // Устанавливаем выбранную группу
    setTab('students');
    setSearchQuery(''); // Очищаем поиск при переходе
  };

  // Получаем список всех уникальных групп из студентов
  const getAllGroups = () => {
    const groups = [...new Set(mockStudents.map(s => s.group))].sort();
    return groups;
  };

  // Группируем студентов по группам
  const getStudentsGroupedByGroup = (students) => {
    const grouped = {};
    students.forEach(student => {
      if (!grouped[student.group]) {
        grouped[student.group] = [];
      }
      grouped[student.group].push(student);
    });
    return grouped;
  };

  // Функция раскрытия/сворачивания группы в таблице студентов
  const handleGroupInStudentsClick = (groupName) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null); // Сворачиваем, если уже открыта
    } else {
      setExpandedGroup(groupName); // Раскрываем новую группу (предыдущая автоматически закроется)
    }
  };
  
  // Получаем студентов выбранной группы
  const getStudentsByGroup = (groupName) => {
    return mockStudents.filter(s => s.group === groupName);
  };
  
  // Проверяем, раскрыта ли группа
  const isGroupExpanded = (groupName) => {
    return expandedGroup === groupName;
  };

  // Форматирование количества курсов
  const formatCoursesCount = (count) => {
    if (count === 0) return <span className="text-gray-500">0 {t('admin.journal.completed')}</span>;
    if (count === 1) return `1 ${t('admin.journal.courseCompleted')}`;
    if (count >= 2 && count <= 4) return `${count} ${t('admin.journal.coursesCompleted2')}`;
    return `${count} ${t('admin.journal.coursesCompleted3')}`;
  };

  // Получаем placeholder для поиска в зависимости от вкладки
  const getSearchPlaceholder = () => {
    switch (tab) {
      case 'courses': return t('admin.journal.searchCourse');
      case 'teachers': return t('admin.journal.searchTeacher');
      case 'groups': return t('admin.journal.searchGroup');
      case 'students': return t('admin.journal.searchStudent');
      default: return 'Поиск...';
    }
  };

  // Фильтрация данных по поисковому запросу
  const getFilteredData = () => {
    const query = searchQuery.toLowerCase();
    switch (tab) {
      case 'courses':
        return mockCourses.filter(c =>
          (courseStatus === 'Все' ? true : c.status === courseStatus) &&
          (!query || c.name.toLowerCase().includes(query) || c.teacher.toLowerCase().includes(query))
        );
      case 'teachers':
        return mockTeachers.filter(t =>
          !query || t.name.toLowerCase().includes(query) || t.course.toLowerCase().includes(query)
        );
      case 'groups':
        return mockGroups.filter(g =>
          !query || g.name.toLowerCase().includes(query)
        );
      case 'students':
        let filtered = mockStudents;
        // Фильтр по поиску (работает независимо от группы)
        if (query) {
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query)
          );
        }
        // Фильтр по группе (если выбрана конкретная группа)
        if (selectedStudentGroup && selectedStudentGroup !== t('admin.journal.allGroups')) {
          filtered = filtered.filter(s => s.group === selectedStudentGroup);
        }
        // Также учитываем старый фильтр для перехода из раздела Группы
        if (studentGroupFilter) {
          filtered = filtered.filter(s => s.group === studentGroupFilter);
        }
        return filtered;
      default:
        return [];
    }
  };

  // Функция экспорта в Excel
  const exportToExcel = () => {
    const data = getFilteredData();
    let excelData = [];
    let fileName = '';
    let sheetName = '';

    switch (tab) {
      case 'courses':
        fileName = 'Courses'; // Используем английское имя для файла
        sheetName = t('admin.journal.courses');
        excelData = data.map((course, idx) => ({
          [t('admin.journal.number')]: idx + 1,
          [t('admin.journal.codeHeader')]: course.code,
          [t('admin.journal.name')]: course.name,
          [t('admin.journal.teacherHeader')]: course.teacher,
          [t('admin.journal.groupsHeader')]: (course.groups || []).join(', '),
          [t('admin.journal.statusHeader')]: course.status === 'Активен' ? t('admin.journal.active') : course.status === 'Неактивен' ? t('admin.journal.inactive') : course.status,
          [t('admin.journal.dateUpdateHeader')]: course.updatedAt,
        }));
        break;

      case 'teachers':
        fileName = 'Teachers';
        sheetName = t('admin.journal.teachers');
        excelData = data.map((teacher, idx) => ({
          [t('admin.journal.number')]: idx + 1,
          [t('admin.journal.fullNameTeacherHeader')]: teacher.name,
          [t('admin.journal.phoneHeader')]: teacher.phone,
          [t('admin.journal.emailHeader')]: teacher.email,
          [t('admin.journal.subjectHeader')]: teacher.course,
          [t('admin.journal.groupsHeader')]: (teacher.groups || []).join(', '),
        }));
        break;

      case 'students':
        fileName = 'Students';
        sheetName = t('admin.journal.students');
        excelData = data.map((student, idx) => ({
          [t('admin.journal.number')]: idx + 1,
          [t('admin.journal.fullNameHeader')]: student.name,
          [t('admin.journal.emailHeader')]: student.email,
          [t('admin.journal.passwordHeader')]: student.password,
          [t('admin.journal.groupHeader')]: student.group,
          [t('admin.journal.coursesCompletedHeader')]: student.courses,
          [t('admin.journal.statusHeader')]: student.status,
        }));
        break;

      case 'groups':
        fileName = 'Groups';
        sheetName = t('admin.journal.groups');
        excelData = data.map((group, idx) => ({
          [t('admin.journal.number')]: idx + 1,
          [t('admin.journal.groupHeader')]: group.name,
          [t('admin.journal.assignedCoursesHeader')]: (group.courses || []).join(', '),
          [t('admin.journal.studentsCountHeader')]: group.studentsCount,
          [t('admin.journal.curatorHeader')]: group.curator,
        }));
        break;

      default:
        return;
    }

    if (excelData.length === 0) {
      alert(t('admin.journal.noData'));
      return;
    }

    try {
      // Создаем рабочую книгу
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Генерируем файл и скачиваем
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `${fileName}_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };

  // ПРОСТОЙ ЖУРНАЛ ДЛЯ СТУДЕНТА (старый вид)
  if (!isAdmin) {
    const studentCourses = [
      { id: 1, code: 'ПМ02', name: 'Составление алгоритма и создание блок-схемы на основе спецификации программного обеспечения.', teacher: 'Мартынцов Николай Викторович' }
    ];
    return (
      <div className="bg-white min-h-screen">
        <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>
        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ЖУРНАЛ</h1>
            </div>
            <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Код предмета</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Название</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">ФИО преподавателя</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Операции</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentCourses.map((course, index) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 border border-gray-200 text-sm font-medium text-gray-900">{course.code}</td>
                        <td className="px-4 py-3 border border-gray-200 text-sm text-gray-900">{course.name}</td>
                        <td className="px-4 py-3 border border-gray-200 text-sm text-gray-900">{course.teacher}</td>
                        <td className="px-4 py-3 border border-gray-200 text-sm text-gray-900">
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPageChange) {
                                onPageChange('journal-detail');
                              }
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // АДМИН-ЖУРНАЛ (вкладки и разделы) - новый порядок согласно ТЗ
  // Создаём sidebarItems с переводами
  const sidebarItems = [
    { id: 'courses', label: t('admin.journal.courses'), icon: BookOpen },
    { id: 'groups', label: t('admin.journal.groups'), icon: UserCog },
    { id: 'students', label: t('admin.journal.students'), icon: Users },
    { id: 'teachers', label: t('admin.journal.teachers'), icon: GraduationCap },
    { id: 'settings', label: t('admin.journal.settings'), icon: Settings },
  ];

  return (
    <div className="bg-white min-h-screen flex">
      {/* Фиксированное боковое меню */}
      {isAdmin && (
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
          {/* Заголовок */}
          <div className="pt-20 mb-6">
            <h1 className="text-lg font-bold text-gray-900">{t('admin.journal.title')}</h1>
          </div>
          {/* Навигация */}
          <nav className="flex-1 flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSearchQuery(''); // Очищаем поиск при смене вкладки
                    setStudentGroupFilter(''); // Очищаем фильтр группы
                    if (item.id === 'students') {
                      setSelectedStudentGroup(''); // Сбрасываем фильтр при переходе на вкладку Студенты
                    }
                  }}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                    tab === item.id
                      ? 'bg-gray-100 text-blue-600 font-semibold'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Мобильное бургер-меню (скрытое по умолчанию) */}
      {isAdmin && (
        <>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-20 left-4 z-50 text-gray-600 hover:text-gray-900 text-2xl"
            aria-label="Меню"
          >
            {isMobileMenuOpen ? '✖' : '☰'}
          </button>
          {isMobileMenuOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/30 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="lg:hidden fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-lg flex flex-col p-5 z-50">
                <nav className="flex-1 flex flex-col gap-1 pt-20">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTab(item.id);
                          setSearchQuery(''); // Очищаем поиск при смене вкладки
                          setStudentGroupFilter(''); // Очищаем фильтр группы
                          if (item.id === 'students') {
                            setSelectedStudentGroup(''); // Сбрасываем фильтр при переходе на вкладку Студенты
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                          tab === item.id
                            ? 'bg-gray-100 text-blue-600 font-semibold'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
                <button
                  className="flex items-center gap-3 text-gray-400 hover:text-red-500 py-2 px-3 rounded-md transition-all duration-200 hover:bg-gray-50 mt-auto"
                  onClick={() => {
                    console.log('Выйти');
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Выйти</span>
                </button>
              </aside>
            </>
          )}
        </>
      )}

      {/* Основной контент */}
      <main className={`flex-1 ${isAdmin ? 'lg:ml-[240px]' : ''}`}>
        <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>

        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {!isAdmin && (
              <div className="mb-2">
                <h1 className="text-[28px] font-bold text-gray-900">ЖУРНАЛ</h1>
              </div>
            )}
            {isAdmin && (
              <>
                {/* Заголовок */}
                <div className="mb-6">
                  <h1 className="text-[28px] font-bold text-gray-900">
                    {sidebarItems.find(item => item.id === tab)?.label || 'Курсы'}
                  </h1>
                </div>

            {/* Модалки: Подробнее / Редактировать / Удалить */}
            {detailCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.journal.details')}</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="text-gray-500">{t('admin.journal.name')}:</span> {detailCourse.name}</p>
                  <p><span className="text-gray-500">{t('admin.journal.teacher')}:</span> {detailCourse.teacher}</p>
                  <p><span className="text-gray-500">{t('admin.journal.groups')}:</span> {(detailCourse.groups||[]).join(', ')}</p>
                  <p><span className="text-gray-500">{t('admin.journal.status')}:</span> {detailCourse.status || (detailCourse.code==='ООД14'?t('admin.journal.archive'):t('admin.journal.active'))}</p>
                  <p><span className="text-gray-500">{t('admin.journal.description')}:</span> {detailCourse.description || 'Практический курс по составлению алгоритмов и созданию блок-схем.'}</p>
                  {detailCourse.updatedAt && (
                    <p><span className="text-gray-500">{t('admin.journal.updateDate')}:</span> {detailCourse.updatedAt}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={()=>setDetailCourse(null)}>{t('admin.journal.close')}</button>
                  <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors" onClick={()=>{setEditCourse(detailCourse); setDetailCourse(null);}}>{t('admin.journal.edit')}</button>
                </div>
              </div>
            </div>
          )}

          {editCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.journal.edit')} {t('admin.journal.name').toLowerCase()}</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.code} placeholder={t('admin.journal.code')} />
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.name} placeholder={t('admin.journal.name')} />
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.teacher} placeholder={t('admin.journal.teacher')} />
                  <select className="px-3 py-2 border rounded-lg" defaultValue={editCourse.code==='ООД14'?t('admin.journal.archive'):t('admin.journal.active')}>
                    <option>{t('admin.journal.active')}</option>
                    <option>{t('admin.journal.archive')}</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={()=>setEditCourse(null)}>{t('admin.journal.cancel')}</button>
                  <button className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors" onClick={()=>setEditCourse(null)}>{t('admin.journal.save')}</button>
                </div>
              </div>
            </div>
          )}

          {deleteCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.journal.delete')} {t('admin.journal.name').toLowerCase()}?</h3>
                <p className="text-sm text-gray-700">
                  {t('admin.journal.deleteConfirm')} "{deleteCourse.name}"? {t('admin.journal.cannotUndo')}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={()=>setDeleteCourse(null)}>{t('admin.journal.cancel')}</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors" onClick={()=>setDeleteCourse(null)}>{t('admin.journal.delete')}</button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно с курсами студента */}
          {selectedStudentCourses && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedStudentCourses(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-lg p-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t('admin.journal.courses')} {selectedStudentCourses.name}
                  </h3>
                  <button
                    onClick={() => setSelectedStudentCourses(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {selectedStudentCourses.courseDetails && selectedStudentCourses.courseDetails.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStudentCourses.courseDetails.map((course, idx) => (
                      <div key={idx} className="text-sm text-gray-700 py-1">
                        <span className="font-medium">• {course.code}</span> — {course.name} — <span className="text-gray-600">{course.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-2">
                    Нет данных
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedStudentCourses(null)}
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно изменения роли пользователя */}
          {selectedUserForEdit && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForEdit(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.settings.changeRole')}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">{t('admin.settings.currentName')}:</span> <span className="text-gray-900 ml-2">{selectedUserForEdit.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('admin.journal.emailHeader')}:</span> <span className="text-gray-900 ml-2">{selectedUserForEdit.email}</span>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-2">{t('admin.settings.selectNewRole')}:</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                      <option>{t('admin.settings.student')}</option>
                      <option>{t('admin.settings.teacher')}</option>
                      <option>{t('admin.settings.administrator')}</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedUserForEdit(null)}
                  >
                    {t('admin.journal.cancel')}
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    onClick={() => setSelectedUserForEdit(null)}
                  >
                    {t('admin.settings.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно сброса пароля */}
          {selectedUserForPassword && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForPassword(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('admin.settings.resetPassword')}</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {t('admin.settings.resetPasswordConfirm')} {selectedUserForPassword.name}?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedUserForPassword(null)}
                  >
                    {t('admin.journal.cancel')}
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    onClick={() => setSelectedUserForPassword(null)}
                  >
                    {t('admin.settings.yesReset')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно удаления пользователя */}
          {selectedUserForDelete && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForDelete(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Удалить пользователя?</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Вы уверены, что хотите удалить пользователя "{selectedUserForDelete.name}"? Это действие нельзя отменить.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedUserForDelete(null)}
                  >
                    Отмена
                  </button>
                  <button 
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    onClick={() => setSelectedUserForDelete(null)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Курсы */}
          {isAdmin && tab === 'courses' && (
            <div>
              {/* Кнопки действий, фильтр и поиск */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Поиск слева */}
                <div className="relative w-full sm:w-[320px]">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={courseStatus} 
                  onChange={(e) => setCourseStatus(e.target.value)}
                >
                  <option>{t('admin.journal.all')}</option>
                  <option>{t('admin.journal.active')}</option>
                  <option>{t('admin.journal.archive')}</option>
                </select>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddCourse(true)}
                >
                  + {t('admin.journal.addCourse')}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                  {t('admin.journal.exportExcel')}
                </button>
              </div>
              
              {/* Таблица курсов */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.number')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.codeHeader')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.name')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.teacherHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.groupsHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.statusHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.dateHeader')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.code}</td>
                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.teacher}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{(row.groups || []).join(', ')}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.status === 'Активен' ? t('admin.journal.active') : row.status === 'Неактивен' ? t('admin.journal.inactive') : row.status}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.updatedAt}</td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title={t('admin.journal.view')}
                              onClick={() => setDetailCourse(row)}
                            >
                              <EyeIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title={t('admin.journal.edit')}
                              onClick={() => setEditCourse(row)}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                              title={t('admin.journal.delete')}
                              onClick={() => setDeleteCourse(row)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getFilteredData().length === 0 && (
                      <tr>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={8}>
                          {searchQuery ? `${t('admin.journal.noMatches')} "${searchQuery}"` : t('admin.journal.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Преподаватели */}
          {isAdmin && tab === 'teachers' && (
            <div>
              {/* Кнопки действий и поиск */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Поиск слева */}
                <div className="relative w-full sm:w-[320px]">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddTeacher(true)}
                >
                  + {t('admin.journal.addTeacher')}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                  {t('admin.journal.exportExcel')}
                </button>
              </div>
              
              {/* Таблица преподавателей */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.number')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.fullNameTeacherHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.phoneHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.subjectHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.groupsHeader')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.phone}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.course}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{(row.groups || []).join(', ')}</td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Редактировать"
                              onClick={() => setEditCourse(row)}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                              title="Удалить"
                              onClick={() => setDeleteCourse(row)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getFilteredData().length === 0 && (
                      <tr>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={6}>
                          {searchQuery ? `${t('admin.journal.noMatches')} "${searchQuery}"` : t('admin.journal.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Студенты */}
          {isAdmin && tab === 'students' && (
            <div>
              {/* Кнопки действий, фильтр по группе и поиск */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Поиск слева */}
                <div className="relative w-full sm:w-[320px]">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
                {/* Фильтр групп справа от поиска */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={selectedStudentGroup}
                  onChange={(e) => {
                    setSelectedStudentGroup(e.target.value);
                    setStudentGroupFilter(''); // Очищаем старый фильтр
                  }}
                >
                  <option value="">{t('admin.journal.allGroups')}</option>
                  {getAllGroups().map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                {studentGroupFilter && (
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      setStudentGroupFilter('');
                      setTab('groups');
                    }}
                  >
                    ← {t('admin.journal.backToGroups')}
                  </button>
                )}
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddStudent(true)}
                >
                  + {t('admin.journal.addStudent')}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                  {t('admin.journal.exportExcel')}
                </button>
              </div>

              {/* Проверка: показывать ли сообщение по умолчанию или таблицу */}
              {!searchQuery && !selectedStudentGroup && !studentGroupFilter ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-gray-500">
                    ⚙️ {t('admin.journal.selectGroup')}
                  </p>
                </div>
              ) : (
                /* Таблица студентов */
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                {!selectedStudentGroup && !studentGroupFilter ? (
                  /* Группировка по группам */
                  <div>
                    {Object.entries(getStudentsGroupedByGroup(getFilteredData())).map(([groupName, students], groupIdx) => (
                      <div key={groupName} className={groupIdx > 0 ? 'mt-4 border-t border-gray-200' : ''}>
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-800">
                            {t('admin.journal.group')} {groupName}
                          </h3>
                        </div>
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">ФИО</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Email</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Пароль</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Пройдено курсов</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Статус</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-gray-100 transition-colors">
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                                <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">{row.name}</td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.email}</td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.password}</td>
                                <td 
                                  className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                  onClick={() => row.courseDetails && row.courseDetails.length > 0 && setSelectedStudentCourses(row)}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <span>{formatCoursesCount(row.courses)}</span>
                                    {row.courseDetails && row.courseDetails.length > 0 && (
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    )}
                                  </div>
                                </td>
                                <td className={`px-4 py-3 border border-gray-200 text-center text-sm ${row.status === 'Активен' ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {row.status}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                      title="Просмотр"
                                      onClick={() => setDetailCourse(row)}
                                    >
                                      <EyeIcon />
                                    </button>
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                      title="Редактировать"
                                      onClick={() => setEditCourse(row)}
                                    >
                                      <EditIcon />
                                    </button>
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                                      title="Удалить"
                                      onClick={() => setDeleteCourse(row)}
                                    >
                                      <TrashIcon />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    {Object.keys(getStudentsGroupedByGroup(getFilteredData())).length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        {searchQuery ? `${t('admin.journal.noMatches')} "${searchQuery}"` : t('admin.journal.noData')}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Обычная таблица при выборе конкретной группы или поиске */
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.number')}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.fullNameHeader')}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.emailHeader')}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.passwordHeader')}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.groupHeader')}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.coursesCompletedHeader')}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.statusHeader')}</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredData().map((row, idx) => {
                        const isExpanded = isGroupExpanded(row.group);
                        return (
                          <React.Fragment key={row.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                              <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">{row.name}</td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.email}</td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.password}</td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                                <button
                                  onClick={() => handleGroupInStudentsClick(row.group)}
                                  className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors font-medium flex items-center justify-center gap-1"
                                >
                                  <span>{isExpanded ? '▲' : '▼'}</span>
                                  <span>{row.group}</span>
                                </button>
                              </td>
                              <td 
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                onClick={() => row.courseDetails && row.courseDetails.length > 0 && setSelectedStudentCourses(row)}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>{formatCoursesCount(row.courses)}</span>
                                  {row.courseDetails && row.courseDetails.length > 0 && (
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                              </td>
                              <td className={`px-4 py-3 border border-gray-200 text-center text-sm ${row.status === 'Активен' ? 'text-gray-900' : 'text-gray-500'}`}>
                                {row.status === 'Активен' ? t('admin.journal.active') : row.status === 'Неактивен' ? t('admin.journal.inactive') : row.status}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                    title={t('admin.journal.view')}
                                    onClick={() => setDetailCourse(row)}
                                  >
                                    <EyeIcon />
                                  </button>
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                    title="Редактировать"
                                    onClick={() => setEditCourse(row)}
                                  >
                                    <EditIcon />
                                  </button>
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                                    title="Удалить"
                                    onClick={() => setDeleteCourse(row)}
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Вложенная таблица студентов группы */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={8} className="px-0 py-0 border-0 bg-gray-50">
                                  <div className="pt-2 pb-3 border-t border-gray-200 transition-all duration-200 ease-in-out">
                                    <div className="text-sm text-gray-500 mb-3 ml-6">
                                      {t('admin.journal.studentsOfGroup')} {row.group}
                                    </div>
                                    <div className="ml-6 mr-4">
                                      {getStudentsByGroup(row.group).length > 0 ? (
                                        <table className="w-full border-collapse bg-white">
                                          <thead className="bg-gray-50">
                                            <tr>
                                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.number')}</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.fullNameHeader')}</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.emailHeader')}</th>
                                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.passwordHeader')}</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {getStudentsByGroup(row.group).map((student, studentIdx) => (
                                              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2 border border-gray-200 text-center text-sm text-gray-900">{studentIdx + 1}</td>
                                                <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">{student.name}</td>
                                                <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">{student.email}</td>
                                                <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">{student.password}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                          {t('admin.journal.noStudentsInGroup')}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {getFilteredData().length === 0 && (
                        <tr>
                          <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={8}>
                            {searchQuery ? `${t('admin.journal.noMatches')} "${searchQuery}"` : t('admin.journal.noData')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                </div>
              )}
            </div>
          )}

          {/* Группы */}
          {isAdmin && tab === 'groups' && (
            <div>
              {/* Кнопки действий и поиск */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                {/* Поиск слева */}
                <div className="relative w-full sm:w-[320px]">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddGroup(true)}
                >
                  + {t('admin.journal.addGroup')}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                  {t('admin.journal.exportExcel')}
                </button>
              </div>
              
              {/* Таблица групп */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.number')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.groupHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.assignedCoursesHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.studentsCountHeader')}</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.curatorHeader')}</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">{t('admin.journal.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                          <button
                            onClick={() => handleGroupClick(row.name)}
                            className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors"
                          >
                            {row.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                          {(row.courses || []).join(', ')}
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.studentsCount}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{row.curator}</td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Редактировать"
                              onClick={() => setEditCourse(row)}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                              title="Удалить"
                              onClick={() => setDeleteCourse(row)}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getFilteredData().length === 0 && (
                      <tr>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={6}>
                          {searchQuery ? `${t('admin.journal.noMatches')} "${searchQuery}"` : t('admin.journal.noData')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Настройки */}
          {isAdmin && tab === 'settings' && (
            <div className="space-y-4">
              {!showUserManagement ? (
                /* Основной экран настроек */
                <>
                  {/* Профиль администратора */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">{t('admin.settings.adminProfile')}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.fullName')}</label>
                        <input
                          type="text"
                          value={adminProfile.name}
                          onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.email')}</label>
                        <input
                          type="email"
                          value={adminProfile.email}
                          onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.phone')}</label>
                        <input
                          type="tel"
                          value={adminProfile.phone}
                          onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="pt-2">
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                          {t('admin.settings.changePassword')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Управление пользователями */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">{t('admin.settings.userManagement')}</h3>
                    <button
                      onClick={() => setShowUserManagement(true)}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    >
                      {t('admin.settings.userManagement')}
                    </button>
                  </div>

                  {/* Платформа */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">{t('admin.settings.platform')}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.platformName')}</label>
                        <input
                          type="text"
                          value={platformSettings.name}
                          onChange={(e) => setPlatformSettings({...platformSettings, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.language')}</label>
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          <option value="ru">{t('admin.settings.russian')}</option>
                          <option value="kk">{t('admin.settings.kazakh')}</option>
                          <option value="en">{t('admin.settings.english')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">{t('admin.settings.supportEmail')}</label>
                        <input
                          type="email"
                          value={platformSettings.supportEmail}
                          onChange={(e) => setPlatformSettings({...platformSettings, supportEmail: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <label className="text-sm text-gray-600">{t('admin.settings.maintenanceMode')}</label>
                        <button
                          onClick={() => setPlatformSettings({...platformSettings, maintenanceMode: !platformSettings.maintenanceMode})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            platformSettings.maintenanceMode ? 'bg-[#2563EB]' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              platformSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка сохранения */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <button
                      onClick={() => {
                        setShowSaveNotification(true);
                        setTimeout(() => setShowSaveNotification(false), 3000);
                      }}
                      className="w-full px-6 py-3 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                      {t('admin.settings.saveChanges')}
                    </button>
                  </div>

                  {/* Уведомление о сохранении */}
                  {showSaveNotification && (
                    <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                      {t('admin.settings.changesSaved')}
                    </div>
                  )}
                </>
              ) : (
                /* Страница управления пользователями */
                <div>
                  {/* Кнопка "Назад" */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowUserManagement(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      {t('admin.settings.backToSettings')}
                    </button>
                  </div>

                  {/* Заголовок */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">{t('admin.settings.userManagementTitle')}</h2>
                  </div>

                  {/* Фильтр и кнопка добавления */}
                  <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="">{t('admin.settings.allUsers')}</option>
                      <option value={t('admin.settings.onlyStudents')}>{t('admin.settings.onlyStudents')}</option>
                      <option value={t('admin.settings.onlyTeachers')}>{t('admin.settings.onlyTeachers')}</option>
                    </select>
                    <button 
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                      onClick={() => {/* TODO: добавить модальное окно */}}
                    >
                      + {t('admin.settings.addUser')}
                    </button>
                  </div>
                  
                  {/* Таблица пользователей */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.settings.number')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.journal.fullNameHeader')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.journal.emailHeader')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.settings.role')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.journal.statusHeader')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">{t('admin.journal.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().map((user, idx) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{idx + 1}</td>
                            <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">{user.name}</td>
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{user.email}</td>
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">{user.role}</td>
                            <td className={`px-4 py-3 border border-gray-200 text-center text-sm ${user.status === 'Активен' ? 'text-gray-900' : 'text-gray-500'}`}>
                              {user.status === 'Активен' ? t('admin.journal.active') : user.status === 'Неактивен' ? t('admin.journal.inactive') : user.status}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  onClick={() => setSelectedUserForEdit(user)}
                                >
                                  {t('admin.settings.change')}
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  onClick={() => setSelectedUserForPassword(user)}
                                >
                                  {t('admin.settings.resetPassword')}
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  onClick={() => setSelectedUserForDelete(user)}
                                >
                                  {t('admin.journal.delete')}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {getFilteredUsers().length === 0 && (
                          <tr>
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={6}>
                              {t('admin.journal.noData')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
              </>
            )}

          {!isAdmin && (
            <div className="bg-white border rounded-xl shadow p-8 text-center text-gray-700 mt-8">
              Обычный журнал для студентов/преподавателей (админ-вкладки скрыты).
            </div>
          )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Journal;