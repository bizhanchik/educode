import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  GraduationCap,
  UserCog,
  Settings,
  FileText,
  Video,
  File,
  Upload,
  X,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import BackButton from "../components/BackButton.jsx";
import { useLanguage } from "../i18n.jsx";
import { getTeacherCourses } from "../utils/auth.js";
import { usersApi } from "../utils/usersApi.js";
import { groupsApi } from "../utils/groupsApi.js";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  fetchSubjectWithLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  createLessonMaterial,
} from "../utils/curriculumApi.js";
import { getTeacherAssignments } from "../utils/teacherAssignmentsApi.js";
import * as XLSX from "xlsx";

// SVG иконки для действий (просмотр, редактировать, удалить)
const EyeIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const EditIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const Journal = ({ onPageChange }) => {
  const { language, changeLanguage, t } = useLanguage();
  
  // Получаем пользователя
  let authUser = null;
  try {
    const authContext = useAuth();
    authUser = authContext.user;
  } catch (e) {
    // Игнорируем ошибку
  }
  
  // Определяем админа и преподавателя
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    let admin = false;
    let teacher = false;
    let userData = authUser;
    
    // Всегда проверяем localStorage напрямую
    try {
      const raw = localStorage.getItem("educode_current_user");
      if (raw) {
        userData = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error getting user:", err);
    }
    
    if (userData) {
      admin = userData.role === "admin";
      teacher = userData.role === "teacher";
    }
    
    setIsAdmin(admin);
    setIsTeacher(teacher);
    setCurrentUser(userData);
  }, [authUser]);

  const [tab, setTab] = useState("courses");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [deleteCoursePassword, setDeleteCoursePassword] = useState('');
  const [editTeacher, setEditTeacher] = useState(null);
  const [deleteTeacher, setDeleteTeacher] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  
  // Lesson state for teacher
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonModalSaving, setLessonModalSaving] = useState(false);
  
  // Состояния для преподавателя
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  
  // Единый поиск для всех вкладок
  const [searchQuery, setSearchQuery] = useState("");
  
  // Фильтры
  const [courseStatus, setCourseStatus] = useState(t("admin.journal.all"));
  const [studentGroupFilter, setStudentGroupFilter] = useState(""); // Для перехода из Групп в Студенты
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(""); // Фильтр группы в разделе Студенты
  
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
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  
  // Состояния для настроек
  const [adminProfile, setAdminProfile] = useState({
    name: "Администратор",
    email: "admin@educode.com",
    phone: "+7 (700) 000-00-00",
  });
  const [platformSettings, setPlatformSettings] = useState({
    name: "EduCode",
    supportEmail: "support@educode.com",
    maintenanceMode: false,
  });
  
  // Синхронизируем язык из настроек с системой переводов
  const handleLanguageChange = (langCode) => {
    if (langCode === "ru" || langCode === "kk" || langCode === "en") {
      changeLanguage(langCode);
    }
  };
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  
  // Состояния данных
  const [coursesData, setCoursesData] = useState([]);
  const [teachersData, setTeachersData] = useState([]);
  const [groupsData, setGroupsData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Функции загрузки данных
  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await fetchSubjects({ size: 100 });
      const subjects = response.data?.subjects || [];
      const mappedCourses = subjects.map((subject) => ({
        id: subject.id,
        code: subject.code || subject.name.substring(0, 4).toUpperCase(),
        name: subject.name,
        teacher: "-",
        groups: [],
        status: subject.status || "Активен",
        createdAt: subject.created_at ? new Date(subject.created_at).toLocaleDateString() : "—",
        updatedAt: subject.updated_at ? new Date(subject.updated_at).toLocaleDateString() : "—",
      }));
      setCoursesData(mappedCourses);
    } catch (error) {
      console.error("Failed to load courses:", error);
      setCoursesData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getUsers({ role: "teacher", size: 100 });
      setTeachersData(
        response.data.users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: "-",
          course: "-",
          groups: u.group ? [u.group.name] : [],
        }))
      );
    } catch (error) {
      console.error("Failed to load teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Загружаем все группы (и для админа, и для преподавателя)
      const response = await groupsApi.getGroups({ size: 100 });
      console.log('[Journal] Groups API response:', response);
      console.log('[Journal] Groups from API:', response.data?.groups);
      
      let groups = (response.data?.groups || []).map((g) => ({
        id: g.id,
        name: g.name,
        studentsCount: g.student_count || 0,
        courses: [],
        curator: "-",
      }));
      
      console.log('[Journal] All groups loaded:', groups.length, groups);
      
      // Для преподавателя добавляем курсы из его назначений
      if (isTeacher && currentUser?.id) {
        try {
          const assignmentsResponse = await getTeacherAssignments({ teacher_id: currentUser.id, size: 100 });
          const assignments = assignmentsResponse.data?.assignments || [];
          console.log('[Journal] Teacher assignments:', assignments.length, assignments);
          
          const coursesByGroup = new Map();
          const curatorByGroup = new Map();
          
          assignments.forEach((assignment) => {
            console.log('[Journal] Full assignment object:', JSON.stringify(assignment, null, 2));
            // Пробуем разные варианты доступа к group_id и group name
            const groupId = assignment.group?.id || assignment.group_id || assignment.groupId;
            const groupName = assignment.group?.name || assignment.group_name;
            const subjectName = assignment.subject?.name || assignment.subject_name;
            
            console.log('[Journal] Processing assignment - groupId:', groupId, 'groupName:', groupName, 'subjectName:', subjectName);
            
            if (groupId) {
              // Добавляем курс к группе
              if (subjectName) {
                if (!coursesByGroup.has(groupId)) {
                  coursesByGroup.set(groupId, []);
                }
                const courses = coursesByGroup.get(groupId);
                if (!courses.includes(subjectName)) {
                  courses.push(subjectName);
                }
              }
              
              // Определяем куратора
              if (assignment.is_curator) {
                curatorByGroup.set(groupId, currentUser.name);
              }
            } else if (groupName) {
              // Если нет groupId, но есть groupName, пытаемся найти группу по имени
              const foundGroup = groups.find(g => g.name === groupName);
              if (foundGroup && subjectName) {
                if (!coursesByGroup.has(foundGroup.id)) {
                  coursesByGroup.set(foundGroup.id, []);
                }
                const courses = coursesByGroup.get(foundGroup.id);
                if (!courses.includes(subjectName)) {
                  courses.push(subjectName);
                }
                if (assignment.is_curator) {
                  curatorByGroup.set(foundGroup.id, currentUser.name);
                }
              }
            } else {
              console.warn('[Journal] Assignment has no groupId or groupName:', assignment);
            }
          });
          
          // Обновляем группы с курсами и куратором
          groups = groups.map(group => ({
            ...group,
            courses: coursesByGroup.get(group.id) || [],
            curator: curatorByGroup.get(group.id) || "-",
          }));
          
          console.log('[Journal] Groups with courses for teacher:', groups.length, groups);
        } catch (err) {
          console.warn("Failed to load courses for groups:", err);
        }
      }
      
      console.log('[Journal] Final groups to set:', groups.length, groups);
      setGroupsData(groups);
    } catch (error) {
      console.error("Failed to load groups:", error);
      console.error("Error details:", error.message, error.status, error);
      setGroupsData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      console.log('[Journal] Loading students...');
      
      // Загружаем всех студентов из базы данных
      const response = await usersApi.getUsers({ role: "student", size: 100 });
      console.log('[Journal] Students API response:', response);
      console.log('[Journal] Students from API:', response.data?.users?.length, response.data?.users);
          
      // Загружаем все группы для маппинга group_id -> group name
      let groupsMap = new Map();
      try {
        const groupsResponse = await groupsApi.getGroups({ size: 100 });
        const groups = groupsResponse.data?.groups || [];
        groups.forEach(g => {
          groupsMap.set(g.id, g.name);
        });
        console.log('[Journal] Groups map:', Array.from(groupsMap.entries()));
      } catch (groupsErr) {
        console.warn('[Journal] Failed to load groups for mapping:', groupsErr);
      }
      
      const students = (response.data?.users || []).map((u) => {
        // Обрабатываем разные форматы данных о группе
        let groupName = "-";
        if (u.group) {
          if (typeof u.group === 'string') {
            groupName = u.group;
          } else if (u.group.name) {
            groupName = u.group.name;
          } else if (u.group.id) {
            // Если group - это объект с id, ищем название в groupsMap
            groupName = groupsMap.get(u.group.id) || String(u.group.id);
                }
        }
        
        // Если group не найден, пробуем group_id
        if (groupName === "-" && u.group_id) {
          groupName = groupsMap.get(u.group_id) || String(u.group_id);
                }
              
        console.log('[Journal] Student:', u.name, 'group_id:', u.group_id, 'group:', u.group, 'final groupName:', groupName);
        
        return {
                  id: u.id,
          name: u.name || "-",
          email: u.email || "-",
          group: groupName,
                  courses: 0,
                  status: "Активен",
                  password: "-",
        };
      });
      
      console.log('[Journal] Students loaded:', students.length, students);
      setStudentsData(students);
    } catch (error) {
      console.error("Failed to load students:", error);
      console.error("Error details:", error.message, error.status, error);
      setStudentsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик клика по группе - переход на вкладку Студенты с фильтром
  const handleGroupClick = (groupName) => {
    console.log('[Journal] Group clicked:', groupName);
    setTab("students");
    setSelectedStudentGroup(groupName);
    setSearchQuery(""); // Очищаем поиск
    // Всегда загружаем студентов при клике на группу
      console.log('[Journal] Loading students after group click');
      loadStudents();
  };

  // Загрузка данных при смене вкладки
  useEffect(() => {
    if (isAdmin) {
      if (tab === "courses") loadCourses();
      else if (tab === "teachers") loadTeachers();
      else if (tab === "groups") loadGroups();
      else if (tab === "students") loadStudents();
    } else if (isTeacher) {
      // Для преподавателя загружаем данные для его вкладок
      if (tab === "courses") {
        // Курсы уже загружаются в отдельном useEffect через getTeacherAssignments
      } else if (tab === "groups") {
        loadGroups();
      } else if (tab === "students") {
        loadStudents();
      }
    }
  }, [tab, isAdmin, isTeacher, authUser]);

  // Загружаем студентов при изменении выбранной группы (если перешли с вкладки Группы)
  useEffect(() => {
    if (tab === "students" && selectedStudentGroup) {
      console.log('[Journal] Loading students because group was selected:', selectedStudentGroup);
      if (studentsData.length === 0) {
      loadStudents();
      }
    }
  }, [selectedStudentGroup, tab]);

  // Handlers for Courses
  const handleAddCourse = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    if (!name) return;

    try {
      await createSubject({ name });
      setShowAddCourse(false);
      loadCourses();
    } catch (error) {
      console.error("Failed to create course:", error);
      alert("Не удалось создать курс");
    }
  };

  const handleEditCourse = async () => {
    if (!editCourse || !editCourse.name) return;
    try {
      const updateResponse = await updateSubject(editCourse.id, { name: editCourse.name });
      const updatedSubject = updateResponse.data || updateResponse;
      
      // Немедленно обновляем состояние используя response от сервера
      if (updatedSubject) {
        setCoursesData((prevCourses) =>
          prevCourses.map((course) =>
            course.id === editCourse.id
              ? {
                  ...course,
                  name: updatedSubject.name || course.name,
                  code: updatedSubject.code || course.code || course.name.substring(0, 4).toUpperCase(),
                }
              : course
          )
        );
      }
      
      setEditCourse(null);
      // Загружаем курсы для синхронизации (но состояние уже обновлено выше)
      loadCourses();
    } catch (error) {
      console.error("Failed to update course:", error);
      alert("Не удалось обновить курс");
    }
  };

  const handleDeleteCourse = async () => {
    if (!deleteCourse) return;
    if (!deleteCoursePassword || !deleteCoursePassword.trim()) {
      alert("Пожалуйста, введите пароль для подтверждения удаления");
      return;
    }
    try {
      await deleteSubject(deleteCourse.id, deleteCoursePassword.trim());
      setDeleteCourse(null);
      setDeleteCoursePassword('');
      if (isAdmin) {
      loadCourses();
      } else if (isTeacher && currentUser?.id) {
        // Для преподавателя перезагружаем курсы
        // Вызываем ту же функцию, что используется при загрузке
        const reloadTeacherCourses = async () => {
          setLoadingCourses(true);
          try {
            const assignmentsResponse = await getTeacherAssignments({ teacher_id: currentUser.id, size: 100 });
            const assignments = assignmentsResponse.data?.assignments || [];
            console.log('[Journal] Reloading teacher courses after delete:', assignments.length, assignments);
            
            const coursesMap = new Map();
            assignments.forEach((assignment) => {
              const subjectId = assignment.subject?.id || assignment.subject_id;
              const subjectName = assignment.subject?.name || assignment.subject_name;
              const subjectCode = assignment.subject?.code;
              const groupName = assignment.group?.name || assignment.group_name;
              
              // Проверяем, что subject существует (не был удален)
              // Если subject был удален, assignment.subject может быть null
              if (subjectId && subjectName && assignment.subject) {
                if (!coursesMap.has(subjectId)) {
                  coursesMap.set(subjectId, {
                    id: subjectId,
                    code: subjectCode || subjectName?.substring(0, 4).toUpperCase() || "—",
                    name: subjectName,
                    teacher: currentUser.name || "—",
                    groups: [],
                    status: assignment.subject?.status || "Активен",
                    createdAt: assignment.subject?.created_at ? new Date(assignment.subject.created_at).toLocaleDateString() : "—",
                    updatedAt: assignment.subject?.updated_at ? new Date(assignment.subject.updated_at).toLocaleDateString() : "—",
                  });
                }
                
                const course = coursesMap.get(subjectId);
                if (groupName && course && !course.groups.includes(groupName)) {
                  course.groups.push(groupName);
                }
              }
            });
            
          // Загружаем полную информацию о subject для получения created_at, если его нет
          const coursesWithDates = await Promise.all(
            Array.from(coursesMap.values()).map(async (course) => {
              // Если createdAt уже есть, используем его
              if (course.createdAt && course.createdAt !== "—") {
                return {
                  ...course,
                  groups: course.groups.join(", ") || "—",
                };
              }
              
              // Иначе загружаем полную информацию о subject
              try {
                const subjectResponse = await fetchSubjectWithLessons(course.id);
                const subject = subjectResponse.data || subjectResponse;
                
                // Проверяем, что subject не был удален (404 ошибка)
                if (!subject || subject.id !== course.id) {
                  console.warn('[Journal] Subject not found or deleted:', course.id);
                  return null; // Пропускаем удаленный курс
                }
                
                const createdAt = subject.created_at 
                  ? new Date(subject.created_at).toLocaleDateString() 
                  : course.createdAt || "—";
                const updatedAt = subject.updated_at 
                  ? new Date(subject.updated_at).toLocaleDateString() 
                  : course.updatedAt || "—";
                const status = subject.status || course.status || "Активен";
                
                return {
                  ...course,
                  createdAt,
                  updatedAt,
                  status,
                  groups: course.groups.join(", ") || "—",
                };
              } catch (error) {
                // Если subject был удален (404), пропускаем его
                if (error.status === 404) {
                  console.warn('[Journal] Subject was deleted:', course.id);
                  return null;
                }
                console.error('[Journal] Failed to load subject info:', course.id, error);
                return {
                  ...course,
                  groups: course.groups.join(", ") || "—",
                };
              }
            })
          );
          
          // Фильтруем null значения (удаленные курсы)
          const validCourses = coursesWithDates.filter(course => course !== null);
          
          console.log('[Journal] Reloaded teacher courses with dates:', validCourses.length, validCourses);
          // Убеждаемся, что обновляем состояние даже если курсов нет
          setTeacherCourses(validCourses);
          console.log('[Journal] Teacher courses state updated, new length:', validCourses.length);
          } catch (err) {
            console.error("Failed to reload teacher courses:", err);
            setTeacherCourses([]);
          } finally {
            setLoadingCourses(false);
          }
        };
        
        await reloadTeacherCourses();
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
      const errorMessage = error.message || "Не удалось удалить курс";
      alert(errorMessage);
      // Не очищаем модальное окно при ошибке, чтобы пользователь мог попробовать снова
    }
  };

  // Handlers for Teachers
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (!name || !email || !password) return;

    try {
      await usersApi.createUser({ name, email, password, role: "teacher" });
      setShowAddTeacher(false);
      loadTeachers();
    } catch (error) {
      console.error("Failed to create teacher:", error);
      alert("Не удалось создать преподавателя");
    }
  };

  const handleEditTeacher = async () => {
    if (!editTeacher || !editTeacher.name) return;
    try {
      await usersApi.updateUser(editTeacher.id, {
        name: editTeacher.name,
        email: editTeacher.email,
      });
      setEditTeacher(null);
      loadTeachers();
    } catch (error) {
      console.error("Failed to update teacher:", error);
      alert("Не удалось обновить преподавателя");
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacher) return;
    try {
      await usersApi.deleteUser(deleteTeacher.id);
      setDeleteTeacher(null);
      loadTeachers();
    } catch (error) {
      console.error("Failed to delete teacher:", error);
      alert("Не удалось удалить преподавателя");
    }
  };

  // Handlers for Groups
  const handleAddGroup = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    if (!name) return;
    try {
      await groupsApi.createGroup({ name });
      setShowAddGroup(false);
      loadGroups();
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("Не удалось создать группу");
    }
  };

  const handleEditGroup = async () => {
    if (!editGroup || !editGroup.name) return;
    try {
      await groupsApi.updateGroup(editGroup.id, { name: editGroup.name });
      setEditGroup(null);
      loadGroups();
    } catch (error) {
      console.error("Failed to update group:", error);
      alert("Не удалось обновить группу");
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup) return;
    try {
      await groupsApi.deleteGroup(deleteGroup.id);
      setDeleteGroup(null);
      loadGroups();
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Не удалось удалить группу");
    }
  };

  // Handlers for Students
  const handleAddStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    if (!name || !email || !password) return;

    try {
      await usersApi.createUser({ name, email, password, role: "student" });
      setShowAddStudent(false);
      loadStudents();
    } catch (error) {
      console.error("Failed to create student:", error);
      alert("Не удалось создать студента");
    }
  };

  const handleEditStudent = async () => {
    if (!editStudent || !editStudent.name) return;
    try {
      await usersApi.updateUser(editStudent.id, {
        name: editStudent.name,
        email: editStudent.email,
      });
      setEditStudent(null);
      loadStudents();
    } catch (error) {
      console.error("Failed to update student:", error);
      alert("Не удалось обновить студента");
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    try {
      await usersApi.deleteUser(deleteStudent.id);
      setDeleteStudent(null);
      loadStudents();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("Не удалось удалить студента");
    }
  };

  // Фильтрация данных по поисковому запросу
  const getFilteredData = () => {
    const lowerQuery = searchQuery.toLowerCase();

    if (tab === "courses") {
      // Для преподавателя используем teacherCourses, для админа - coursesData
      const dataToFilter = isTeacher ? teacherCourses : coursesData;
      let filtered = dataToFilter.filter(
        (item) =>
          (item.name?.toLowerCase() || "").includes(lowerQuery) ||
          (item.code?.toLowerCase() || "").includes(lowerQuery)
      );
      
      // Фильтрация по статусу
      if (courseStatus && courseStatus !== t("admin.journal.all") && courseStatus !== "Все") {
        filtered = filtered.filter((item) => {
          const itemStatus = item.status || "Активен";
          const activeLabel = t("admin.journal.active");
          const archiveLabel = t("admin.journal.archive");
          
          if (courseStatus === activeLabel || courseStatus === "Активен") {
            return itemStatus === "Активен" || itemStatus === "Active";
          } else if (courseStatus === archiveLabel || courseStatus === "Архив") {
            return itemStatus === "Архив" || itemStatus === "Неактивен" || itemStatus === "Archive";
          }
          return true;
        });
      }
      
      return filtered;
    }
    if (tab === "teachers") {
      return teachersData.filter(
        (item) =>
          (item.name?.toLowerCase() || "").includes(lowerQuery) ||
          (item.email?.toLowerCase() || "").includes(lowerQuery)
      );
    }
    if (tab === "groups") {
      return groupsData.filter((item) =>
        (item.name?.toLowerCase() || "").includes(lowerQuery)
      );
    }
    if (tab === "students") {
      let data = studentsData;
      console.log('[Journal] Filtering students - total:', data.length, 'selectedGroup:', selectedStudentGroup);
      console.log('[Journal] All students data:', data);
      
      if (selectedStudentGroup) {
        data = data.filter((s) => {
          // Сравниваем группу студента с выбранной группой (с учетом разных форматов)
          const studentGroup = String(s.group || "").trim();
          const selectedGroup = String(selectedStudentGroup || "").trim();
          const matches = studentGroup === selectedGroup || 
                         studentGroup.toLowerCase() === selectedGroup.toLowerCase();
          if (matches) {
            console.log('[Journal] Student match:', s.name, 'group:', studentGroup, 'selected:', selectedGroup);
          }
          return matches;
        });
        console.log('[Journal] Filtered students for group:', data.length);
      }
      
      const filtered = data.filter(
        (item) =>
          (item.name?.toLowerCase() || "").includes(lowerQuery) ||
          (item.email?.toLowerCase() || "").includes(lowerQuery) ||
          (String(item.group || "").toLowerCase()).includes(lowerQuery)
      );
      console.log('[Journal] Final filtered students:', filtered.length);
      return filtered;
    }
    return [];
  };

  // Получаем список всех уникальных групп из студентов (для фильтра)
  const getAllGroups = () => {
    // Extract unique groups from loaded students or groups data
    // Ideally use groupsData if available, otherwise unique from students
    if (groupsData.length > 0) return groupsData.map((g) => g.name);
    const groups = new Set(
      studentsData.map((s) => s.group).filter((g) => g !== "-")
    );
    return Array.from(groups);
  };

  // Группируем студентов по группам
  const getStudentsGroupedByGroup = (students) => {
    const grouped = {};
    students.forEach((student) => {
      const groupName = student.group;
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(student);
    });
    return grouped;
  };
  
  // Получаем студентов выбранной группы
  const getStudentsByGroup = (groupName) => {
    return studentsData.filter((s) => s.group === groupName);
  };
  
  // Проверяем, раскрыта ли группа
  const isGroupExpanded = (groupName) => {
    return expandedGroup === groupName;
  };

  // Форматирование количества курсов
  const formatCoursesCount = (count) => {
    if (count === 0)
      return (
        <span className="text-gray-500">0 {t("admin.journal.completed")}</span>
      );
    if (count === 1) return `1 ${t("admin.journal.courseCompleted")}`;
    if (count >= 2 && count <= 4)
      return `${count} ${t("admin.journal.coursesCompleted2")}`;
    return `${count} ${t("admin.journal.coursesCompleted3")}`;
  };

  // Получаем placeholder для поиска в зависимости от вкладки
  const getSearchPlaceholder = () => {
    switch (tab) {
      case "courses":
        return t("admin.journal.searchCourse");
      case "teachers":
        return t("admin.journal.searchTeacher");
      case "groups":
        return t("admin.journal.searchGroup");
      case "students":
        return t("admin.journal.searchStudent");
      default:
        return "Поиск...";
    }
  };

  // Функция получения переведенного названия курса
  const getCourseName = (course) => {
    if (course.code === "ПМ02") {
      return t("courses.courseDescription");
    } else if (course.code === "ПМ01") {
      return t("courses.coursePM01Full");
    } else if (course.code === "ООД14") {
      return t("courses.courseOOD14Full");
    }
    return course.name;
  };

  // Функция экспорта в Excel
  const exportToExcel = () => {
    const data = getFilteredData();
    let excelData = [];
    let fileName = "";
    let sheetName = "";

    switch (tab) {
      case "courses":
        fileName = "Courses"; // Используем английское имя для файла
        sheetName = t("admin.journal.courses");
        excelData = data.map((course, idx) => ({
          [t("admin.journal.number")]: idx + 1,
          [t("admin.journal.codeHeader")]: course.code || "",
          [t("admin.journal.name")]: course.translatedName || course.name || "",
          [t("admin.journal.teacherHeader")]: course.teacher || "",
          [t("admin.journal.groupsHeader")]: typeof course.groups === 'string' ? course.groups : (course.groups || []).join(", ") || "",
          [t("admin.journal.statusHeader")]:
            course.status === "Активен"
              ? t("admin.journal.active")
              : course.status === "Неактивен" || course.status === "Архив"
              ? (course.status === "Архив" ? t("admin.journal.archive") : t("admin.journal.inactive"))
              : course.status || t("admin.journal.active"),
          [t("admin.journal.dateUpdateHeader")]: course.createdAt || course.updatedAt || "",
        }));
        break;

      case "teachers":
        fileName = "Teachers";
        sheetName = t("admin.journal.teachers");
        excelData = data.map((teacher, idx) => ({
          [t("admin.journal.number")]: idx + 1,
          [t("admin.journal.fullNameTeacherHeader")]: teacher.name || "",
          [t("admin.journal.phoneHeader")]: teacher.phone || "",
          [t("admin.journal.emailHeader")]: teacher.email || "",
          [t("admin.journal.subjectHeader")]: teacher.course || "",
          [t("admin.journal.groupsHeader")]: typeof teacher.groups === 'string' ? teacher.groups : (teacher.groups || []).join(", ") || "",
        }));
        break;

      case "students":
        fileName = "Students";
        sheetName = t("admin.journal.students");
        excelData = data.map((student, idx) => ({
          [t("admin.journal.number")]: idx + 1,
          [t("admin.journal.fullNameHeader")]: student.name || "",
          [t("admin.journal.emailHeader")]: student.email || "",
          [t("admin.journal.passwordHeader")]: student.password || "",
          [t("admin.journal.groupHeader")]: student.group || "",
          [t("admin.journal.coursesCompletedHeader")]: student.courses || "",
          [t("admin.journal.statusHeader")]: student.status || "",
        }));
        break;

      case "groups":
        fileName = "Groups";
        sheetName = t("admin.journal.groups");
        excelData = data.map((group, idx) => ({
          [t("admin.journal.number")]: idx + 1,
          [t("admin.journal.groupHeader")]: group.name || "",
          [t("admin.journal.assignedCoursesHeader")]: typeof group.courses === 'string' ? group.courses : (group.courses || []).join(", ") || "",
          [t("admin.journal.studentsCountHeader")]: group.studentsCount || 0,
          [t("admin.journal.curatorHeader")]: group.curator || "",
        }));
        break;

      default:
        return;
    }

    if (excelData.length === 0) {
      alert(t("admin.journal.noData") || "Нет данных для экспорта");
      return;
    }

    try {
      console.log('[Journal] Exporting to Excel:', {
        tab,
        fileName,
        sheetName,
        dataCount: excelData.length,
        excelData: excelData.slice(0, 3) // Первые 3 записи для отладки
      });

      // Создаем рабочую книгу
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Генерируем файл и скачиваем
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      link.download = `${fileName}_${dateStr}.xlsx`;
      
      // Добавляем ссылку в DOM, кликаем и удаляем
      document.body.appendChild(link);
      link.click();
      
      // Небольшая задержка перед удалением, чтобы браузер успел начать загрузку
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('[Journal] Excel file download initiated:', link.download);
    } catch (error) {
      console.error("[Journal] Ошибка при экспорте в Excel:", error);
      console.error("[Journal] Error details:", error.message, error.stack);
      alert("Произошла ошибка при экспорте данных: " + (error.message || "Неизвестная ошибка"));
    }
  };

  // АДМИН-ЖУРНАЛ (вкладки и разделы) - новый порядок согласно ТЗ
  // Создаём sidebarItems с переводами
  const sidebarItems = [
    { id: "courses", label: t("admin.journal.courses"), icon: BookOpen },
    { id: "groups", label: t("admin.journal.groups"), icon: UserCog },
    { id: "students", label: t("admin.journal.students"), icon: Users },
    { id: "teachers", label: t("admin.journal.teachers"), icon: GraduationCap },
    { id: "settings", label: t("admin.journal.settings"), icon: Settings },
  ];

  // Меню для преподавателей (как у админа, но без Преподаватели и Настройки)
  const teacherSidebarItems = [
    { id: "courses", label: t("admin.journal.myCourses"), icon: BookOpen },
    { id: "groups", label: t("admin.journal.groups"), icon: UserCog },
    { id: "students", label: t("admin.journal.students"), icon: Users },
  ];

  // Загружаем курсы преподавателя
  useEffect(() => {
    const loadTeacherCourses = async () => {
      console.log('[Journal] loadTeacherCourses called:', { isTeacher, currentUser: currentUser?.id, currentUserName: currentUser?.name });
      if (isTeacher && currentUser?.id) {
      setLoadingCourses(true);
      try {
          // Сначала получаем назначения преподавателя
          console.log('[Journal] Fetching teacher assignments for teacher_id:', currentUser.id);
          const assignmentsResponse = await getTeacherAssignments({ teacher_id: currentUser.id, size: 100 });
          const assignments = assignmentsResponse.data?.assignments || [];
          console.log('[Journal] Teacher assignments for courses:', assignments.length, assignments);
          
          if (assignments.length === 0) {
            console.warn('[Journal] No assignments found for teacher:', currentUser.id);
            setTeacherCourses([]);
            setLoadingCourses(false);
            return;
          }
          
          // Получаем уникальные курсы из назначений
          const coursesMap = new Map();
          assignments.forEach((assignment) => {
            console.log('[Journal] Processing assignment for courses:', JSON.stringify(assignment, null, 2));
            // Пробуем разные варианты доступа к subject
            const subjectId = assignment.subject?.id || assignment.subject_id;
            const subjectName = assignment.subject?.name || assignment.subject_name;
            const subjectCode = assignment.subject?.code;
            const groupName = assignment.group?.name || assignment.group_name;
            const subjectStatus = assignment.subject?.status;
            const subjectCreatedAt = assignment.subject?.created_at;
            const subjectUpdatedAt = assignment.subject?.updated_at;
            
            console.log('[Journal] Subject data:', {
              id: subjectId,
              name: subjectName,
              code: subjectCode,
              status: subjectStatus,
              created_at: subjectCreatedAt,
              updated_at: subjectUpdatedAt,
              fullSubject: assignment.subject
            });
            
            if (subjectId && subjectName) {
              if (!coursesMap.has(subjectId)) {
                const createdAt = subjectCreatedAt 
                  ? new Date(subjectCreatedAt).toLocaleDateString() 
                  : "—";
                const updatedAt = subjectUpdatedAt 
                  ? new Date(subjectUpdatedAt).toLocaleDateString() 
                  : "—";
                
                console.log('[Journal] Creating course entry:', {
                  id: subjectId,
                  name: subjectName,
                  createdAt,
                  updatedAt,
                  status: subjectStatus
                });
                
                coursesMap.set(subjectId, {
                  id: subjectId,
                  code: subjectCode || subjectName?.substring(0, 4).toUpperCase() || "—",
                  name: subjectName,
                  teacher: currentUser.name || "—",
                  groups: [],
                  status: subjectStatus || "Активен",
                  createdAt: createdAt,
                  updatedAt: updatedAt,
                });
              }
              
              // Добавляем группу к курсу
              const course = coursesMap.get(subjectId);
              if (groupName && course && !course.groups.includes(groupName)) {
                course.groups.push(groupName);
                console.log('[Journal] Added group to course:', groupName, '->', subjectName);
              }
            } else {
              console.warn('[Journal] Assignment has no subject id or name:', assignment);
            }
          });
          
          // Загружаем полную информацию о subject для получения created_at, если его нет
          const coursesWithDates = await Promise.all(
            Array.from(coursesMap.values()).map(async (course) => {
              // Если createdAt уже есть, используем его
              if (course.createdAt && course.createdAt !== "—") {
                return {
                  ...course,
                  groups: course.groups.join(", ") || "—",
                };
              }
              
              // Иначе загружаем полную информацию о subject
              try {
                console.log('[Journal] Loading full subject info for:', course.id);
                const subjectResponse = await fetchSubjectWithLessons(course.id);
                const subject = subjectResponse.data || subjectResponse;
                
                const createdAt = subject.created_at 
                  ? new Date(subject.created_at).toLocaleDateString() 
                  : course.createdAt || "—";
                const updatedAt = subject.updated_at 
                  ? new Date(subject.updated_at).toLocaleDateString() 
                  : course.updatedAt || "—";
                const status = subject.status || course.status || "Активен";
                
                console.log('[Journal] Loaded subject dates:', {
                  id: course.id,
                  createdAt,
                  updatedAt,
                  status
                });
                
                return {
                  ...course,
                  createdAt,
                  updatedAt,
                  status,
                  groups: course.groups.join(", ") || "—",
                };
              } catch (error) {
                console.error('[Journal] Failed to load subject info:', course.id, error);
                return {
                  ...course,
                  groups: course.groups.join(", ") || "—",
                };
              }
            })
          );
          
          console.log('[Journal] Teacher courses loaded with dates:', coursesWithDates.length, coursesWithDates);
        setTeacherCourses(coursesWithDates);
      } catch (error) {
          console.error("Ошибка загрузки курсов преподавателя:", error);
          console.error("Error details:", error.message, error.status, error);
          setTeacherCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }
    };
    loadTeacherCourses();
  }, [isTeacher, currentUser]);

  // ЖУРНАЛ ДЛЯ СТУДЕНТА
  if (!isAdmin && !isTeacher) {
    const studentCourses = [
      {
        id: 1,
        code: "ПМ02",
        name: t("courses.courseDescription") + ".",
        teacher: "Мартынцов Николай Викторович",
      },
    ];
    return (
      <div className="bg-white min-h-screen">
        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-left mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ЖУРНАЛ</h1>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      №
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border border-gray-200">
                      Код предмета
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border border-gray-200">
                      Название
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 border border-gray-200">
                      Преподаватель
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      Операции
                    </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentCourses.map((course, index) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-center text-sm text-gray-900 border border-gray-200">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-200">
                        {course.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200 break-words">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">
                        {course.teacher}
                      </td>
                      <td className="px-6 py-4 text-center border border-gray-200">
                          <button 
                          className="text-gray-400 hover:text-gray-600 transition-colors mx-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onPageChange) {
                              onPageChange("journal-detail", {
                                courseId: course.id,
                              });
                            }
                          }}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
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

  return (
    <div className="bg-white min-h-screen flex">
      {/* Фиксированное боковое меню для админа */}
      {isAdmin && (
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
          {/* Заголовок */}
          <div className="pt-20 mb-6">
            <h1 className="text-lg font-bold text-gray-900">
              {t("admin.journal.title")}
            </h1>
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
                    setSearchQuery(""); // Очищаем поиск при смене вкладки
                    setStudentGroupFilter(""); // Очищаем фильтр группы
                    if (item.id === "students") {
                      setSelectedStudentGroup(""); // Сбрасываем фильтр при переходе на вкладку Студенты
                    }
                  }}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                    tab === item.id
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
      )}

      {/* Фиксированное боковое меню для преподавателя */}
      {isTeacher && (
        <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
          {/* Заголовок */}
          <div className="pt-20 mb-6">
            <h1 className="text-lg font-bold text-gray-900">
              {t("admin.journal.title")}
            </h1>
          </div>
          {/* Навигация */}
          <nav className="flex-1 flex flex-col gap-1">
            {teacherSidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setSearchQuery(""); // Очищаем поиск при смене вкладки
                    setStudentGroupFilter(""); // Очищаем фильтр группы
                    if (item.id === "students") {
                      setSelectedStudentGroup(""); // Сбрасываем фильтр при переходе на вкладку Студенты
                    }
                  }}
                  className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                    tab === item.id
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
      )}

      {/* Мобильное бургер-меню для админа (скрытое по умолчанию) */}
      {isAdmin && (
        <>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-20 left-4 z-50 text-gray-600 hover:text-gray-900 text-2xl"
            aria-label="Меню"
          >
            {isMobileMenuOpen ? "✖" : "☰"}
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
                          setSearchQuery(""); // Очищаем поиск при смене вкладки
                          setStudentGroupFilter(""); // Очищаем фильтр группы
                          if (item.id === "students") {
                            setSelectedStudentGroup(""); // Сбрасываем фильтр при переходе на вкладку Студенты
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                          tab === item.id
                            ? "bg-gray-100 text-blue-600 font-semibold"
                            : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
                <button
                  className="flex items-center gap-3 text-gray-400 hover:text-red-500 py-2 px-3 rounded-md transition-all duration-200 hover:bg-gray-50 mt-auto"
                  onClick={() => {
                    console.log("Выйти");
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

      {/* Мобильное бургер-меню для преподавателя */}
      {isTeacher && (
        <>
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-20 left-4 z-50 text-gray-600 hover:text-gray-900 text-2xl"
            aria-label="Меню"
          >
            {isMobileMenuOpen ? "✖" : "☰"}
          </button>
          {isMobileMenuOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/30 z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="lg:hidden fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-lg flex flex-col p-5 z-50">
                <nav className="flex-1 flex flex-col gap-1 pt-20">
                  {teacherSidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setTab(item.id);
                          setSearchQuery("");
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 ${
                          tab === item.id
                            ? "bg-gray-100 text-blue-600 font-semibold"
                            : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </>
          )}
        </>
      )}

      {/* Основной контент */}
      <main className={`flex-1 ${isAdmin || isTeacher ? "ml-[240px]" : ""}`}>
        <BackButton onClick={() => onPageChange && onPageChange("courses")}>
          {t("courses.backToCourses")}
        </BackButton>

        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            {isAdmin && (
              <>
                {/* Заголовок */}
                <div className="mb-6">
                  <h1 className="text-[28px] font-bold text-gray-900">
                    {sidebarItems.find((item) => item.id === tab)?.label ||
                      "Курсы"}
                  </h1>
                </div>

                {/* Модальные окна: Подробнее / Редактировать / Удалить (доступны для админа и преподавателя) */}
                {/* Модальное окно добавления курса */}
                {showAddCourse && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.addCourse")}
                      </h3>
                      <form onSubmit={handleAddCourse}>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <input
                            name="name"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.name")}
                            required
                          />
                          {/* Backend currently only supports name */}
                          <p className="text-xs text-gray-500">
                            * Пока поддерживается только название курса
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowAddCourse(false)}
                          >
                            {t("admin.journal.cancel")}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          >
                            {t("admin.journal.save")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
            {detailCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.details")}
                      </h3>
                <div className="space-y-1 text-sm text-gray-700">
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.name")}:
                          </span>{" "}
                          {detailCourse.translatedName || detailCourse.name}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.teacher")}:
                          </span>{" "}
                          {detailCourse.teacher}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.groups")}:
                          </span>{" "}
                          {typeof detailCourse.groups === 'string' ? detailCourse.groups : (detailCourse.groups || []).join(", ")}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.status")}:
                          </span>{" "}
                          {detailCourse.status ||
                            (detailCourse.code === "ООД14"
                              ? t("admin.journal.archive")
                              : t("admin.journal.active"))}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.description")}:
                          </span>{" "}
                          {detailCourse.description ||
                            "Практический курс по составлению алгоритмов и созданию блок-схем."}
                        </p>
                  {detailCourse.updatedAt && (
                          <p>
                            <span className="text-gray-500">
                              {t("admin.journal.updateDate")}:
                            </span>{" "}
                            {detailCourse.updatedAt}
                          </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setDetailCourse(null)}
                        >
                          {t("admin.journal.close")}
                        </button>
                  {isAdmin && (
                          <button
                            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                            onClick={() => {
                              setEditCourse(detailCourse);
                              setDetailCourse(null);
                            }}
                          >
                            {t("admin.journal.edit")}
                          </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {editCourse && isAdmin && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.edit")}{" "}
                        {t("admin.journal.name").toLowerCase()}
                      </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editCourse.name}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              name: e.target.value,
                            })
                          }
                          placeholder={t("admin.journal.name")}
                        />
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setEditCourse(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          onClick={handleEditCourse}
                        >
                          {t("admin.journal.save")}
                        </button>
                </div>
              </div>
            </div>
          )}


                {/* Модальные окна для преподавателей */}
                {showAddTeacher && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.addTeacher")}
                      </h3>
                      <form onSubmit={handleAddTeacher}>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <input
                            name="name"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t(
                              "admin.journal.fullNameTeacherHeader"
                            )}
                            required
                          />
                          <input
                            name="email"
                            type="email"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.emailHeader")}
                            required
                          />
                          <input
                            name="password"
                            type="password"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.passwordHeader")}
                            required
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowAddTeacher(false)}
                          >
                            {t("admin.journal.cancel")}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          >
                            {t("admin.journal.save")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {editTeacher && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.edit")}{" "}
                        {t("admin.journal.teacher").toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editTeacher.name}
                          onChange={(e) =>
                            setEditTeacher({
                              ...editTeacher,
                              name: e.target.value,
                            })
                          }
                          placeholder={t("admin.journal.fullNameTeacherHeader")}
                        />
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editTeacher.email}
                          onChange={(e) =>
                            setEditTeacher({
                              ...editTeacher,
                              email: e.target.value,
                            })
                          }
                          placeholder={t("admin.journal.emailHeader")}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setEditTeacher(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          onClick={handleEditTeacher}
                        >
                          {t("admin.journal.save")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deleteTeacher && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.delete")}{" "}
                        {t("admin.journal.teacher").toLowerCase()}?
                      </h3>
                      <p className="text-sm text-gray-700">
                        {t("admin.journal.deleteConfirm")} "{deleteTeacher.name}
                        "? {t("admin.journal.cannotUndo")}
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setDeleteTeacher(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                          onClick={handleDeleteTeacher}
                        >
                          {t("admin.journal.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Модальные окна для групп */}
                {showAddGroup && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.addGroup")}
                      </h3>
                      <form onSubmit={handleAddGroup}>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <input
                            name="name"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.groupHeader")}
                            required
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowAddGroup(false)}
                          >
                            {t("admin.journal.cancel")}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          >
                            {t("admin.journal.save")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {editGroup && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.edit")}{" "}
                        {t("admin.journal.group").toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editGroup.name}
                          onChange={(e) =>
                            setEditGroup({ ...editGroup, name: e.target.value })
                          }
                          placeholder={t("admin.journal.groupHeader")}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setEditGroup(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          onClick={handleEditGroup}
                        >
                          {t("admin.journal.save")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deleteGroup && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.delete")}{" "}
                        {t("admin.journal.group").toLowerCase()}?
                      </h3>
                      <p className="text-sm text-gray-700">
                        {t("admin.journal.deleteConfirm")} "{deleteGroup.name}"?{" "}
                        {t("admin.journal.cannotUndo")}
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setDeleteGroup(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                          onClick={handleDeleteGroup}
                        >
                          {t("admin.journal.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Модальные окна для студентов */}
                {showAddStudent && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.addStudent")}
                      </h3>
                      <form onSubmit={handleAddStudent}>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <input
                            name="name"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.fullNameHeader")}
                            required
                          />
                          <input
                            name="email"
                            type="email"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.emailHeader")}
                            required
                          />
                          <input
                            name="password"
                            type="password"
                            className="px-3 py-2 border rounded-lg"
                            placeholder={t("admin.journal.passwordHeader")}
                            required
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowAddStudent(false)}
                          >
                            {t("admin.journal.cancel")}
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          >
                            {t("admin.journal.save")}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {editStudent && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.edit")}{" "}
                        {t("admin.journal.student").toLowerCase()}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editStudent.name}
                          onChange={(e) =>
                            setEditStudent({
                              ...editStudent,
                              name: e.target.value,
                            })
                          }
                          placeholder={t("admin.journal.fullNameHeader")}
                        />
                        <input
                          className="px-3 py-2 border rounded-lg"
                          value={editStudent.email}
                          onChange={(e) =>
                            setEditStudent({
                              ...editStudent,
                              email: e.target.value,
                            })
                          }
                          placeholder={t("admin.journal.emailHeader")}
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setEditStudent(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                          onClick={handleEditStudent}
                        >
                          {t("admin.journal.save")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deleteStudent && isAdmin && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.delete")}{" "}
                        {t("admin.journal.student").toLowerCase()}?
                      </h3>
                      <p className="text-sm text-gray-700">
                        {t("admin.journal.deleteConfirm")} "{deleteStudent.name}
                        "? {t("admin.journal.cannotUndo")}
                      </p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setDeleteStudent(null)}
                        >
                          {t("admin.journal.cancel")}
                        </button>
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                          onClick={handleDeleteStudent}
                        >
                          {t("admin.journal.delete")}
                        </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальные окна (доступны для админа) */}
          {/* Модальное окно с курсами студента */}
          {isAdmin && selectedStudentCourses && (
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
                          {t("admin.journal.courses")}{" "}
                          {selectedStudentCourses.name}
                  </h3>
                  <button
                    onClick={() => setSelectedStudentCourses(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                    </svg>
                  </button>
                </div>
                      {selectedStudentCourses.courseDetails &&
                      selectedStudentCourses.courseDetails.length > 0 ? (
                  <div className="space-y-2">
                          {selectedStudentCourses.courseDetails.map(
                            (course, idx) => (
                              <div
                                key={idx}
                                className="text-sm text-gray-700 py-1"
                              >
                                <span className="font-medium">
                                  • {course.code}
                                </span>{" "}
                                — {course.name} —{" "}
                                <span className="text-gray-600">
                                  {course.status}
                                </span>
                      </div>
                            )
                          )}
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
          {isAdmin && selectedUserForEdit && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForEdit(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t("admin.settings.changeRole")}
                      </h3>
                <div className="space-y-3 text-sm">
                  <div>
                          <span className="text-gray-500">
                            {t("admin.settings.currentName")}:
                          </span>{" "}
                          <span className="text-gray-900 ml-2">
                            {selectedUserForEdit.name}
                          </span>
                  </div>
                  <div>
                          <span className="text-gray-500">
                            {t("admin.journal.emailHeader")}:
                          </span>{" "}
                          <span className="text-gray-900 ml-2">
                            {selectedUserForEdit.email}
                          </span>
                  </div>
                  <div>
                          <label className="block text-gray-500 mb-2">
                            {t("admin.settings.selectNewRole")}:
                          </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400">
                            <option>{t("admin.settings.student")}</option>
                            <option>{t("admin.settings.teacher")}</option>
                            <option>{t("admin.settings.administrator")}</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedUserForEdit(null)}
                  >
                          {t("admin.journal.cancel")}
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    onClick={() => setSelectedUserForEdit(null)}
                  >
                          {t("admin.settings.saveChanges")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно сброса пароля */}
          {isAdmin && selectedUserForPassword && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForPassword(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.settings.resetPassword")}
                      </h3>
                <p className="text-sm text-gray-700 mb-4">
                        {t("admin.settings.resetPasswordConfirm")}{" "}
                        {selectedUserForPassword.name}?
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setSelectedUserForPassword(null)}
                  >
                          {t("admin.journal.cancel")}
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    onClick={() => setSelectedUserForPassword(null)}
                  >
                          {t("admin.settings.yesReset")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно удаления пользователя */}
          {isAdmin && selectedUserForDelete && (
            <div 
              className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedUserForDelete(null)}
            >
              <div 
                className="bg-white rounded-lg border border-gray-200 shadow-md w-full max-w-md p-5"
                onClick={(e) => e.stopPropagation()}
              >
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Удалить пользователя?
                      </h3>
                <p className="text-sm text-gray-700 mb-4">
                        Вы уверены, что хотите удалить пользователя "
                        {selectedUserForDelete.name}"? Это действие нельзя
                        отменить.
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

          {/* Курсы для админа */}
                {isAdmin && tab === "courses" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={courseStatus} 
                  onChange={(e) => setCourseStatus(e.target.value)}
                >
                        <option>{t("admin.journal.all")}</option>
                        <option>{t("admin.journal.active")}</option>
                        <option>{t("admin.journal.archive")}</option>
                </select>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddCourse(true)}
                >
                        + {t("admin.journal.addCourse")}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>
              
              {/* Таблица курсов */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.number")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.codeHeader")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.name")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.teacherHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.groupsHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.statusHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.dateHeader")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.actions")}
                            </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                            <tr
                              key={row.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.code}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                {row.translatedName || row.name}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.teacher}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {(row.groups || []).join(", ")}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.status === "Активен"
                                  ? t("admin.journal.active")
                                  : row.status === "Неактивен"
                                  ? t("admin.journal.inactive")
                                  : row.status}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.createdAt || row.updatedAt || "—"}
                              </td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Информация о курсе"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[Journal] Info button clicked for course (admin):', row);
                                setDetailCourse(row);
                              }}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Просмотр уроков"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  console.log('[Journal] Lessons button clicked for course (admin):', row);
                                  setSelectedCourseForLessons(row);
                                  const response = await fetchSubjectWithLessons(row.id);
                                  const lessons = response.data?.lessons || response.lessons || [];
                                  setCourseLessons(lessons);
                                  console.log('[Journal] Lessons loaded (admin):', lessons.length);
                                } catch (error) {
                                  console.error('[Journal] Error loading lessons (admin):', error);
                                  alert("Не удалось загрузить уроки");
                                }
                              }}
                            >
                              <EyeIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                              title={t("admin.journal.delete")}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[Journal] Delete button clicked for course (admin):', row);
                                setDeleteCourse(row);
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {getFilteredData().length === 0 && (
                      <tr>
                              <td
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                colSpan={8}
                              >
                                {searchQuery
                                  ? `${t(
                                      "admin.journal.noMatches"
                                    )} "${searchQuery}"`
                                  : t("admin.journal.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Преподаватели */}
                {isAdmin && tab === "teachers" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddTeacher(true)}
                >
                        + {t("admin.journal.addTeacher")}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>
              
              {/* Таблица преподавателей */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.number")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.fullNameTeacherHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.phoneHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.subjectHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.groupsHeader")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.actions")}
                            </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                            <tr
                              key={row.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                {row.name}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.phone}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.course}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {(row.groups || []).join(", ")}
                              </td>
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
                              <td
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                colSpan={6}
                              >
                                {searchQuery
                                  ? `${t(
                                      "admin.journal.noMatches"
                                    )} "${searchQuery}"`
                                  : t("admin.journal.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Студенты */}
                {isAdmin && tab === "students" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                {/* Фильтр групп справа от поиска */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={selectedStudentGroup}
                  onChange={(e) => {
                    setSelectedStudentGroup(e.target.value);
                          setStudentGroupFilter(""); // Очищаем старый фильтр
                        }}
                      >
                        <option value="">{t("admin.journal.allGroups")}</option>
                        {getAllGroups().map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                  ))}
                </select>
                {studentGroupFilter && (
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => {
                            setStudentGroupFilter("");
                            setTab("groups");
                    }}
                  >
                          ← {t("admin.journal.backToGroups")}
                  </button>
                )}
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddStudent(true)}
                >
                        + {t("admin.journal.addStudent")}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>

              {/* Проверка: показывать ли сообщение по умолчанию или таблицу */}
                    {!searchQuery &&
                    !selectedStudentGroup &&
                    !studentGroupFilter ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-gray-500">
                          ⚙️ {t("admin.journal.selectGroup")}
                  </p>
                </div>
              ) : (
                /* Таблица студентов */
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                {!selectedStudentGroup && !studentGroupFilter ? (
                  /* Группировка по группам */
                  <div>
                            {Object.entries(
                              getStudentsGroupedByGroup(getFilteredData())
                            ).map(([groupName, students], groupIdx) => (
                              <div
                                key={groupName}
                                className={
                                  groupIdx > 0
                                    ? "mt-4 border-t border-gray-200"
                                    : ""
                                }
                              >
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-800">
                                    {t("admin.journal.group")} {groupName}
                          </h3>
                        </div>
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        №
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        ФИО
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        Email
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        Пароль
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        Пройдено курсов
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        Статус
                                      </th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        Действия
                                      </th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((row, idx) => (
                                      <tr
                                        key={row.id}
                                        className="hover:bg-gray-100 transition-colors"
                                      >
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                          {row.name}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {row.email}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {row.password}
                                        </td>
                                <td 
                                  className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                          onClick={() =>
                                            row.courseDetails &&
                                            row.courseDetails.length > 0 &&
                                            setSelectedStudentCourses(row)
                                          }
                                >
                                  <div className="flex items-center justify-center gap-1">
                                            <span>
                                              {formatCoursesCount(row.courses)}
                                            </span>
                                            {row.courseDetails &&
                                              row.courseDetails.length > 0 && (
                                                <svg
                                                  className="w-4 h-4 text-gray-400"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={2}
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                      </svg>
                                    )}
                                  </div>
                                </td>
                                        <td
                                          className={`px-4 py-3 border border-gray-200 text-center text-sm ${
                                            row.status === "Активен"
                                              ? "text-gray-900"
                                              : "text-gray-500"
                                          }`}
                                        >
                                  {row.status}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                      title="Просмотр"
                                              onClick={() =>
                                                setDetailCourse(row)
                                              }
                                    >
                                      <EyeIcon />
                                    </button>
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                      title="Редактировать"
                                              onClick={() =>
                                                setEditStudent(row)
                                              }
                                    >
                                      <EditIcon />
                                    </button>
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                                      title="Удалить"
                                              onClick={() =>
                                                setDeleteStudent(row)
                                              }
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
                            {Object.keys(
                              getStudentsGroupedByGroup(getFilteredData())
                            ).length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                                {searchQuery
                                  ? `${t(
                                      "admin.journal.noMatches"
                                    )} "${searchQuery}"`
                                  : t("admin.journal.noData")}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Обычная таблица при выборе конкретной группы или поиске */
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.number")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.fullNameHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.emailHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.passwordHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.groupHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.coursesCompletedHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.statusHeader")}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.actions")}
                                </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredData().map((row, idx) => {
                        const isExpanded = isGroupExpanded(row.group);
                        return (
                          <React.Fragment key={row.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {idx + 1}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                        {row.name}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {row.email}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {row.password}
                                      </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                                <button
                                          onClick={() =>
                                            handleGroupInStudentsClick(
                                              row.group
                                            )
                                          }
                                  className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors font-medium flex items-center justify-center gap-1"
                                >
                                          <span>{isExpanded ? "▲" : "▼"}</span>
                                  <span>{row.group}</span>
                                </button>
                              </td>
                              <td 
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                        onClick={() =>
                                          row.courseDetails &&
                                          row.courseDetails.length > 0 &&
                                          setSelectedStudentCourses(row)
                                        }
                              >
                                <div className="flex items-center justify-center gap-1">
                                          <span>
                                            {formatCoursesCount(row.courses)}
                                          </span>
                                          {row.courseDetails &&
                                            row.courseDetails.length > 0 && (
                                              <svg
                                                className="w-4 h-4 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                    </svg>
                                  )}
                                </div>
                              </td>
                                      <td
                                        className={`px-4 py-3 border border-gray-200 text-center text-sm ${
                                          row.status === "Активен"
                                            ? "text-gray-900"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {row.status === "Активен"
                                          ? t("admin.journal.active")
                                          : row.status === "Неактивен"
                                          ? t("admin.journal.inactive")
                                          : row.status}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                            title={t("admin.journal.view")}
                                    onClick={() => setDetailCourse(row)}
                                  >
                                    <EyeIcon />
                                  </button>
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                    title="Редактировать"
                                            onClick={() => setEditStudent(row)}
                                  >
                                    <EditIcon />
                                  </button>
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                                    title="Удалить"
                                            onClick={() =>
                                              setDeleteStudent(row)
                                            }
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Вложенная таблица студентов группы */}
                            {isExpanded && (
                              <tr>
                                        <td
                                          colSpan={8}
                                          className="px-0 py-0 border-0 bg-gray-50"
                                        >
                                  <div className="pt-2 pb-3 border-t border-gray-200 transition-all duration-200 ease-in-out">
                                    <div className="text-sm text-gray-500 mb-3 ml-6">
                                              {t(
                                                "admin.journal.studentsOfGroup"
                                              )}{" "}
                                              {row.group}
                                    </div>
                                    <div className="ml-6 mr-4">
                                              {getStudentsByGroup(row.group)
                                                .length > 0 ? (
                                        <table className="w-full border-collapse bg-white">
                                          <thead className="bg-gray-50">
                                            <tr>
                                                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.number"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.fullNameHeader"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.emailHeader"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.passwordHeader"
                                                        )}
                                                      </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                                    {getStudentsByGroup(
                                                      row.group
                                                    ).map(
                                                      (student, studentIdx) => (
                                                        <tr
                                                          key={student.id}
                                                          className="hover:bg-gray-50 transition-colors"
                                                        >
                                                          <td className="px-4 py-2 border border-gray-200 text-center text-sm text-gray-900">
                                                            {studentIdx + 1}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.name}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.email}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.password}
                                                          </td>
                                              </tr>
                                                      )
                                                    )}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                                  {t(
                                                    "admin.journal.noStudentsInGroup"
                                                  )}
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
                                  <td
                                    className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                    colSpan={8}
                                  >
                                    {searchQuery
                                      ? `${t(
                                          "admin.journal.noMatches"
                                        )} "${searchQuery}"`
                                      : t("admin.journal.noData")}
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
                {isAdmin && tab === "groups" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                <button 
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                  onClick={() => setShowAddGroup(true)}
                >
                        + {t("admin.journal.addGroup")}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>
              
              {/* Таблица групп */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.number")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.groupHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.assignedCoursesHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.studentsCountHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.curatorHeader")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.actions")}
                            </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((row, idx) => (
                            <tr
                              key={row.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {idx + 1}
                              </td>
                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                          <button
                            onClick={() => handleGroupClick(row.name)}
                            className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors"
                          >
                            {row.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {(row.courses || []).join(", ")}
                        </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.studentsCount}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                {row.curator}
                              </td>
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
                              <td
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                colSpan={6}
                              >
                                {searchQuery
                                  ? `${t(
                                      "admin.journal.noMatches"
                                    )} "${searchQuery}"`
                                  : t("admin.journal.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Настройки */}
                {isAdmin && tab === "settings" && (
            <div className="space-y-4">
              {!showUserManagement ? (
                /* Основной экран настроек */
                <>
                  {/* Профиль администратора */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            {t("admin.settings.adminProfile")}
                          </h3>
                    <div className="space-y-3">
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.fullName")}
                              </label>
                        <input
                          type="text"
                          value={adminProfile.name}
                                onChange={(e) =>
                                  setAdminProfile({
                                    ...adminProfile,
                                    name: e.target.value,
                                  })
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.email")}
                              </label>
                        <input
                          type="email"
                          value={adminProfile.email}
                                onChange={(e) =>
                                  setAdminProfile({
                                    ...adminProfile,
                                    email: e.target.value,
                                  })
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.phone")}
                              </label>
                        <input
                          type="tel"
                          value={adminProfile.phone}
                                onChange={(e) =>
                                  setAdminProfile({
                                    ...adminProfile,
                                    phone: e.target.value,
                                  })
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="pt-2">
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                                {t("admin.settings.changePassword")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Управление пользователями */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            {t("admin.settings.userManagement")}
                          </h3>
                    <button
                      onClick={() => setShowUserManagement(true)}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                    >
                            {t("admin.settings.userManagement")}
                    </button>
                  </div>

                  {/* Платформа */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-4">
                            {t("admin.settings.platform")}
                          </h3>
                    <div className="space-y-3">
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.platformName")}
                              </label>
                        <input
                          type="text"
                          value={platformSettings.name}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    name: e.target.value,
                                  })
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.language")}
                              </label>
                        <select
                          value={language}
                                onChange={(e) =>
                                  handleLanguageChange(e.target.value)
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                                <option value="ru">
                                  {t("admin.settings.russian")}
                                </option>
                                <option value="kk">
                                  {t("admin.settings.kazakh")}
                                </option>
                                <option value="en">
                                  {t("admin.settings.english")}
                                </option>
                        </select>
                      </div>
                      <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                {t("admin.settings.supportEmail")}
                              </label>
                        <input
                          type="email"
                          value={platformSettings.supportEmail}
                                onChange={(e) =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    supportEmail: e.target.value,
                                  })
                                }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                              <label className="text-sm text-gray-600">
                                {t("admin.settings.maintenanceMode")}
                              </label>
                        <button
                                onClick={() =>
                                  setPlatformSettings({
                                    ...platformSettings,
                                    maintenanceMode:
                                      !platformSettings.maintenanceMode,
                                  })
                                }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  platformSettings.maintenanceMode
                                    ? "bg-[#2563EB]"
                                    : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    platformSettings.maintenanceMode
                                      ? "translate-x-6"
                                      : "translate-x-1"
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
                              setTimeout(
                                () => setShowSaveNotification(false),
                                3000
                              );
                      }}
                      className="w-full px-6 py-3 bg-[#2563EB] text-white rounded-lg text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                    >
                            {t("admin.settings.saveChanges")}
                    </button>
                  </div>

                  {/* Уведомление о сохранении */}
                  {showSaveNotification && (
                    <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                            {t("admin.settings.changesSaved")}
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
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19l-7-7 7-7"
                              />
                      </svg>
                            {t("admin.settings.backToSettings")}
                    </button>
                  </div>

                  {/* Заголовок */}
                  <div className="mb-6">
                          <h2 className="text-2xl font-semibold text-gray-900">
                            {t("admin.settings.userManagementTitle")}
                          </h2>
                  </div>

                  {/* Фильтр и кнопка добавления */}
                  <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                            <option value="">
                              {t("admin.settings.allUsers")}
                            </option>
                            <option value={t("admin.settings.onlyStudents")}>
                              {t("admin.settings.onlyStudents")}
                            </option>
                            <option value={t("admin.settings.onlyTeachers")}>
                              {t("admin.settings.onlyTeachers")}
                            </option>
                    </select>
                    <button 
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
                            onClick={() => {
                              /* TODO: добавить модальное окно */
                            }}
                    >
                            + {t("admin.settings.addUser")}
                    </button>
                  </div>
                  
                  {/* Таблица пользователей */}
                  <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.settings.number")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.fullNameHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.emailHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.settings.role")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.statusHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.actions")}
                                </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredUsers().map((user, idx) => (
                                <tr
                                  key={user.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                    {user.name}
                                  </td>
                                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                    {user.email}
                                  </td>
                                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                    {user.role}
                                  </td>
                                  <td
                                    className={`px-4 py-3 border border-gray-200 text-center text-sm ${
                                      user.status === "Активен"
                                        ? "text-gray-900"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {user.status === "Активен"
                                      ? t("admin.journal.active")
                                      : user.status === "Неактивен"
                                      ? t("admin.journal.inactive")
                                      : user.status}
                            </td>
                            <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                        onClick={() =>
                                          setSelectedUserForEdit(user)
                                        }
                                >
                                        {t("admin.settings.change")}
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                        onClick={() =>
                                          setSelectedUserForPassword(user)
                                        }
                                >
                                        {t("admin.settings.resetPassword")}
                                </button>
                                <button
                                  className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                        onClick={() =>
                                          setSelectedUserForDelete(user)
                                        }
                                >
                                        {t("admin.journal.delete")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {getFilteredUsers().length === 0 && (
                          <tr>
                                  <td
                                    className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                    colSpan={6}
                                  >
                                    {t("admin.journal.noData")}
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

          {/* Контент для преподавателя (такой же как у админа, но без Преподаватели и Настройки) */}
          {isTeacher && (
            <>
              {/* Заголовок */}
              <div className="mb-6">
                <h1 className="text-[28px] font-bold text-gray-900">
                    {teacherSidebarItems.find((item) => item.id === tab)
                      ?.label || t("admin.journal.courses")}
                </h1>
              </div>

            {/* Модалки: Подробнее (доступны для преподавателя) */}
            {detailCourse && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg border border-gray-200 w-full max-w-lg p-5">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {t("admin.journal.details")}
                      </h3>
                <div className="space-y-1 text-sm text-gray-700">
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.name")}:
                          </span>{" "}
                          {detailCourse.translatedName || detailCourse.name}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.teacher")}:
                          </span>{" "}
                          {detailCourse.teacher}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.groups")}:
                          </span>{" "}
                          {typeof detailCourse.groups === 'string' ? detailCourse.groups : (detailCourse.groups || []).join(", ")}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.status")}:
                          </span>{" "}
                          {detailCourse.status ||
                            (detailCourse.code === "ООД14"
                              ? t("admin.journal.archive")
                              : t("admin.journal.active"))}
                        </p>
                        <p>
                          <span className="text-gray-500">
                            {t("admin.journal.description")}:
                          </span>{" "}
                          {detailCourse.description ||
                            "Практический курс по составлению алгоритмов и созданию блок-схем."}
                        </p>
                  {detailCourse.updatedAt && (
                          <p>
                            <span className="text-gray-500">
                              {t("admin.journal.updateDate")}:
                            </span>{" "}
                            {detailCourse.updatedAt}
                          </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setDetailCourse(null)}
                        >
                          {t("admin.journal.close")}
                        </button>
                </div>
              </div>
            </div>
          )}

          {/* Курсы для преподавателя */}
                {isTeacher && tab === "courses" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={courseStatus} 
                  onChange={(e) => setCourseStatus(e.target.value)}
                >
                        <option>{t("admin.journal.all")}</option>
                        <option>{t("admin.journal.active")}</option>
                        <option>{t("admin.journal.archive")}</option>
                </select>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>
              
              {/* Таблица курсов */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.number")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.codeHeader")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.name")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.teacherHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.groupsHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.statusHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.dateHeader")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.actions")}
                            </th>
                    </tr>
                  </thead>
                  <tbody>
                          {loadingCourses ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                              >
                                Загрузка курсов...
                              </td>
                            </tr>
                          ) : getFilteredData().length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                              >
                                {searchQuery
                                  ? `Не найдено совпадений для "${searchQuery}"`
                                  : "Курсы не найдены"}
                              </td>
                            </tr>
                          ) : (
                            getFilteredData().map((row, idx) => (
                              <tr
                                key={row.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.code}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                  {row.translatedName || row.name}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.teacher}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {typeof row.groups === 'string' ? row.groups : (row.groups || []).join(", ")}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.status === "Активен"
                                    ? t("admin.journal.active")
                                    : row.status === "Неактивен"
                                    ? t("admin.journal.inactive")
                                    : row.status}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.createdAt || row.updatedAt || "—"}
                                </td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Информация о курсе"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[Journal] Info button clicked for course (teacher):', row);
                                setDetailCourse(row);
                              }}
                            >
                              <EditIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                              title="Просмотр уроков"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  console.log('[Journal] Lessons button clicked for course (teacher):', row);
                                  // Сохраняем статус из row в selectedCourseForLessons
                                  setSelectedCourseForLessons({
                                    ...row,
                                    status: row.status || "Активен"
                                  });
                                  const response = await fetchSubjectWithLessons(row.id);
                                  const lessons = response.data?.lessons || response.lessons || [];
                                  setCourseLessons(lessons);
                                  console.log('[Journal] Lessons loaded (teacher):', lessons.length);
                                } catch (error) {
                                  console.error('[Journal] Error loading lessons (teacher):', error);
                                  alert("Не удалось загрузить уроки");
                                }
                              }}
                            >
                              <EyeIcon />
                            </button>
                            <button 
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors" 
                              title="Удалить курс"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('[Journal] Delete button clicked for course:', row);
                                console.log('[Journal] isTeacher:', isTeacher, 'isAdmin:', isAdmin);
                                setDeleteCourse(row);
                                console.log('[Journal] deleteCourse state set to:', row);
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                            ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Группы для преподавателя */}
                {isTeacher && tab === "groups" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>
              
              {/* Таблица групп */}
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.number")}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.groupHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.assignedCoursesHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.studentsCountHeader")}
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.curatorHeader")}
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                              {t("admin.journal.actions")}
                            </th>
                    </tr>
                  </thead>
                  <tbody>
                          {loading ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                              >
                                Загрузка групп...
                              </td>
                            </tr>
                          ) : getFilteredData().length === 0 ? (
                            <tr>
                              <td
                                className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                                colSpan={6}
                              >
                                {searchQuery
                                  ? `Не найдено совпадений для "${searchQuery}"`
                                  : "Нет данных"}
                              </td>
                            </tr>
                          ) : (
                            getFilteredData().map((row, idx) => (
                              <tr
                                key={row.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {idx + 1}
                                </td>
                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                          <button
                            onClick={() => handleGroupClick(row.name)}
                            className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors"
                          >
                            {row.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {(row.courses || []).join(", ") || "—"}
                        </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.studentsCount || 0}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                  {row.curator || "—"}
                                </td>
                        <td className="px-4 py-3 border border-gray-200 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                      title={t("admin.journal.view")}
                              onClick={() => setDetailCourse(row)}
                            >
                              <EyeIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                            ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Студенты для преподавателя */}
                {isTeacher && tab === "students" && (
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
                        <svg
                          className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-5.2-5.2M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
                          />
                  </svg>
                </div>
                {/* Фильтр групп справа от поиска */}
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  value={selectedStudentGroup}
                  onChange={(e) => {
                    setSelectedStudentGroup(e.target.value);
                          setStudentGroupFilter(""); // Очищаем старый фильтр
                        }}
                      >
                        <option value="">{t("admin.journal.allGroups")}</option>
                        {getAllGroups().map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                  ))}
                </select>
                {studentGroupFilter && (
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => {
                            setStudentGroupFilter("");
                            setTab("groups");
                    }}
                  >
                          ← {t("admin.journal.backToGroups")}
                  </button>
                )}
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                  onClick={exportToExcel}
                >
                        {t("admin.journal.exportExcel")}
                </button>
              </div>

              {/* Проверка: показывать ли сообщение по умолчанию или таблицу */}
                    {!searchQuery &&
                    !selectedStudentGroup &&
                    !studentGroupFilter ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-gray-500">
                          ⚙️ {t("admin.journal.selectGroup")}
                  </p>
                </div>
              ) : (
                /* Таблица студентов */
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                {!selectedStudentGroup && !studentGroupFilter ? (
                  /* Группировка по группам */
                  <div>
                            {Object.entries(
                              getStudentsGroupedByGroup(getFilteredData())
                            ).map(([groupName, students], groupIdx) => (
                              <div
                                key={groupName}
                                className={
                                  groupIdx > 0
                                    ? "mt-4 border-t border-gray-200"
                                    : ""
                                }
                              >
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-800">
                                    {t("admin.journal.group")} {groupName}
                          </h3>
                        </div>
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-50">
                            <tr>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.number")}
                                      </th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.fullNameHeader")}
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.emailHeader")}
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.passwordHeader")}
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t(
                                          "admin.journal.coursesCompletedHeader"
                                        )}
                                      </th>
                                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.statusHeader")}
                                      </th>
                                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                        {t("admin.journal.actions")}
                                      </th>
                            </tr>
                          </thead>
                          <tbody>
                            {students.map((row, idx) => (
                                      <tr
                                        key={row.id}
                                        className="hover:bg-gray-100 transition-colors"
                                      >
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {idx + 1}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                          {row.name}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {row.email}
                                        </td>
                                        <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                          {row.password}
                                        </td>
                                <td 
                                  className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                          onClick={() =>
                                            row.courseDetails &&
                                            row.courseDetails.length > 0 &&
                                            setSelectedStudentCourses(row)
                                          }
                                >
                                  <div className="flex items-center justify-center gap-1">
                                            <span>
                                              {formatCoursesCount(row.courses)}
                                            </span>
                                            {row.courseDetails &&
                                              row.courseDetails.length > 0 && (
                                                <svg
                                                  className="w-4 h-4 text-gray-400"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={2}
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                      </svg>
                                    )}
                                  </div>
                                </td>
                                        <td
                                          className={`px-4 py-3 border border-gray-200 text-center text-sm ${
                                            row.status === "Активен"
                                              ? "text-gray-900"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {row.status === "Активен"
                                            ? t("admin.journal.active")
                                            : row.status === "Неактивен"
                                            ? t("admin.journal.inactive")
                                            : row.status}
                                </td>
                                <td className="px-4 py-3 border border-gray-200 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button 
                                      className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                              title={t("admin.journal.view")}
                                              onClick={() =>
                                                setDetailCourse(row)
                                              }
                                    >
                                      <EyeIcon />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                            {Object.keys(
                              getStudentsGroupedByGroup(getFilteredData())
                            ).length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                                {searchQuery
                                  ? `${t(
                                      "admin.journal.noMatches"
                                    )} "${searchQuery}"`
                                  : t("admin.journal.noData")}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Обычная таблица при выборе конкретной группы или поиске */
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.number")}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.fullNameHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.emailHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.passwordHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.groupHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.coursesCompletedHeader")}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.statusHeader")}
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                  {t("admin.journal.actions")}
                                </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredData().map((row, idx) => {
                        const isExpanded = isGroupExpanded(row.group);
                        return (
                          <React.Fragment key={row.id}>
                            <tr className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {idx + 1}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                                        {row.name}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {row.email}
                                      </td>
                                      <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                                        {row.password}
                                      </td>
                              <td className="px-4 py-3 border border-gray-200 text-center text-sm">
                                <button
                                          onClick={() =>
                                            handleGroupInStudentsClick(
                                              row.group
                                            )
                                          }
                                  className="text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors font-medium flex items-center justify-center gap-1"
                                >
                                          <span>{isExpanded ? "▲" : "▼"}</span>
                                  <span>{row.group}</span>
                                </button>
                              </td>
                              <td 
                                className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                        onClick={() =>
                                          row.courseDetails &&
                                          row.courseDetails.length > 0 &&
                                          setSelectedStudentCourses(row)
                                        }
                              >
                                <div className="flex items-center justify-center gap-1">
                                          <span>
                                            {formatCoursesCount(row.courses)}
                                          </span>
                                          {row.courseDetails &&
                                            row.courseDetails.length > 0 && (
                                              <svg
                                                className="w-4 h-4 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                    </svg>
                                  )}
                                </div>
                              </td>
                                      <td
                                        className={`px-4 py-3 border border-gray-200 text-center text-sm ${
                                          row.status === "Активен"
                                            ? "text-gray-900"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {row.status === "Активен"
                                          ? t("admin.journal.active")
                                          : row.status === "Неактивен"
                                          ? t("admin.journal.inactive")
                                          : row.status}
                              </td>
                              <td className="px-4 py-3 border border-gray-200 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors" 
                                            title={t("admin.journal.view")}
                                    onClick={() => setDetailCourse(row)}
                                  >
                                    <EyeIcon />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {/* Вложенная таблица студентов группы */}
                            {isExpanded && (
                              <tr>
                                        <td
                                          colSpan={8}
                                          className="px-0 py-0 border-0 bg-gray-50"
                                        >
                                  <div className="pt-2 pb-3 border-t border-gray-200 transition-all duration-200 ease-in-out">
                                    <div className="text-sm text-gray-500 mb-3 ml-6">
                                              {t(
                                                "admin.journal.studentsOfGroup"
                                              )}{" "}
                                              {row.group}
                                    </div>
                                    <div className="ml-6 mr-4">
                                              {getStudentsByGroup(row.group)
                                                .length > 0 ? (
                                        <table className="w-full border-collapse bg-white">
                                          <thead className="bg-gray-50">
                                            <tr>
                                                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.number"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.fullNameHeader"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.emailHeader"
                                                        )}
                                                      </th>
                                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                                                        {t(
                                                          "admin.journal.passwordHeader"
                                                        )}
                                                      </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                                    {getStudentsByGroup(
                                                      row.group
                                                    ).map(
                                                      (student, studentIdx) => (
                                                        <tr
                                                          key={student.id}
                                                          className="hover:bg-gray-50 transition-colors"
                                                        >
                                                          <td className="px-4 py-2 border border-gray-200 text-center text-sm text-gray-900">
                                                            {studentIdx + 1}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.name}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.email}
                                                          </td>
                                                          <td className="px-4 py-2 border border-gray-200 text-left text-sm text-gray-900">
                                                            {student.password}
                                                          </td>
                                              </tr>
                                                      )
                                                    )}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                                  {t(
                                                    "admin.journal.noStudentsInGroup"
                                                  )}
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
                                  <td
                                    className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-600"
                                    colSpan={8}
                                  >
                                    {searchQuery
                                      ? `${t(
                                          "admin.journal.noMatches"
                                        )} "${searchQuery}"`
                                      : t("admin.journal.noData")}
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
            </>
          )}

          {!isAdmin && !isTeacher && (
            <div className="bg-white border rounded-xl shadow p-8 text-center text-gray-700 mt-8">
              Обычный журнал для студентов (админ-вкладки скрыты).
            </div>
          )}
          </div>
        </section>
      </main>

      {/* Модальное окно для редактирования уроков курса (для преподавателя) */}
      {isTeacher && selectedCourseForLessons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Уроки курса: {selectedCourseForLessons.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Статус курса: <span className={`font-semibold ${selectedCourseForLessons.status === "Активен" ? "text-green-600" : "text-gray-500"}`}>
                    {selectedCourseForLessons.status === "Активен" ? "Активен" : selectedCourseForLessons.status === "Архив" ? "Архив" : "Активен"}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (!selectedCourseForLessons || !selectedCourseForLessons.id) {
                      alert("Ошибка: курс не выбран");
                      return;
                    }
                    const currentStatus = selectedCourseForLessons.status || "Активен";
                    const newStatus = currentStatus === "Активен" ? "Архив" : "Активен";
                    const confirmMessage = `Вы уверены, что хотите ${newStatus === "Архив" ? "переместить курс в архив" : "активировать курс"}?`;
                    
                    if (!window.confirm(confirmMessage)) {
                      return;
                    }
                    
                    try {
                      console.log('[Journal] Updating course status:', selectedCourseForLessons.id, newStatus);
                      const updateResponse = await updateSubject(selectedCourseForLessons.id, { status: newStatus });
                      const updatedSubject = updateResponse.data || updateResponse;
                      
                      // Используем response от сервера для обновления состояния
                      const finalStatus = updatedSubject?.status || newStatus;
                      
                      // Обновляем статус в локальном состоянии
                      setSelectedCourseForLessons({
                        ...selectedCourseForLessons,
                        status: finalStatus
                      });
                      
                      // Обновляем статус в списке курсов преподавателя
                      setTeacherCourses(prevCourses => 
                        prevCourses.map(course => 
                          course.id === selectedCourseForLessons.id 
                            ? { ...course, status: finalStatus }
                            : course
                        )
                      );
                      
                      alert(`Статус курса успешно изменен на "${newStatus}"`);
                    } catch (error) {
                      console.error('[Journal] Error updating course status:', error);
                      alert("Не удалось изменить статус курса");
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedCourseForLessons.status === "Активен" || !selectedCourseForLessons.status
                      ? "bg-gray-600 text-white hover:bg-gray-700"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {selectedCourseForLessons.status === "Активен" || !selectedCourseForLessons.status
                    ? "Переместить в архив"
                    : "Активировать курс"}
                </button>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setSelectedCourseForLessons(null);
                    setCourseLessons([]);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      №
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Описание
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseLessons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        Нет уроков. Добавьте первый урок.
                      </td>
                    </tr>
                  ) : (
                    courseLessons.map((lesson, index) => (
                      <tr key={lesson.id} className="hover:bg-gray-50 border-b border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lesson.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lesson.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingLesson(lesson);
                                setLessonModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Редактировать"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm("Вы уверены, что хотите удалить этот урок?")) return;
                                try {
                                  await deleteLesson(lesson.id);
                                  const response = await fetchSubjectWithLessons(selectedCourseForLessons.id);
                                  const lessons = response.data?.lessons || response.lessons || [];
                                  setCourseLessons(lessons);
                                } catch (error) {
                                  console.error('[Journal] Error deleting lesson:', error);
                                  alert("Не удалось удалить урок");
                                }
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                              title="Удалить"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для создания/редактирования урока (для преподавателя) */}
      {isTeacher && lessonModalOpen && (
        <LessonModal
          isOpen={lessonModalOpen}
          onClose={() => {
            setLessonModalOpen(false);
            setEditingLesson(null);
          }}
          onSubmit={async (formValues) => {
            if (!selectedCourseForLessons) {
              alert("Ошибка: курс не выбран");
              return;
            }

            if (!formValues.title || !formValues.title.trim()) {
              alert("Пожалуйста, введите название урока");
              return;
            }

            setLessonModalSaving(true);
            
            // Проверяем, что курс выбран
            if (!selectedCourseForLessons || !selectedCourseForLessons.id) {
              alert("Ошибка: курс не выбран или не найден");
              setLessonModalSaving(false);
              return;
            }

            // Определяем lessonData вне try блока, чтобы она была доступна в catch
            const lessonData = {
              title: formValues.title.trim(),
              description: formValues.description?.trim() || "",
              subject_id: selectedCourseForLessons.id,
              video_url: formValues.video_url?.trim() || null,
              video_description: formValues.video_description?.trim() || null,
            };

            console.log('[Journal] Creating lesson with data:', lessonData);
            console.log('[Journal] Course ID:', selectedCourseForLessons.id);
            console.log('[Journal] API endpoint will be: /lessons');

            try {

              let savedLessonId;
              if (editingLesson) {
                console.log('[Journal] Updating lesson:', editingLesson.id);
                await updateLesson(editingLesson.id, lessonData);
                savedLessonId = editingLesson.id;
              } else {
                console.log('[Journal] Creating new lesson');
                const response = await createLesson(lessonData);
                console.log('[Journal] Lesson created, response:', response);
                savedLessonId = response.data?.id || response.id;
                if (!savedLessonId) {
                  throw new Error("Не удалось получить ID созданного урока");
                }
              }

              // Сохраняем материалы урока только если урок был успешно создан
              if (savedLessonId) {
                const materialPromises = [];

                if (formValues.theory_text && formValues.theory_text.trim()) {
                  try {
                    const textForm = new FormData();
                    textForm.append('title', 'Теория (текст)');
                    textForm.append('type', 'text');
                    textForm.append('content', formValues.theory_text.trim());
                    materialPromises.push(createLessonMaterial(savedLessonId, textForm));
                  } catch (err) {
                    console.error('[Journal] Error creating text material:', err);
                  }
                }

                if (formValues.theory_document) {
                  try {
                    const docForm = new FormData();
                    docForm.append('title', formValues.theory_document.name || 'Теория (документ)');
                    docForm.append('type', 'file');
                    docForm.append('file', formValues.theory_document);
                    materialPromises.push(createLessonMaterial(savedLessonId, docForm));
                  } catch (err) {
                    console.error('[Journal] Error creating document material:', err);
                  }
                }

                if (formValues.video_url && formValues.video_url.trim()) {
                  try {
                    const videoForm = new FormData();
                    videoForm.append('title', 'Видео');
                    videoForm.append('type', 'youtube');
                    videoForm.append('youtube_url', formValues.video_url.trim());
                    materialPromises.push(createLessonMaterial(savedLessonId, videoForm));
                  } catch (err) {
                    console.error('[Journal] Error creating video material:', err);
                  }
                }

                if (materialPromises.length > 0) {
                  try {
                    await Promise.all(materialPromises);
                    console.log('[Journal] All materials saved successfully');
                  } catch (err) {
                    console.error('[Journal] Error saving materials:', err);
                    // Не прерываем процесс, если материалы не сохранились
                  }
                }
              }

              setLessonModalOpen(false);
              setEditingLesson(null);
              
              // Обновляем список уроков
              const response = await fetchSubjectWithLessons(selectedCourseForLessons.id);
              const lessons = response.data?.lessons || response.lessons || [];
              setCourseLessons(lessons);
            } catch (error) {
              console.error('[Journal] Error saving lesson:', error);
              console.error('[Journal] Error details:', {
                status: error.status,
                message: error.message,
                payload: error.payload,
                lessonData: lessonData
              });
              
              let errorMessage = "Не удалось сохранить урок";
              if (error.status === 404) {
                errorMessage = "Эндпоинт не найден. Проверьте подключение к серверу.";
              } else if (error.status === 422) {
                errorMessage = error.message || "Ошибка валидации данных";
              } else if (error.status === 401) {
                errorMessage = "Сессия истекла. Пожалуйста, войдите снова.";
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              alert(errorMessage);
            } finally {
              setLessonModalSaving(false);
            }
          }}
          initialData={editingLesson}
          course={selectedCourseForLessons}
          loading={lessonModalSaving}
        />
      )}

      {/* Модальное окно удаления курса */}
      {(() => {
        const shouldShow = deleteCourse && (isAdmin || isTeacher);
        console.log('[Journal] Modal condition check:', {
          deleteCourse: !!deleteCourse,
          deleteCourseValue: deleteCourse,
          isAdmin,
          isTeacher,
          shouldShow
        });
        return shouldShow;
      })() && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Удалить курс?
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Вы уверены, что хотите удалить курс "{deleteCourse?.name || deleteCourse?.translatedName || 'курс'}"? Это действие нельзя отменить.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Введите пароль для подтверждения:
              </label>
              <input
                type="password"
                value={deleteCoursePassword}
                onChange={(e) => setDeleteCoursePassword(e.target.value)}
                placeholder="Введите ваш пароль"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  console.log('[Journal] Cancel button clicked');
                  setDeleteCourse(null);
                  setDeleteCoursePassword('');
                }}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  console.log('[Journal] Delete confirm button clicked');
                  handleDeleteCourse();
                }}
                disabled={!deleteCoursePassword || !deleteCoursePassword.trim()}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// LessonModal component for teacher
const LessonModal = ({ isOpen, onClose, onSubmit, initialData, course, loading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theory_text: "",
    theory_document: null,
    video_url: "",
    video_description: "",
  });
  const [error, setError] = useState("");
  const [documentFileName, setDocumentFileName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        theory_text: "",
        theory_document: null,
        video_url: initialData?.video_url || "",
        video_description: initialData?.video_description || "",
      });
      setDocumentFileName("");
      setError("");
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['pdf', 'docx', 'pptx'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError("Поддерживаются только файлы: PDF, DOCX, PPTX");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError("Размер файла не должен превышать 50 МБ");
        return;
      }
      
      setFormData((prev) => ({ ...prev, theory_document: file }));
      setDocumentFileName(file.name);
      setError("");
    }
  };

  const handleRemoveDocument = () => {
    setFormData((prev) => ({ ...prev, theory_document: null }));
    setDocumentFileName("");
  };

  const handleSubmit = () => {
    setError("");
    if (!formData.title || !formData.title.trim()) {
      setError("Пожалуйста, введите название урока");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование урока" : "Новый урок"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Основная информация */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Основная информация</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название урока <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например, Введение в алгоритмы"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Описание урока"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Теория */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Теория
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Теория (текст)
                </label>
                <textarea
                  value={formData.theory_text}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, theory_text: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Введите теоретический материал урока..."
                  rows={5}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Текстовое объяснение теории урока
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Теория (документ)
                </label>
                {!documentFileName ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOCX, PPTX (макс. 50 МБ)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.pptx"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <File className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-gray-700">{documentFileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Загрузите документ с теорией (PDF, DOCX, PPTX)
                </p>
              </div>
            </div>
          </div>

          {/* Видео */}
          <div className="border-b pb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Video className="w-4 h-4" />
              Видео
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ссылка на видео
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, video_url: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ссылка на YouTube или другое видео
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание видео
                </label>
                <textarea
                  value={formData.video_description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, video_description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Описание видео материала..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Тестирование */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Тестирование
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              После сохранения урока вы сможете добавить вопросы для тестирования.
            </p>
            <p className="text-xs text-gray-500">
              Система автоматически выберет случайные 10 вопросов из всех загруженных для каждого студента при тестировании.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Journal;
