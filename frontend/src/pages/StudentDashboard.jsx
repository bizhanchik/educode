import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  BarChart3,
  LogOut,
  Eye,
  Search,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { fetchSubjects, fetchSubjectWithLessons } from "../utils/curriculumApi.js";
import { getTeacherAssignments } from "../utils/teacherAssignmentsApi.js";
import { progressApi } from "../utils/progressApi.js";

const PAGE_SIZE = 100;

const StudentDashboard = ({ onPageChange }) => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  // Courses state
  const [coursesData, setCoursesData] = useState({
    items: [],
    loading: false,
    error: "",
    search: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});

  // Journal state
  const [journalData, setJournalData] = useState({
    courses: [],
    grades: [],
    loading: false,
    error: "",
  });

  const studentNavItems = [
    { id: "dashboard", label: "Главная панель", icon: BarChart3 },
    { id: "courses", label: "Курсы", icon: BookOpen },
    { id: "journal", label: "Журнал", icon: GraduationCap },
    { id: "logout", label: "Выйти", icon: LogOut },
  ];

  // Load user progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) return;
      try {
        const summary = await progressApi.getUserProgress(user.id);
        const progressMap = {};
        if (summary?.lessons) {
          summary.lessons.forEach((lesson) => {
            progressMap[lesson.lesson_id] = lesson.completed;
          });
        }
        setLessonProgress(progressMap);
      } catch (error) {
        console.error("[StudentDashboard] Error loading progress:", error);
      }
    };
    loadProgress();
  }, [user?.id]);

  // Fetch courses assigned to student
  const fetchCourses = useCallback(async () => {
    if (currentView !== "courses" && currentView !== "dashboard") return;
    setCoursesData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // Get all subjects
      const response = await fetchSubjects({ size: PAGE_SIZE });
      const allSubjects = response.data?.subjects || [];
      console.log('[StudentDashboard] 🔍 All subjects from API:', allSubjects.map(s => ({ 
        id: s.id, 
        name: s.name, 
        status: s.status,
        fullObject: s  // Полный объект для отладки
      })));

      // Get student's group
      const studentGroupId = user?.group_id;
      if (!studentGroupId) {
        setCoursesData((prev) => ({
          ...prev,
          items: [],
          loading: false,
        }));
        return;
      }

      // Get all teacher assignments for this group
      const assignmentsResponse = await getTeacherAssignments({ group_id: studentGroupId, size: 100 });
      const assignments = assignmentsResponse.data?.assignments || [];
      const assignedSubjectIds = new Set(
        assignments.map(a => a.subject_id || a.subject?.id).filter(Boolean)
      );
      console.log('[StudentDashboard] Assigned subject IDs:', Array.from(assignedSubjectIds));

      // Filter subjects to only those assigned to student's group and not archived
      const assignedSubjects = allSubjects.filter(s => {
        const isAssigned = assignedSubjectIds.has(s.id);
        if (!isAssigned) {
          console.log('[StudentDashboard] Subject not assigned:', s.id, s.name);
          return false;
        }
        
        // Проверяем, что курс не в архиве - СТРОГАЯ ПРОВЕРКА
        const status = s.status || "";
        const statusStr = String(status).trim();
        const statusLower = statusStr.toLowerCase();
        
        // Проверяем все возможные варианты статуса "Архив"
        const isArchived = 
          statusLower === "архив" || 
          statusLower === "archive" || 
          statusLower === "неактивен" ||
          statusLower === "inactive" ||
          statusStr === "Архив" ||
          statusStr === "Archive" ||
          statusStr === "Неактивен" ||
          statusStr === "Inactive";
        
        if (isArchived) {
          console.log('[StudentDashboard] ❌ FILTERING OUT ARCHIVED COURSE:', {
            id: s.id,
            name: s.name,
            status: status,
            statusStr: statusStr,
            statusLower: statusLower
          });
          return false; // НЕ показываем архивные курсы
        }
        
        // Показываем только активные курсы (статус "Активен" или пустой/null)
        console.log('[StudentDashboard] ✅ SHOWING ACTIVE COURSE:', {
          id: s.id,
          name: s.name,
          status: status || 'null/empty (defaults to active)'
        });
        return true;
      });
      
      console.log('[StudentDashboard] Filtered subjects (not archived):', assignedSubjects.map(s => ({ id: s.id, name: s.name, status: s.status })));

      // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Фильтруем еще раз на всякий случай
      const finalFilteredSubjects = assignedSubjects.filter(s => {
        const status = s.status || "";
        const statusStr = String(status).trim().toLowerCase();
        const isArchived = 
          statusStr === "архив" || 
          statusStr === "archive" || 
          statusStr === "неактивен" ||
          statusStr === "inactive";
        
        if (isArchived) {
          console.log('[StudentDashboard] ⚠️ DOUBLE CHECK: Filtering out archived course:', s.id, s.name, 'status:', status);
          return false;
        }
        return true;
      });
      
      console.log('[StudentDashboard] ✅ Final filtered subjects count:', finalFilteredSubjects.length, 'out of', allSubjects.length);

      // Enrich with progress info
      const enrichedSubjects = await Promise.all(
        finalFilteredSubjects.map(async (subject) => {
          try {
            const subjectResponse = await fetchSubjectWithLessons(subject.id);
            const lessons = subjectResponse.data?.lessons || [];
            const completedLessons = lessons.filter(l => lessonProgress[l.id]).length;
            const progress = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

            return {
              id: subject.id,
              name: subject.name,
              code: subject.code || subject.name.substring(0, 4).toUpperCase(),
              progress,
              lessonsCount: lessons.length,
              completedLessons,
            };
          } catch (error) {
            console.error(`Failed to load lessons for subject ${subject.id}:`, error);
            return {
              id: subject.id,
              name: subject.name,
              code: subject.code || subject.name.substring(0, 4).toUpperCase(),
              progress: 0,
              lessonsCount: 0,
              completedLessons: 0,
            };
          }
        })
      );

      setCoursesData((prev) => ({
        ...prev,
        items: enrichedSubjects,
        loading: false,
      }));
    } catch (error) {
      setCoursesData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить курсы",
      }));
    }
  }, [currentView, user?.group_id, lessonProgress]);

  // Fetch journal data (grades and assignments)
  const fetchJournal = useCallback(async () => {
    if (currentView !== "journal") return;
    setJournalData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // Load courses for journal
      await fetchCourses();
      
      // TODO: Load actual grades and assignments from backend
      // For now, we'll use the courses data
      setJournalData((prev) => ({
        ...prev,
        courses: coursesData.items,
        grades: [], // TODO: Load from backend
        loading: false,
      }));
    } catch (error) {
      setJournalData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить журнал",
      }));
    }
  }, [currentView, coursesData.items, fetchCourses]);

  useEffect(() => {
    if (user?.role === "student") {
      fetchCourses();
      if (currentView === "journal") {
        fetchJournal();
      }
    }
  }, [user, fetchCourses, fetchJournal, currentView]);

  const handleChangeView = (viewId) => {
    if (viewId === "logout") {
      logout();
      return;
    }
    setCurrentView(viewId);
  };

  // Render Dashboard
  const renderDashboard = () => {
    const totalCourses = coursesData.items.length;
    const averageProgress = coursesData.items.length > 0
      ? Math.round(coursesData.items.reduce((sum, c) => sum + c.progress, 0) / coursesData.items.length)
      : 0;

    return (
      <div>
        <h1 className="text-[28px] font-bold text-gray-900 mb-6">Главная панель</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Мои курсы",
              value: totalCourses,
              icon: BookOpen,
              bgClass: "bg-blue-100",
              textClass: "text-blue-600",
            },
            {
              title: "Средний прогресс",
              value: `${averageProgress}%`,
              icon: GraduationCap,
              bgClass: "bg-green-100",
              textClass: "text-green-600",
            },
          ].map((card, idx) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${card.bgClass}`}>
                  <card.icon className={`w-6 h-6 ${card.textClass}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Последние курсы</h3>
          {coursesData.items.length === 0 ? (
            <p className="text-gray-500">У вас пока нет назначенных курсов</p>
          ) : (
            <div className="space-y-3">
              {coursesData.items.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{course.name}</p>
                    <p className="text-xs text-gray-500">Прогресс: {course.progress}%</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("courses");
                      setSelectedCourse(course);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Открыть →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Courses
  const renderCourses = () => {
    const filteredCourses = coursesData.search
      ? coursesData.items.filter(
          (c) =>
            c.name.toLowerCase().includes(coursesData.search.toLowerCase()) ||
            c.code.toLowerCase().includes(coursesData.search.toLowerCase())
        )
      : coursesData.items;

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Мои курсы</h1>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Поиск по названию или коду"
              value={coursesData.search}
              onChange={(e) =>
                setCoursesData((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {coursesData.error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {coursesData.error}
          </div>
        )}

        {coursesData.loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка курсов...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Курсы пока не назначены
            </h3>
            <p className="text-gray-600">Обратитесь к преподавателю или администратору</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-blue-600 h-24 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 break-words">
                    {course.name}
                  </h3>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Прогресс</span>
                      <span className="text-sm font-medium text-gray-900">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span>
                        {course.completedLessons}/{course.lessonsCount} уроков
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onPageChange &&
                        onPageChange("journal-detail", {
                          courseId: course.id,
                        });
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Продолжить
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render Journal
  const renderJournal = () => {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Журнал</h1>
        </div>

        {journalData.error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {journalData.error}
          </div>
        )}

        {journalData.loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка журнала...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Courses Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Мои курсы</h2>
              {coursesData.items.length === 0 ? (
                <p className="text-gray-500">У вас пока нет назначенных курсов</p>
              ) : (
                <div className="space-y-3">
                  {coursesData.items.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{course.name}</p>
                        <p className="text-xs text-gray-500">
                          Прогресс: {course.progress}% | {course.completedLessons}/{course.lessonsCount} уроков
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onPageChange &&
                            onPageChange("journal-detail", {
                              courseId: course.id,
                            });
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Просмотр
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grades Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Оценки</h2>
              {journalData.grades.length === 0 ? (
                <p className="text-gray-500">Оценки пока не выставлены</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Курс", "Задание", "Оценка", "Дата"].map((header) => (
                          <th
                            key={header}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {journalData.grades.map((grade, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 border-b border-gray-100">
                          <td className="px-4 py-3 text-sm text-gray-900">{grade.course}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{grade.assignment}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {grade.grade}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{grade.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case "courses":
        return renderCourses();
      case "journal":
        return renderJournal();
      case "dashboard":
        return renderDashboard();
      default:
        return renderDashboard();
    }
  };

  if (!user || user.role !== "student") {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Доступ ограничен</h2>
        <p className="text-gray-600">
          Эта страница доступна только для студентов.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex">
      {/* Fixed sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
        <div className="pt-20 mb-6">
          <h1 className="text-lg font-bold text-gray-900">ПАНЕЛЬ СТУДЕНТА</h1>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleChangeView(item.id)}
                className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                  currentView === item.id
                    ? "bg-gray-100 text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[240px]">
        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </section>
      </main>
    </div>
  );
};

export default StudentDashboard;




