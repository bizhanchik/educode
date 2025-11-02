import React, { useState } from 'react';
import { BookOpen, Users, GraduationCap, UserCog, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import BackButton from '../components/BackButton.jsx';

// MOCK DATA (по вашему ТЗ)
const mockCourses = [
  { id: 1, code: 'ПМ02', name: 'Алгоритмизация и блок-схемы', teacher: 'Мартынцов Н.В.', groups: ['ПО2402', 'ПО2403'], status: 'Активен', updatedAt: '12.09.2025', description: 'Практический курс по составлению алгоритмов и созданию блок-схем.' },
  { id: 2, code: 'ПМ01', name: 'Администрирование баз данных', teacher: 'Ермуханбетов Ж.С.', groups: ['ПО2402'], status: 'Активен', updatedAt: '15.09.2025', description: 'Управление БД, резервное копирование, доступ и безопасность.' },
  { id: 3, code: 'ООД14', name: 'Графика и проектирование', teacher: 'Галимпанова А.С.', groups: ['ПО2401', 'ПО2403'], status: 'Архив', updatedAt: '07.09.2025', description: 'Основы графики и проектной документации.' },
];
const mockTeachers = [
  { id: 1, name: 'Мартынцов Николай Викторович', email: 'martyn@edu.kz', course: 'Составление алгоритма и создание блок-схемы на основе спецификации программного обеспечения', students: 32 },
  { id: 2, name: 'Ермуханбетов Жанторе Серикович', email: 'j.er@edu.kz', course: 'Администрирование баз данных', students: 28 },
  { id: 3, name: 'Галипанова Асель Сергеевна', email: 'a.galipanova@edu.kz', course: 'Графика и проектирование', students: 19 },
];
const mockStudents = [
  { id: 1, name: 'Айгерим К.', email: 'aigerim@edu.kz', group: 'ИТ-21', courses: 2, status: 'Активен' },
  { id: 2, name: 'Рахат Т.', email: 'rakh@edu.kz', group: 'ИТ-22', courses: 3, status: 'Неактивен' },
];
const mockGroups = [
  { id: 1, name: 'ИТ-21', students: 15, curator: 'Сауле А.' },
  { id: 2, name: 'ПМ-22', students: 12, curator: 'Мартынцов Н.В.' },
];

const Journal = ({ onPageChange }) => {
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
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  // Admin courses filters/search/sort/pagination
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatus, setCourseStatus] = useState('Все');
  const [sortKey, setSortKey] = useState(''); // 'teacher' | 'status' | 'updatedAt'
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [refreshKey, setRefreshKey] = useState(0);

  const studentsFiltered = mockStudents.filter(s =>
    (studentGroup ? s.group === studentGroup : true) &&
    (studentSearch ? (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.email.toLowerCase().includes(studentSearch.toLowerCase())) : true)
  );

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

  // АДМИН-ЖУРНАЛ (вкладки и разделы)
  const sidebarItems = [
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'teachers', label: 'Преподаватели', icon: GraduationCap },
    { id: 'students', label: 'Студенты', icon: Users },
    { id: 'groups', label: 'Группы', icon: UserCog },
    { id: 'statistics', label: 'Статистика', icon: BarChart3 },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <div className="bg-white min-h-screen flex">
      {/* Фиксированное боковое меню */}
      {isAdmin && (
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
          {/* Заголовок */}
          <div className="pt-20 mb-6">
            <h1 className="text-lg font-bold text-gray-900">ЖУРНАЛ КУРСОВ</h1>
          </div>
          {/* Навигация */}
          <nav className="flex-1 flex flex-col gap-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
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
                <div className="mb-2">
                  <h1 className="text-[28px] font-bold text-gray-900">
                    {sidebarItems.find(item => item.id === tab)?.label || 'Курсы'}
                  </h1>
                </div>
                {tab === 'courses' && (
              <div className="mb-2 flex justify-end">
                <div className="relative w-72">
                  <input
                    type="text"
                    placeholder="Поиск по названию курса или преподавателю"
                    value={courseSearch}
                    onChange={(e) => { setCourseSearch(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Модалки: Подробнее / Редактировать / Удалить */}
            {detailCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Детали курса</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><span className="text-gray-500">Название:</span> {detailCourse.name}</p>
                  <p><span className="text-gray-500">Преподаватель:</span> {detailCourse.teacher}</p>
                  <p><span className="text-gray-500">Группы:</span> {(detailCourse.groups||[]).join(', ')}</p>
                  <p><span className="text-gray-500">Статус:</span> {detailCourse.status || (detailCourse.code==='ООД14'?'Архив':'Активен')}</p>
                  <p><span className="text-gray-500">Описание:</span> {detailCourse.description || 'Практический курс по составлению алгоритмов и созданию блок-схем.'}</p>
                  {detailCourse.updatedAt && (
                    <p><span className="text-gray-500">Дата обновления:</span> {detailCourse.updatedAt}</p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setDetailCourse(null)}>Закрыть</button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={()=>{setEditCourse(detailCourse); setDetailCourse(null);}}>Редактировать</button>
                </div>
              </div>
            </div>
          )}

          {editCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Редактировать курс</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.code} placeholder="Код предмета" />
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.name} placeholder="Название курса" />
                  <input className="px-3 py-2 border rounded-lg" defaultValue={editCourse.teacher} placeholder="Преподаватель" />
                  <select className="px-3 py-2 border rounded-lg" defaultValue={editCourse.code==='ООД14'?'Архив':'Активен'}>
                    <option>Активен</option>
                    <option>Архив</option>
                  </select>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setEditCourse(null)}>Закрыть</button>
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700" onClick={()=>setEditCourse(null)}>Сохранить</button>
                </div>
              </div>
            </div>
          )}

          {deleteCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Удалить курс?</h3>
                <p className="text-sm text-gray-700">Вы уверены, что хотите удалить этот курс?</p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setDeleteCourse(null)}>Отмена</button>
                  <button className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700" onClick={()=>setDeleteCourse(null)}>Удалить</button>
                </div>
              </div>
            </div>
          )}

          {/* Курсы */}
          {(!isAdmin || tab === 'courses') && (
            <div>
              {isAdmin && (
                <>
                  <div className="mt-8 mb-4 flex flex-wrap items-center gap-3">
                    <select className="px-3 py-2 border rounded-lg text-sm" value={courseStatus} onChange={e=>{setCourseStatus(e.target.value); setPage(1);}}>
                      <option>Все</option>
                      <option>Активен</option>
                      <option>Архив</option>
                    </select>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100">Добавить курс</button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100">Экспорт в Excel</button>
                  </div>
                  
                </>
              )}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Код предмета</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Название курса</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 cursor-pointer" onClick={()=>{setSortKey('teacher'); setSortAsc(k=> sortKey==='teacher' ? !k : true);}}>Преподаватель</th>
                      {isAdmin && (<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Группы</th>)}
                      {isAdmin && (<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 cursor-pointer" onClick={()=>{setSortKey('status'); setSortAsc(k=> sortKey==='status' ? !k : true);}}>Статус</th>)}
                      {isAdmin && (<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 cursor-pointer" onClick={()=>{setSortKey('updatedAt'); setSortAsc(k=> sortKey==='updatedAt' ? !k : true);}}>Дата обновления</th>)}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCourses
                      .filter(c => (courseStatus==='Все' ? true : c.status===courseStatus))
                      .filter(c => !courseSearch || c.name.toLowerCase().includes(courseSearch.toLowerCase()) || c.teacher.toLowerCase().includes(courseSearch.toLowerCase()))
                      .sort((a,b)=>{
                        if(!sortKey) return 0;
                        let av=a[sortKey], bv=b[sortKey];
                        if(sortKey==='updatedAt'){
                          const [da,ma,ya]=av.split('.').map(Number);
                          const [db,mb,yb]=bv.split('.').map(Number);
                          const ta=new Date(ya,ma-1,da).getTime();
                          const tb=new Date(yb,mb-1,db).getTime();
                          return sortAsc ? ta-tb : tb-ta;
                        }
                        return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
                      })
                      .slice((page-1)*pageSize, page*pageSize)
                      .map((row, idx) => {
                      const shortTeacher = row.teacher;
                      const status = row.status;
                      return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200 text-center">{(page-1)*pageSize + idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center">{row.code}</td>
                        <td className="px-4 py-3 border border-gray-200 text-left">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200 text-center">{shortTeacher}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 border border-gray-200 text-center">
                            {(row.groups || []).join(', ')}
                          </td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 border border-gray-200 text-center">{status}</td>
                        )}
                        {isAdmin && (
                          <td className="px-4 py-3 border border-gray-200 text-center">{row.updatedAt}</td>
                        )}
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <button className="mx-1 text-gray-500 hover:text-blue-600" title="Подробнее" onClick={()=>setDetailCourse(row)}>Подробнее</button>
                          {isAdmin && (<>
                            <button className="mx-1 text-gray-500 hover:text-blue-600" title="Редактировать" onClick={()=>setEditCourse(row)}>Редактировать</button>
                            <button className="mx-1 text-gray-500 hover:text-red-600" title="Удалить" onClick={()=>setDeleteCourse(row)}>Удалить</button>
                          </>)}
                        </td>
                      </tr>
                      );
                    })}
                    {mockCourses
                      .filter(c => (courseStatus==='Все' ? true : c.status===courseStatus))
                      .filter(c => !courseSearch || c.name.toLowerCase().includes(courseSearch.toLowerCase()) || c.teacher.toLowerCase().includes(courseSearch.toLowerCase()))
                      .length === 0 && (
                        <tr>
                          <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600" colSpan={8}>
                            Нет совпадений по запросу "{courseSearch}"
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
                {/* Пагинация убрана по запросу */}
              </div>
            </div>
          )}

          {/* Преподаватели */}
          {isAdmin && tab === 'teachers' && (
            <div>
              <div className="mt-8 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Добавить преподавателя</button>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Поиск по ФИО или email"
                    value={teacherSearch}
                    onChange={(e)=>setTeacherSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
              </div>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">ФИО преподавателя</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Преподаваемый курс</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Кол-во студентов</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTeachers
                      .filter(t => !teacherSearch || (t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || t.email.toLowerCase().includes(teacherSearch.toLowerCase())))
                      .map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.email}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.course}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.students}</td>
                        <td className="px-4 py-3 border border-gray-200">
                          <button className="mx-1 text-gray-500 hover:text-blue-600" title="Редактировать">✏️</button>
                          <button className="mx-1 text-gray-500 hover:text-red-600" title="Удалить">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Студенты */}
          {isAdmin && tab === 'students' && (
            <div>
              <div className="mt-8 mb-4 flex items-center gap-3">
                <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Поиск по имени или email" value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} />
                <select className="px-3 py-2 border rounded-lg text-sm" value={studentGroup} onChange={e=>setStudentGroup(e.target.value)}>
                  <option value="">Все группы</option>
                  <option value="ИТ-21">ИТ-21</option>
                  <option value="ИТ-22">ИТ-22</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Добавить студента</button>
              </div>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">ФИО студента</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Группа</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Пройдено курсов</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Статус</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Операции</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsFiltered.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.email}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.group}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.courses}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.status}</td>
                        <td className="px-4 py-3 border border-gray-200">
                          <button className="mx-1 text-gray-500 hover:text-blue-600" title="Профиль">👁️</button>
                          <button className="mx-1 text-gray-500 hover:text-blue-600" title="Редактировать">✏️</button>
                          <button className="mx-1 text-gray-500 hover:text-red-600" title="Удалить">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Группы */}
          {isAdmin && tab === 'groups' && (
            <div>
              <div className="mt-8 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Создать группу</button>
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Поиск по названию или куратору"
                    value={groupSearch}
                    onChange={(e)=>setGroupSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
                  </svg>
                </div>
              </div>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">№</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Название группы</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Количество студентов</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Куратор</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockGroups
                      .filter(g => !groupSearch || (g.name.toLowerCase().includes(groupSearch.toLowerCase()) || g.curator.toLowerCase().includes(groupSearch.toLowerCase())))
                      .map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border border-gray-200">{idx + 1}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.name}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.students}</td>
                        <td className="px-4 py-3 border border-gray-200">{row.curator}</td>
                        <td className="px-4 py-3 border border-gray-200">
                          <button className="mx-1 text-gray-500 hover:text-blue-600" title="Редактировать">✏️</button>
                          <button className="mx-1 text-gray-500 hover:text-red-600" title="Удалить">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Статистика */}
          {isAdmin && tab === 'statistics' && (
            <div className="text-gray-600 text-sm">Статистика — карточки и диаграммы (позже добавим Recharts).</div>
          )}

          {/* Настройки */}
          {isAdmin && tab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Основные</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Название платформы" defaultValue="EduCode" />
                  <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Контактный email" defaultValue="admin@educode.com" />
                  <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Подпись администратора" defaultValue="Администратор EduCode" />
                </div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Сохранить изменения</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Безопасность</h3>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm cursor-not-allowed opacity-60">Сбросить пароль администратора</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Информация о версии</h3>
                <p className="text-sm text-gray-700">Версия: 1.0.0 • Обновлено: 2025-10-30</p>
              </div>
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