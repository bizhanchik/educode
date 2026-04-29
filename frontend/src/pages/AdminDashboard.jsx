import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserPlus,
  Eye,
  Upload,
  FileText,
  Video,
  File,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import apiRequest from "../utils/apiClient.js";
import { useLanguage } from "../i18n.jsx";
import { fetchSubjects, createSubject, updateSubject, deleteSubject, fetchSubjectWithLessons, createLesson, createLessonMaterial, fetchLessonQuestions, createQuestion, updateQuestion, deleteQuestion } from "../utils/curriculumApi.js";
import { createTeacherAssignment, getTeacherAssignments, deleteTeacherAssignment } from "../utils/teacherAssignmentsApi.js";

const ROLE_OPTIONS = [
  { value: "", label: "Все роли" },
  { value: "admin", label: "Администраторы" },
  { value: "teacher", label: "Преподаватели" },
  { value: "student", label: "Студенты" },
];

const PAGE_SIZE = 100; // Увеличено для отображения всех данных

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");

  const [usersData, setUsersData] = useState({
    items: [],
    loading: false,
    error: "",
    page: 1,
    total: 0,
    role: "",
    groupId: "",
    search: "",
  });
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userModalSaving, setUserModalSaving] = useState(false);

  const [groupsData, setGroupsData] = useState({
    items: [],
    loading: false,
    error: "",
    page: 1,
    total: 0,
    search: "",
  });
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupModalSaving, setGroupModalSaving] = useState(false);

  const [groupOptions, setGroupOptions] = useState([]);
  const [globalError, setGlobalError] = useState("");

  // Состояния для курсов
  const [coursesData, setCoursesData] = useState({
    items: [],
    loading: false,
    error: "",
    page: 1,
    total: 0,
    search: "",
  });
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseModalSaving, setCourseModalSaving] = useState(false);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonModalSaving, setLessonModalSaving] = useState(false);
  
  // Состояния для вопросов урока
  const [selectedLessonForQuestions, setSelectedLessonForQuestions] = useState(null);
  const [lessonQuestions, setLessonQuestions] = useState([]);
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionModalSaving, setQuestionModalSaving] = useState(false);

  // Состояния для преподавателей
  const [teachersData, setTeachersData] = useState({
    items: [],
    loading: false,
    error: "",
    page: 1,
    total: 0,
    search: "",
  });
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherModalSaving, setTeacherModalSaving] = useState(false);
  const [groupCourses, setGroupCourses] = useState([]);

  const adminNavItems = [
    { id: "dashboard", label: "Главная панель", icon: BarChart3 },
    { id: "users", label: "Пользователи", icon: Users },
    { id: "groups", label: "Группы", icon: Building2 },
    { id: "courses", label: "Курсы", icon: BookOpen },
    { id: "teachers", label: "Преподаватели", icon: GraduationCap },
    { id: "settings", label: "Настройки сайта", icon: Settings },
    { id: "logout", label: "Выйти", icon: LogOut },
  ];

  const totalUserPages = useMemo(
    () => Math.max(1, Math.ceil(usersData.total / PAGE_SIZE)),
    [usersData.total]
  );

  const totalGroupPages = useMemo(
    () => Math.max(1, Math.ceil(groupsData.total / PAGE_SIZE)),
    [groupsData.total]
  );

  const totalCoursePages = useMemo(
    () => Math.max(1, Math.ceil(coursesData.total / PAGE_SIZE)),
    [coursesData.total]
  );

  const totalTeacherPages = useMemo(
    () => Math.max(1, Math.ceil(teachersData.total / PAGE_SIZE)),
    [teachersData.total]
  );

  const fetchGroupOptions = useCallback(async () => {
    try {
      const response = await apiRequest(`/groups?page=1&size=100`);
      setGroupOptions(response.data.groups || []);
    } catch (error) {
      console.error("Не удалось загрузить группы", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (currentView !== "users") return;
    setUsersData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const params = new URLSearchParams({
        page: String(usersData.page),
        size: String(PAGE_SIZE),
      });
      if (usersData.role) params.append("role", usersData.role);
      if (usersData.groupId) params.append("group_id", usersData.groupId);

      const response = await apiRequest(`/users?${params.toString()}`);
      const serverUsers = response.data?.users || [];
      console.log('[AdminDashboard] Users API response:', {
        usersCount: serverUsers.length,
        total: response.data?.total,
        page: usersData.page,
        size: PAGE_SIZE,
        role: usersData.role,
        groupId: usersData.groupId
      });
      
      const filteredUsers = usersData.search
        ? serverUsers.filter((u) => {
            const query = usersData.search.toLowerCase();
            return (
              u.name.toLowerCase().includes(query) ||
              u.email.toLowerCase().includes(query)
            );
          })
        : serverUsers;

      console.log('[AdminDashboard] After filtering:', filteredUsers.length);

      setUsersData((prev) => ({
        ...prev,
        items: filteredUsers,
        total: response.data?.total || filteredUsers.length,
        loading: false,
      }));
    } catch (error) {
      setUsersData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить пользователей",
      }));
    }
  }, [
    currentView,
    usersData.page,
    usersData.role,
    usersData.groupId,
    usersData.search,
  ]);

  const fetchGroups = useCallback(async () => {
    if (currentView !== "groups") return;
    setGroupsData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const params = new URLSearchParams({
        page: String(groupsData.page),
        size: String(PAGE_SIZE),
      });
      const response = await apiRequest(`/groups?${params.toString()}`);
      setGroupsData((prev) => ({
        ...prev,
        items: response.data?.groups || [],
        total: response.data?.total || 0,
        loading: false,
      }));
    } catch (error) {
      setGroupsData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить группы",
      }));
    }
  }, [currentView, groupsData.page]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchGroupOptions();
    }
  }, [user, fetchGroupOptions]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleChangeView = (viewId) => {
    if (viewId === "logout") {
      logout();
      return;
    }
    setCurrentView(viewId);
    setGlobalError("");
  };

  const handleSubmitUser = async (formValues) => {
    setUserModalSaving(true);
    setGlobalError("");
    
    // Валидация обязательных полей
    if (!formValues.name || !formValues.name.trim()) {
      setGlobalError("Имя пользователя обязательно");
      setUserModalSaving(false);
      return;
    }
    
    if (!formValues.email || !formValues.email.trim()) {
      setGlobalError("Email обязателен");
      setUserModalSaving(false);
      return;
    }
    
    // Для новых пользователей пароль обязателен и минимум 8 символов
    if (!editingUser) {
      if (!formValues.password || formValues.password.length < 8) {
        setGlobalError("Пароль обязателен и должен содержать минимум 8 символов");
        setUserModalSaving(false);
        return;
      }
    }
    
    // Если редактируем и указан новый пароль, проверяем длину
    if (editingUser && formValues.password && formValues.password.length < 8) {
      setGlobalError("Пароль должен содержать минимум 8 символов");
      setUserModalSaving(false);
      return;
    }
    
    // Обрабатываем группы: если выбрано несколько, отправляем массив, если одна - одиночное значение
    let groupPayload = null;
    if (formValues.group_ids && formValues.group_ids.length > 0) {
      if (formValues.group_ids.length === 1) {
        // Если выбрана одна группа, отправляем как group_id для совместимости
        groupPayload = { group_id: Number(formValues.group_ids[0]) };
      } else {
        // Если выбрано несколько групп, отправляем массив
        groupPayload = { 
          group_ids: formValues.group_ids.map(id => Number(id))
        };
      }
    }
    
    const payload = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      role: formValues.role || "student",
      ...groupPayload,
    };
    
    // Добавляем пароль только если это новый пользователь или указан новый пароль
    if (!editingUser) {
      payload.password = formValues.password;
    } else if (formValues.password && formValues.password.trim()) {
      payload.password = formValues.password;
    }

    console.log("🔍 DEBUG: Form values:", formValues);
    console.log("🔍 DEBUG: Payload being sent:", payload);

    try {
      if (editingUser) {
        await apiRequest(`/users/${editingUser.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/users", {
          method: "POST",
          body: payload,
        });
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setUsersData((prev) => ({ ...prev, page: 1 }));
      fetchUsers();
      fetchGroupOptions();
    } catch (error) {
      console.error("Error creating/updating user:", error);
      const errorMessage = error.message || error.payload?.detail || "Не удалось сохранить пользователя";
      setGlobalError(errorMessage);
    } finally {
      setUserModalSaving(false);
    }
  };

  const exportUsersToExcel = async () => {
    try {
      // Загружаем всех пользователей для экспорта
      const response = await apiRequest(`/users?page=1&size=10000`);
      const allUsers = response.data?.users || [];
      
      if (allUsers.length === 0) {
        alert("Нет данных для экспорта");
        return;
      }

      // Преобразуем данные в формат для Excel
      const excelData = allUsers.map((user, idx) => {
        const group = groupOptions.find((g) => g.id === user.group_id);
        return {
          "№": idx + 1,
          "Имя": user.name || "",
          "Email": user.email || "",
          "Роль": user.role || "",
          "Группа": group?.name || "—",
        };
      });

      // Создаем рабочую книгу
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Пользователи");

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
      link.download = `Пользователи_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
      alert("Не удалось экспортировать данные в Excel");
    }
  };

  const exportGroupsToExcel = async () => {
    try {
      const response = await apiRequest(`/groups?page=1&size=10000`);
      const allGroups = response.data?.groups || [];
      
      if (allGroups.length === 0) {
        alert("Нет данных для экспорта");
        return;
      }

      const excelData = allGroups.map((group, idx) => ({
        "№": idx + 1,
        "Название": group.name || "",
        "Создана": group.created_at ? new Date(group.created_at).toLocaleDateString() : "—",
        "Последнее обновление": group.updated_at ? new Date(group.updated_at).toLocaleDateString() : "—",
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Группы");

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
      link.download = `Группы_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
      alert("Не удалось экспортировать данные в Excel");
    }
  };

  const exportCoursesToExcel = async () => {
    try {
      const response = await apiRequest(`/subjects?page=1&size=10000`);
      const allSubjects = response.data?.subjects || [];
      
      if (allSubjects.length === 0) {
        alert("Нет данных для экспорта");
        return;
      }

      // Загружаем назначения для каждого курса
      const coursesWithAssignments = await Promise.all(
        allSubjects.map(async (subject) => {
          try {
            const assignmentsRes = await getTeacherAssignments({ subject_id: subject.id, size: 100 });
            const assignments = assignmentsRes.data?.assignments || [];
            const teachers = [...new Set(assignments.map(a => a.teacher?.name).filter(Boolean))];
            const groups = [...new Set(assignments.map(a => a.group?.name).filter(Boolean))];
            return {
              "№": 0, // будет установлено позже
              "Код курса": subject.code || "",
              "Название курса": subject.name || "",
              "Преподаватель": teachers.join(", ") || "—",
              "Группы": groups.join(", ") || "—",
              "Дата": subject.updated_at ? new Date(subject.updated_at).toLocaleDateString() : "—",
            };
          } catch (err) {
            return {
              "№": 0,
              "Код курса": subject.code || "",
              "Название курса": subject.name || "",
              "Преподаватель": "—",
              "Группы": "—",
              "Дата": subject.updated_at ? new Date(subject.updated_at).toLocaleDateString() : "—",
            };
          }
        })
      );

      const excelData = coursesWithAssignments.map((course, idx) => ({
        ...course,
        "№": idx + 1,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Курсы");

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
      link.download = `Курсы_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
      alert("Не удалось экспортировать данные в Excel");
    }
  };

  const exportTeachersToExcel = async () => {
    try {
      const response = await apiRequest(`/users?role=teacher&page=1&size=10000`);
      const allTeachers = response.data?.users || [];
      
      if (allTeachers.length === 0) {
        alert("Нет данных для экспорта");
        return;
      }

      // Загружаем назначения для каждого преподавателя
      const teachersWithAssignments = await Promise.all(
        allTeachers.map(async (teacher) => {
          try {
            const assignmentsRes = await getTeacherAssignments({ teacher_id: teacher.id, size: 100 });
            const assignments = assignmentsRes.data?.assignments || [];
            const groups = [...new Set(assignments.map(a => a.group?.name).filter(Boolean))];
            const subjects = [...new Set(assignments.map(a => a.subject?.name).filter(Boolean))];
            const subjectCodes = [...new Set(assignments.map(a => a.subject?.code).filter(Boolean))];
            const isCurator = assignments.some(a => a.is_curator) ? "Да" : "Нет";
            
            return {
              "№": 0, // будет установлено позже
              "Имя": teacher.name || "",
              "Email": teacher.email || "",
              "Группа": groups.join(", ") || "—",
              "Предмет": subjects.join(", ") || "—",
              "Код предмета": subjectCodes.join(", ") || "—",
              "Куратор": isCurator,
            };
          } catch (err) {
            return {
              "№": 0,
              "Имя": teacher.name || "",
              "Email": teacher.email || "",
              "Группа": "—",
              "Предмет": "—",
              "Код предмета": "—",
              "Куратор": "Нет",
            };
          }
        })
      );

      const excelData = teachersWithAssignments.map((teacher, idx) => ({
        ...teacher,
        "№": idx + 1,
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Преподаватели");

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
      link.download = `Преподаватели_${dateStr}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
      alert("Не удалось экспортировать данные в Excel");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm("Удалить пользователя? Это действие нельзя отменить.")
    ) {
      return;
    }
    setGlobalError("");
    try {
      await apiRequest(`/users/${userId}`, { method: "DELETE" });
      fetchUsers();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || "Не удалось удалить пользователя");
    }
  };

  const handleSubmitGroup = async (formValues) => {
    setGroupModalSaving(true);
    setGlobalError("");
    const payload = { name: formValues.name.trim() };
    try {
      if (editingGroup) {
        await apiRequest(`/groups/${editingGroup.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/groups", {
          method: "POST",
          body: payload,
        });
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      setGroupsData((prev) => ({ ...prev, page: 1 }));
      fetchGroups();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || "Не удалось сохранить группу");
    } finally {
      setGroupModalSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (
      !window.confirm(
        "Удалить группу? Пользователи в группе должны быть переназначены заранее."
      )
    ) {
      return;
    }
    setGlobalError("");
    try {
      await apiRequest(`/groups/${groupId}`, { method: "DELETE" });
      fetchGroups();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || "Не удалось удалить группу");
    }
  };

  // Функции для работы с курсами
  const fetchTeacherOptions = useCallback(async () => {
    try {
      console.log('[AdminDashboard] Fetching teachers...');
      const response = await apiRequest(`/users?role=teacher&size=100`);
      const teachers = response.data?.users || [];
      console.log('[AdminDashboard] Teachers loaded:', teachers.length, teachers);
      setTeacherOptions(teachers);
    } catch (error) {
      console.error("[AdminDashboard] Не удалось загрузить преподавателей", error);
      setTeacherOptions([]);
    }
  }, []);

  const fetchCourses = useCallback(async (pageOverride = null) => {
    // Убираем проверку currentView, чтобы можно было обновить данные после сохранения
    // if (currentView !== "courses") return;
    setCoursesData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const pageToUse = pageOverride !== null ? pageOverride : coursesData.page;
      const response = await fetchSubjects({ page: pageToUse, size: PAGE_SIZE });
      const subjects = response.data?.subjects || [];
      
      // Загружаем назначения для каждого курса
      const coursesWithAssignments = await Promise.all(
        subjects.map(async (subject) => {
          try {
            const assignmentsRes = await getTeacherAssignments({ subject_id: subject.id, size: 100 });
            const assignments = assignmentsRes.data?.assignments || [];
            const teachers = [...new Set(assignments.map(a => a.teacher?.name).filter(Boolean))];
            const groups = [...new Set(assignments.map(a => a.group?.name).filter(Boolean))];
            
            return {
              id: subject.id,
              code: subject.code || subject.name?.substring(0, 4).toUpperCase() || "—",
              name: subject.name,
              teachers: teachers.length > 0 ? teachers.join(", ") : "—",
              groups: groups.length > 0 ? groups.join(", ") : "—",
              updatedAt: new Date(subject.updated_at).toLocaleDateString(),
            };
          } catch (err) {
            return {
              id: subject.id,
              code: subject.code || subject.name?.substring(0, 4).toUpperCase() || "—",
              name: subject.name,
              teachers: "—",
              groups: "—",
              updatedAt: new Date(subject.updated_at).toLocaleDateString(),
            };
          }
        })
      );
      
      setCoursesData((prev) => ({
        ...prev,
        items: coursesWithAssignments,
        total: response.data?.total || coursesWithAssignments.length,
        loading: false,
      }));
    } catch (error) {
      setCoursesData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить курсы",
      }));
    }
  }, [currentView, coursesData.page]);

  const handleSubmitCourse = async (formValues) => {
    setCourseModalSaving(true);
    setGlobalError("");
    
    if (!formValues.code || !formValues.code.trim()) {
      setGlobalError("Код курса обязателен");
      setCourseModalSaving(false);
      return;
    }
    if (!formValues.name || !formValues.name.trim()) {
      setGlobalError("Название курса обязательно");
      setCourseModalSaving(false);
      return;
    }
    // Преподаватель и группа не обязательны при создании курса
    // Их можно назначить позже

    try {
      let subjectId;
      const subjectData = {
        name: formValues.name.trim(),
        code: formValues.code.trim().toUpperCase(), // Приводим код к верхнему регистру для единообразия
      };
      
      console.log('[handleSubmitCourse] Sending subjectData to server:', subjectData);

      if (editingCourse) {
        // Просто обновляем информацию о курсе (код и название)
        console.log('[handleSubmitCourse] Updating course:', editingCourse.id, subjectData);
        const updateResponse = await updateSubject(editingCourse.id, subjectData);
        console.log('[handleSubmitCourse] Update response:', updateResponse);
        subjectId = editingCourse.id;
        
        // Немедленно обновляем состояние используя response от сервера
        const updatedSubject = updateResponse.data || updateResponse;
        if (updatedSubject) {
          setCoursesData((prev) => ({
            ...prev,
            items: prev.items.map((course) =>
              course.id === editingCourse.id
                ? {
                    ...course,
                    name: updatedSubject.name || course.name,
                    code: updatedSubject.code || course.code,
                  }
                : course
            ),
          }));
        }
        
        // Обновляем назначения только если указаны преподаватель и группы
        // Если поля пустые - не трогаем существующие назначения (согласно подсказке в форме)
        const hasTeacherAndGroups = formValues.teacher_id && 
                                    formValues.group_ids && 
                                    formValues.group_ids.length > 0;
        
        if (hasTeacherAndGroups) {
          try {
            // Получаем текущие назначения для этого курса (максимум 100)
            const currentAssignments = await getTeacherAssignments({ 
              subject_id: subjectId, 
              size: 100 
            });
            const assignments = currentAssignments.data?.assignments || [];
            
            const newGroupIds = formValues.group_ids.map(id => String(id));
            const newTeacherId = String(formValues.teacher_id);
            
            // Удаляем назначения, которых нет в новом списке или с другим преподавателем
            const toDelete = assignments.filter(assignment => {
              const assignmentGroupId = String(assignment.group?.id || assignment.group_id);
              const assignmentTeacherId = String(assignment.teacher?.id || assignment.teacher_id);
              return !newGroupIds.includes(assignmentGroupId) || assignmentTeacherId !== newTeacherId;
            });
            
            if (toDelete.length > 0) {
              await Promise.all(
                toDelete.map(assignment => deleteTeacherAssignment(assignment.id))
              );
            }
            
            // Создаем новые назначения для групп, которых еще нет
            const existingGroupIds = assignments.map(a => 
              String(a.group?.id || a.group_id)
            );
            
            const groupsToAdd = newGroupIds.filter(groupId => 
              !existingGroupIds.includes(groupId)
            );
            
            if (groupsToAdd.length > 0) {
              await Promise.all(
                groupsToAdd.map(groupId =>
                  createTeacherAssignment({
                    teacher_id: Number(formValues.teacher_id),
                    subject_id: subjectId,
                    group_id: Number(groupId),
                  })
                )
              );
            }
          } catch (error) {
            console.error("Ошибка при обновлении назначений:", error);
            // Не пробрасываем ошибку - назначения не критичны, курс уже обновлен
          }
        }
        // Если преподаватель и группы не указаны - не трогаем существующие назначения
      } else {
        const response = await createSubject(subjectData);
        subjectId = response.data?.id || response.id;

        // Назначаем преподавателя и группы курсу (если указаны)
        if (formValues.teacher_id && formValues.group_ids && formValues.group_ids.length > 0) {
          const assignmentPromises = formValues.group_ids.map(groupId =>
            createTeacherAssignment({
              teacher_id: Number(formValues.teacher_id),
              subject_id: subjectId,
              group_id: Number(groupId),
            })
          );
          await Promise.all(assignmentPromises);
        }
      }

      setCourseModalOpen(false);
      setEditingCourse(null);
      setGlobalError("");
      
      // Принудительно обновляем данные курсов
      console.log('[handleSubmitCourse] Refreshing courses data...');
      setCoursesData((prev) => ({ ...prev, page: 1 }));
      
      // Вызываем fetchCourses с явным указанием страницы 1 и await для гарантии обновления
      // Состояние уже обновлено выше из response, но fetchCourses синхронизирует все данные
      try {
        await fetchCourses(1);
      } catch (err) {
        console.error('[handleSubmitCourse] Error refreshing courses:', err);
      }
      fetchGroupOptions();
      fetchTeacherOptions();
    } catch (error) {
      let errorMessage = "Не удалось сохранить курс";
      if (error.status === 422) {
        errorMessage = error.message || "Ошибка валидации данных";
      } else if (error.status === 409) {
        errorMessage = "Курс с таким кодом или названием уже существует";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setGlobalError(errorMessage);
    } finally {
      setCourseModalSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Удалить курс? Это действие нельзя отменить.")) {
      return;
    }
    setGlobalError("");
    try {
      await deleteSubject(courseId);
      setGlobalError("");
      setCoursesData((prev) => ({ ...prev, page: 1 }));
      await fetchCourses(1);
    } catch (error) {
      setGlobalError(error.message || "Не удалось удалить курс");
    }
  };

  const handleViewCourseLessons = async (course) => {
    try {
      const response = await fetchSubjectWithLessons(course.id);
      setCourseLessons(response.data?.lessons || []);
      setSelectedCourseForLessons(course);
    } catch (error) {
      alert("Не удалось загрузить уроки курса");
    }
  };

  const handleSubmitLesson = async (formValues) => {
    if (!selectedCourseForLessons) {
      alert("Ошибка: курс не выбран");
      return;
    }

    // Валидация
    if (!formValues.title || !formValues.title.trim()) {
      alert("Пожалуйста, введите название урока");
      return;
    }

    setLessonModalSaving(true);
    setGlobalError("");

    try {
      const lessonData = {
        title: formValues.title.trim(),
        description: formValues.description?.trim() || "",
        subject_id: selectedCourseForLessons.id,
        video_url: formValues.video_url?.trim() || null,
        video_description: formValues.video_description?.trim() || null,
      };

      let savedLessonId;
      if (editingLesson) {
        await apiRequest(`/lessons/${editingLesson.id}`, {
          method: "PUT",
          body: lessonData,
        });
        savedLessonId = editingLesson.id;
      } else {
        const response = await createLesson(lessonData);
        savedLessonId = response.data?.id || response.id;
        console.log("Урок успешно создан:", response);
      }

      // Сохраняем материалы урока
      const materialPromises = [];

      // Текстовая теория
      if (formValues.theory_text && formValues.theory_text.trim()) {
        const textForm = new FormData();
        textForm.append('title', 'Теория (текст)');
        textForm.append('material_type', 'TEXT');
        textForm.append('text_content', formValues.theory_text.trim());
        textForm.append('use_for_ai_generation', 'true');
        materialPromises.push(createLessonMaterial(savedLessonId, textForm));
      }

      // Документ для теории
      if (formValues.theory_document) {
        const docForm = new FormData();
        const fileExtension = formValues.theory_document.name.split('.').pop().toUpperCase();
        let materialType = 'PDF';
        if (fileExtension === 'DOCX') materialType = 'DOCX';
        else if (fileExtension === 'PPTX') materialType = 'PPTX';
        
        docForm.append('title', formValues.theory_document.name || 'Теория (документ)');
        docForm.append('material_type', materialType);
        docForm.append('file', formValues.theory_document);
        docForm.append('use_for_ai_generation', 'true');
        materialPromises.push(createLessonMaterial(savedLessonId, docForm));
      }

      // Ссылка на видео
      if (formValues.video_url && formValues.video_url.trim()) {
        const videoForm = new FormData();
        videoForm.append('title', 'Видео');
        videoForm.append('material_type', 'YOUTUBE');
        videoForm.append('url', formValues.video_url.trim());
        videoForm.append('use_for_ai_generation', 'false');
        materialPromises.push(createLessonMaterial(savedLessonId, videoForm));
      }

      // Сохраняем все материалы
      if (materialPromises.length > 0) {
        await Promise.all(materialPromises);
        console.log("Материалы урока успешно сохранены");
      }

      setLessonModalOpen(false);
      setEditingLesson(null);
      setGlobalError("");
      
      // Обновляем список уроков
      await handleViewCourseLessons(selectedCourseForLessons);
    } catch (error) {
      console.error("Ошибка при сохранении урока:", error);
      let errorMessage = "Не удалось сохранить урок";
      if (error.status === 422) {
        errorMessage = error.message || "Ошибка валидации данных";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setGlobalError(errorMessage);
      alert(errorMessage);
    } finally {
      setLessonModalSaving(false);
    }
  };

  // Функции для работы с вопросами урока
  const handleViewLessonQuestions = async (lesson) => {
    try {
      const response = await fetchLessonQuestions(lesson.id);
      setLessonQuestions(response.data?.questions || response.data || []);
      setSelectedLessonForQuestions(lesson);
      setQuestionsModalOpen(true);
    } catch (error) {
      console.error("Ошибка при загрузке вопросов:", error);
      alert("Не удалось загрузить вопросы урока");
    }
  };

  const handleSubmitQuestion = async (formValues) => {
    if (!selectedLessonForQuestions) {
      alert("Ошибка: урок не выбран");
      return;
    }

    // Валидация
    if (!formValues.question_text || !formValues.question_text.trim()) {
      alert("Пожалуйста, введите текст вопроса");
      return;
    }

    if (!formValues.options || formValues.options.length < 2) {
      alert("Добавьте минимум 2 варианта ответа");
      return;
    }

    if (!formValues.correct_answer_index && formValues.correct_answer_index !== 0) {
      alert("Выберите правильный ответ");
      return;
    }

    setQuestionModalSaving(true);
    setGlobalError("");

    try {
      const questionData = {
        question_text: formValues.question_text.trim(),
        options: formValues.options.map(opt => opt.trim()).filter(opt => opt),
        correct_answer_index: Number(formValues.correct_answer_index),
      };

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
      } else {
        await createQuestion(selectedLessonForQuestions.id, questionData);
      }

      setQuestionModalOpen(false);
      setEditingQuestion(null);
      setGlobalError("");
      
      // Обновляем список вопросов
      await handleViewLessonQuestions(selectedLessonForQuestions);
    } catch (error) {
      console.error("Ошибка при сохранении вопроса:", error);
      let errorMessage = "Не удалось сохранить вопрос";
      if (error.status === 422) {
        errorMessage = error.message || "Ошибка валидации данных";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setGlobalError(errorMessage);
      alert(errorMessage);
    } finally {
      setQuestionModalSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Удалить вопрос?")) return;
    try {
      await deleteQuestion(questionId);
      await handleViewLessonQuestions(selectedLessonForQuestions);
    } catch (error) {
      alert("Не удалось удалить вопрос");
    }
  };

  // Функции для работы с преподавателями
  const fetchTeachers = useCallback(async () => {
    if (currentView !== "teachers") return;
    setTeachersData((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await apiRequest(`/users?role=teacher&page=${teachersData.page}&size=${PAGE_SIZE}`);
      const teachers = response.data?.users || [];
      
      // Загружаем назначения для каждого преподавателя
      const teachersWithAssignments = await Promise.all(
        teachers.map(async (teacher) => {
          try {
            const assignmentsRes = await getTeacherAssignments({ teacher_id: teacher.id, size: 100 });
            const assignments = assignmentsRes.data?.assignments || [];
            const groups = [...new Set(assignments.map(a => a.group?.name).filter(Boolean))];
            const subjects = [...new Set(assignments.map(a => a.subject?.name).filter(Boolean))];
            const subjectCodes = [...new Set(assignments.map(a => a.subject?.code).filter(Boolean))];
            
            return {
              id: teacher.id,
              name: teacher.name,
              email: teacher.email,
              groups: groups.length > 0 ? groups.join(", ") : "—",
              subjects: subjects.length > 0 ? subjects.join(", ") : "—",
              subjectCodes: subjectCodes.length > 0 ? subjectCodes.join(", ") : "—",
              isCurator: assignments.some(a => a.is_curator) ? "Да" : "Нет",
            };
          } catch (err) {
            return {
              id: teacher.id,
              name: teacher.name,
              email: teacher.email,
              groups: "—",
              subjects: "—",
              subjectCodes: "—",
              isCurator: "Нет",
            };
          }
        })
      );
      
      setTeachersData((prev) => ({
        ...prev,
        items: teachersWithAssignments,
        total: response.data?.total || teachersWithAssignments.length,
        loading: false,
      }));
    } catch (error) {
      setTeachersData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Не удалось загрузить преподавателей",
      }));
    }
  }, [currentView, teachersData.page]);

  const fetchGroupCourses = async (groupId) => {
    if (!groupId) {
      setGroupCourses([]);
      return;
    }
    try {
      // Загружаем курсы, назначенные этой группе
      const assignmentsRes = await getTeacherAssignments({ group_id: groupId, size: 100 });
      const assignments = assignmentsRes.data?.assignments || [];
      const courses = assignments.map(a => ({
        id: a.subject?.id,
        name: a.subject?.name,
        code: a.subject?.code || a.subject?.name?.substring(0, 4).toUpperCase() || "—",
      }));
      setGroupCourses([...new Map(courses.map(c => [c.id, c])).values()]);
    } catch (error) {
      console.error("Failed to load group courses:", error);
      setGroupCourses([]);
    }
  };

  const handleSubmitTeacher = async (formValues, allGroupCoursesData) => {
    setTeacherModalSaving(true);
    setGlobalError("");
    
    if (!formValues.name || !formValues.name.trim()) {
      setGlobalError("Имя преподавателя обязательно");
      setTeacherModalSaving(false);
      return;
    }
    if (!formValues.email || !formValues.email.trim()) {
      setGlobalError("Email обязателен");
      setTeacherModalSaving(false);
      return;
    }
    if (!editingTeacher && (!formValues.password || formValues.password.trim().length < 8)) {
      setGlobalError("Пароль обязателен и должен содержать минимум 8 символов");
      setTeacherModalSaving(false);
      return;
    }
    // Группы и предметы не обязательны при создании преподавателя
    // Их можно назначить позже через редактирование
    // Фильтруем только валидные группы с выбранными предметами (если есть)
    const validGroups = [];
    if (formValues.selectedGroups && formValues.selectedGroups.length > 0) {
      // Удаляем пустые записи (без группы)
      const groupsWithData = formValues.selectedGroups.filter((g) => g.group_id);
      
      groupsWithData.forEach((g) => {
        if (!g.subject_id) return; // Пропускаем группы без предмета
        const groupCourses = allGroupCoursesData[g.group_id] || [];
        // Сохраняем только группы, где есть доступные предметы И выбран предмет
        if (groupCourses.length > 0) {
          validGroups.push(g);
        }
      });
    }

    try {
      let teacherId;
      if (editingTeacher) {
        await apiRequest(`/users/${editingTeacher.id}`, {
          method: "PUT",
          body: {
            name: formValues.name.trim(),
            email: formValues.email.trim(),
            role: "teacher",
          },
        });
        teacherId = editingTeacher.id;
      } else {
        const response = await apiRequest("/users", {
          method: "POST",
          body: {
            name: formValues.name.trim(),
            email: formValues.email.trim(),
            password: formValues.password.trim(),
            role: "teacher",
          },
        });
        teacherId = response.data?.id || response.id;
      }

      // Назначаем преподавателя каждой группе и предмету (только если есть валидные группы)
      // Если групп нет - преподаватель создается без назначений, их можно добавить позже
      if (validGroups.length > 0) {
        for (const groupData of validGroups) {
          await createTeacherAssignment({
            teacher_id: teacherId,
            subject_id: Number(groupData.subject_id),
            group_id: Number(groupData.group_id),
            is_curator: formValues.is_curator === "yes",
          });
        }
      }

      setTeacherModalOpen(false);
      setEditingTeacher(null);
      setGlobalError("");
      setTeachersData((prev) => ({ ...prev, page: 1 }));
      fetchTeachers();
      fetchGroupOptions();
    } catch (error) {
      let errorMessage = "Не удалось сохранить преподавателя";
      if (error.status === 422) {
        errorMessage = error.message || "Ошибка валидации данных";
      } else if (error.status === 409) {
        errorMessage = "Пользователь с таким email уже существует";
      } else if (error.message) {
        errorMessage = error.message;
      }
      setGlobalError(errorMessage);
    } finally {
      setTeacherModalSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Удалить преподавателя? Это действие нельзя отменить.")) {
      return;
    }
    setGlobalError("");
    try {
      await apiRequest(`/users/${teacherId}`, { method: "DELETE" });
      setGlobalError("");
      setTeachersData((prev) => ({ ...prev, page: 1 }));
      fetchTeachers();
    } catch (error) {
      setGlobalError(error.message || "Не удалось удалить преподавателя");
    }
  };

  // Загрузка данных при смене вкладки
  useEffect(() => {
    if (currentView === "users") {
      fetchUsers();
      fetchGroupOptions();
    } else if (currentView === "groups") {
      fetchGroups();
      fetchGroupOptions();
    } else if (currentView === "courses") {
      fetchCourses();
      fetchGroupOptions();
      fetchTeacherOptions();
    } else if (currentView === "teachers") {
      fetchTeachers();
      fetchGroupOptions();
    }
  }, [currentView, usersData.page, usersData.role, usersData.groupId, groupsData.page, coursesData.page, teachersData.page, fetchUsers, fetchGroups, fetchCourses, fetchTeachers, fetchGroupOptions, fetchTeacherOptions]);

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Доступ ограничен
        </h2>
        <p className="text-gray-600">
          Эта страница доступна только администраторам платформы.
        </p>
      </div>
    );
  }

  const renderDashboard = () => (
    <div>
      <h1 className="text-[28px] font-bold text-gray-900 mb-6">Главная панель</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Всего пользователей",
            value: usersData.total || "—",
            icon: Users,
            bgClass: "bg-blue-100",
            textClass: "text-blue-600",
          },
          {
            title: "Группы",
            value: groupsData.total || groupOptions.length,
            icon: Building2,
            bgClass: "bg-purple-100",
            textClass: "text-purple-600",
          },
          {
            title: "Преподаватели",
            value:
              usersData.items.filter((u) => u.role === "teacher").length || "—",
            icon: GraduationCap,
            bgClass: "bg-green-100",
            textClass: "text-green-600",
          },
          {
            title: "Активные курсы",
            value: 45,
            icon: BookOpen,
            bgClass: "bg-yellow-100",
            textClass: "text-yellow-600",
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
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Быстрые действия
        </h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => {
              setCurrentView("users");
              setUserModalOpen(true);
              setEditingUser(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Создать пользователя
          </button>
          <button
            onClick={() => {
              setCurrentView("groups");
              setGroupModalOpen(true);
              setEditingGroup(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новая группа
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
        <div>
      <h1 className="text-[28px] font-bold text-gray-900">Настройки</h1>
        </div>
  );

  const renderUsers = () => {
    // Используем данные напрямую, так как фильтрация уже происходит в fetchUsers
    // Дополнительная фильтрация только по группе (если нужно)
    const filteredUsers = usersData.items;
    
    console.log('[AdminDashboard] Rendering users:', {
      totalItems: usersData.items.length,
      total: usersData.total,
      page: usersData.page,
      search: usersData.search,
      role: usersData.role,
      groupId: usersData.groupId
    });

    return (
      <div>
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Пользователи</h1>
      </div>

        {/* Кнопки действий, фильтр и поиск */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Поиск слева */}
        <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
            placeholder="Поиск по имени или email"
              value={usersData.search}
              onChange={(e) =>
              setUsersData((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <select
            value={usersData.role}
            onChange={(e) =>
              setUsersData((prev) => ({
                ...prev,
                role: e.target.value,
                page: 1,
              }))
            }
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={usersData.groupId}
            onChange={(e) =>
              setUsersData((prev) => ({
                ...prev,
                groupId: e.target.value,
                page: 1,
              }))
            }
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Все группы</option>
            {groupOptions.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        <button
          onClick={exportUsersToExcel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        >
          Экспорт в Excel
        </button>
        <button
          onClick={() => {
            setUserModalOpen(true);
            setEditingUser(null);
          }}
          className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
        >
          + Добавить пользователя
        </button>
        </div>

        {usersData.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {usersData.error}
          </div>
        )}

      {/* Таблица пользователей */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                №
                    </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Имя
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Роль
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Группа
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Действия
              </th>
              </tr>
            </thead>
          <tbody>
              {usersData.loading ? (
                <tr>
                  <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                  >
                    Загрузка пользователей...
                  </td>
                </tr>
            ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                  >
                  {usersData.search
                    ? `Не найдено совпадений для "${usersData.search}"`
                    : "Пользователи не найдены"}
                  </td>
                </tr>
              ) : (
              filteredUsers.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {(usersData.page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                      {item.name}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                      {item.email}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 capitalize">
                        {item.role}
                      </span>
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {(() => {
                      // Поддерживаем как одну группу (group_id), так и несколько (group_ids)
                      if (item.group_ids && Array.isArray(item.group_ids) && item.group_ids.length > 0) {
                        const groupNames = item.group_ids
                          .map(id => groupOptions.find(g => g.id === id)?.name)
                          .filter(Boolean);
                        return groupNames.length > 0 ? groupNames.join(", ") : "—";
                      } else if (item.group_id) {
                        return groupOptions.find((g) => g.id === item.group_id)?.name || "—";
                      }
                      return "—";
                    })()}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors"
                        title="Редактировать"
                        onClick={() => {
                          setEditingUser(item);
                          setUserModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                        title="Удалить"
                        onClick={() => handleDeleteUser(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={usersData.page}
          totalPages={totalUserPages}
          onChange={(page) => setUsersData((prev) => ({ ...prev, page }))}
        />
    </div>
  );
  };

  const renderGroups = () => {
    // Фильтрация групп по поисковому запросу
    const filteredGroups = groupsData.items.filter((group) => {
      if (!groupsData.search) return true;
      const searchLower = groupsData.search.toLowerCase();
      return group.name?.toLowerCase().includes(searchLower);
    });

    return (
        <div>
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Группы</h1>
        </div>

        {/* Кнопки действий, фильтр и поиск */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Поиск слева */}
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Поиск по названию группы"
              value={groupsData.search}
              onChange={(e) =>
                setGroupsData((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={exportGroupsToExcel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Экспорт в Excel
          </button>
          <button
            onClick={() => {
              setGroupModalOpen(true);
              setEditingGroup(null);
            }}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
          >
            + Добавить группу
          </button>
      </div>

        {groupsData.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {groupsData.error}
          </div>
        )}

      {/* Таблица групп */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                №
                  </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Название
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Создана
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Последнее обновление
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Действия
              </th>
              </tr>
            </thead>
          <tbody>
              {groupsData.loading ? (
                <tr>
                  <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                  >
                    Загрузка групп...
                  </td>
                </tr>
              ) : groupsData.items.length === 0 ? (
                <tr>
                  <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  Группы не найдены
                </td>
              </tr>
            ) : filteredGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  {groupsData.search
                    ? `Не найдено совпадений для "${groupsData.search}"`
                    : "Группы не найдены"}
                  </td>
                </tr>
              ) : (
              filteredGroups.map((group, idx) => (
                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {(groupsData.page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                      {group.name}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                      {new Date(group.created_at).toLocaleDateString()}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                      {new Date(group.updated_at).toLocaleDateString()}
                    </td>
                  <td className="px-4 py-3 border border-gray-200 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors"
                        title="Редактировать"
                        onClick={() => {
                          setEditingGroup(group);
                          setGroupModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                        title="Удалить"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={groupsData.page}
          totalPages={totalGroupPages}
          onChange={(page) => setGroupsData((prev) => ({ ...prev, page }))}
        />
      </div>
    );
  };

  const renderCourses = () => {
    // Фильтрация курсов по поисковому запросу
    const filteredCourses = coursesData.items.filter((course) => {
      if (!coursesData.search) return true;
      const searchLower = coursesData.search.toLowerCase();
      return (
        course.name?.toLowerCase().includes(searchLower) ||
        course.code?.toLowerCase().includes(searchLower) ||
        course.teachers?.toLowerCase().includes(searchLower)
      );
    });

    return (
      <div>
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Курсы</h1>
        </div>

        {/* Кнопки действий, фильтр и поиск */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Поиск слева */}
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Поиск по названию курса или препода"
              value={coursesData.search}
              onChange={(e) =>
                setCoursesData((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={exportCoursesToExcel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Экспорт в Excel
          </button>
          <button
            onClick={() => {
              setCourseModalOpen(true);
              setEditingCourse(null);
            }}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
          >
            + Добавить курс
          </button>
        </div>

      {coursesData.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {coursesData.error}
        </div>
      )}

      {/* Таблица курсов */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                №
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Код курса
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Название курса
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Преподаватель
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Группы
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Дата
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {coursesData.loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  Загрузка курсов...
                </td>
              </tr>
            ) : filteredCourses.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  {coursesData.search
                    ? `Не найдено совпадений для "${coursesData.search}"`
                    : "Курсы не найдены"}
                </td>
              </tr>
            ) : (
              filteredCourses.map((course, idx) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {(coursesData.page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {course.code}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                    {course.name}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {course.teachers || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {course.groups || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {course.updatedAt || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors"
                        title="Уроки"
                        onClick={() => handleViewCourseLessons(course)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors"
                        title="Редактировать"
                        onClick={() => {
                          setEditingCourse(course);
                          setCourseModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                        title="Удалить"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={coursesData.page}
        totalPages={totalCoursePages}
        onChange={(page) => setCoursesData((prev) => ({ ...prev, page }))}
      />
    </div>
  );
  };

  const renderTeachers = () => {
    // Фильтрация преподавателей по поисковому запросу
    const filteredTeachers = teachersData.items.filter((teacher) => {
      if (!teachersData.search) return true;
      const searchLower = teachersData.search.toLowerCase();
      return (
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.groups?.toLowerCase().includes(searchLower) ||
        teacher.subjects?.toLowerCase().includes(searchLower)
      );
    });

    return (
      <div>
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">Преподаватели</h1>
        </div>

        {/* Кнопки действий, фильтр и поиск */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Поиск слева */}
          <div className="relative w-full sm:w-[320px]">
            <input
              type="text"
              placeholder="Поиск по имени, email, группе или предмету"
              value={teachersData.search}
              onChange={(e) =>
                setTeachersData((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={exportTeachersToExcel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Экспорт в Excel
          </button>
          <button
            onClick={() => {
              setTeacherModalOpen(true);
              setEditingTeacher(null);
            }}
            className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm hover:bg-[#1d4ed8] transition-colors"
          >
            + Добавить преподавателя
          </button>
        </div>

      {teachersData.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {teachersData.error}
        </div>
      )}

      {/* Таблица преподавателей */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                №
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Имя
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Группа
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Предмет
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Код предмета
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Куратор
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {teachersData.loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  Загрузка преподавателей...
                </td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-sm text-gray-500 border border-gray-200"
                >
                  {teachersData.search
                    ? `Не найдено совпадений для "${teachersData.search}"`
                    : "Преподаватели не найдены"}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher, idx) => (
                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {(teachersData.page - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                    {teacher.name}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-left text-sm text-gray-900">
                    {teacher.email}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {teacher.groups || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {teacher.subjects || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {teacher.subjectCodes || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center text-sm text-gray-900">
                    {teacher.isCurator || "—"}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-1.5 text-gray-500 hover:text-[#2563EB] transition-colors"
                        title="Редактировать"
                        onClick={() => {
                          setEditingTeacher(teacher);
                          setTeacherModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                        title="Удалить"
                        onClick={() => handleDeleteTeacher(teacher.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={teachersData.page}
        totalPages={totalTeacherPages}
        onChange={(page) => setTeachersData((prev) => ({ ...prev, page }))}
      />
      </div>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case "users":
        return renderUsers();
      case "groups":
        return renderGroups();
      case "courses":
        return renderCourses();
      case "teachers":
        return renderTeachers();
      case "settings":
        return renderSettings();
      case "dashboard":
        return renderDashboard();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="bg-white min-h-screen flex">
      {/* Фиксированное боковое меню */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-gray-200 shadow-sm flex-col p-5 z-30">
        {/* Заголовок */}
        <div className="pt-20 mb-6">
          <h1 className="text-lg font-bold text-gray-900">
            ПАНЕЛЬ АДМИНИСТРАТОРА
          </h1>
          </div>
        {/* Навигация */}
        <nav className="flex-1 flex flex-col gap-1">
          {adminNavItems.map((item) => {
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

      {/* Основной контент */}
      <main className="flex-1 ml-[240px]">
        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
        {globalError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {globalError}
          </div>
        )}

            {renderContent()}
        </div>
        </section>
      </main>

      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false);
          setEditingUser(null);
          setGlobalError("");
        }}
        onSubmit={handleSubmitUser}
        initialData={editingUser}
        groups={groupOptions}
        loading={userModalSaving}
        error={globalError}
      />

      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleSubmitGroup}
        initialData={editingGroup}
        loading={groupModalSaving}
      />

      <CourseModal
        isOpen={courseModalOpen}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(null);
          setGlobalError("");
        }}
        onSubmit={handleSubmitCourse}
        initialData={editingCourse}
        teachers={teacherOptions}
        groups={groupOptions}
        loading={courseModalSaving}
      />

      {selectedCourseForLessons && (
        <LessonsModal
          isOpen={!!selectedCourseForLessons}
          onClose={() => {
            setSelectedCourseForLessons(null);
            setCourseLessons([]);
          }}
          course={selectedCourseForLessons}
          lessons={courseLessons}
          onManageQuestions={handleViewLessonQuestions}
        />
      )}

      <LessonModal
        isOpen={lessonModalOpen}
        onClose={() => {
          setLessonModalOpen(false);
          setEditingLesson(null);
          setGlobalError("");
        }}
        onSubmit={handleSubmitLesson}
        initialData={editingLesson}
        course={selectedCourseForLessons}
        loading={lessonModalSaving}
      />

      <TeacherModal
        isOpen={teacherModalOpen}
        onClose={() => {
          setTeacherModalOpen(false);
          setEditingTeacher(null);
          setGroupCourses([]);
        }}
        onSubmit={handleSubmitTeacher}
        initialData={editingTeacher}
        groups={groupOptions}
        groupCourses={groupCourses}
        onGroupChange={fetchGroupCourses}
        loading={teacherModalSaving}
      />

      {/* Модальное окно для управления вопросами урока */}
      {selectedLessonForQuestions && (
        <QuestionsModal
          isOpen={questionsModalOpen}
          onClose={() => {
            setQuestionsModalOpen(false);
            setSelectedLessonForQuestions(null);
            setLessonQuestions([]);
          }}
          lesson={selectedLessonForQuestions}
          questions={lessonQuestions}
          onAddQuestion={() => {
            setEditingQuestion(null);
            setQuestionModalOpen(true);
          }}
          onEditQuestion={(question) => {
            setEditingQuestion(question);
            setQuestionModalOpen(true);
          }}
          onDeleteQuestion={handleDeleteQuestion}
        />
      )}

      {/* Модальное окно для добавления/редактирования вопроса */}
      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false);
          setEditingQuestion(null);
          setGlobalError("");
        }}
        onSubmit={handleSubmitQuestion}
        initialData={editingQuestion}
        loading={questionModalSaving}
      />
    </div>
  );
};

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
    <span className="text-sm text-gray-600">
      Страница {page} из {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Назад
      </button>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Вперед
      </button>
    </div>
  </div>
);

const UserModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  groups,
  loading,
  error,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    group_ids: [], // Массив ID групп
  });

  useEffect(() => {
    if (isOpen) {
      // Загружаем группы пользователя при редактировании
      let initialGroupIds = [];
      
      // Проверяем разные варианты данных о группах
      if (initialData?.group_ids && Array.isArray(initialData.group_ids)) {
        initialGroupIds = initialData.group_ids.map(id => String(id));
      } else if (initialData?.group_id) {
        initialGroupIds = [String(initialData.group_id)];
      } else if (initialData?.groups && Array.isArray(initialData.groups)) {
        // Если группы приходят как массив объектов
        initialGroupIds = initialData.groups.map(g => String(g.id || g));
      }
      
      setFormData({
        name: initialData?.name || "",
        email: initialData?.email || "",
        password: "",
        role: initialData?.role || "student",
        group_ids: initialGroupIds,
      });
    }
  }, [isOpen, initialData]);

  const handleGroupToggle = (groupId) => {
    const groupIdStr = String(groupId);
    setFormData((prev) => {
      const currentIds = prev.group_ids || [];
      if (currentIds.includes(groupIdStr)) {
        return { ...prev, group_ids: currentIds.filter(id => id !== groupIdStr) };
      } else {
        return { ...prev, group_ids: [...currentIds, groupIdStr] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование пользователя" : "Новый пользователь"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя и фамилия
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например, Алина Смагулова"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@educode.com"
            />
          </div>
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Минимум 8 символов"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Роль
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">Администратор</option>
                <option value="teacher">Преподаватель</option>
                <option value="student">Студент</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Группы
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {groups.length === 0 ? (
                  <p className="text-sm text-gray-500">Нет доступных групп</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => {
                      const isSelected = formData.group_ids?.includes(String(group.id));
                      return (
                        <label
                          key={group.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleGroupToggle(group.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{group.name}</span>
                        </label>
                      );
                    })}
            </div>
                )}
              </div>
              {formData.group_ids?.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Выбрано групп: {formData.group_ids.length}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit(formData)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupModal = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование группы" : "Новая группа"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название группы
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Например, CS-101"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit({ name })}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseModal = ({ isOpen, onClose, onSubmit, initialData, teachers, groups, loading }) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    teacher_id: "",
    group_ids: [], // Изменено на массив для множественного выбора
  });
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  
  console.log('[CourseModal] Props:', { 
    isOpen, 
    teachersCount: teachers?.length || 0, 
    groupsCount: groups?.length || 0,
    teachers,
    groups
  });

  useEffect(() => {
    if (isOpen) {
      console.log('[CourseModal] Opening modal, initialData:', initialData);
      setFormData({
        code: initialData?.code || "",
        name: initialData?.name || "",
        teacher_id: "",
        group_ids: [],
      });
      
      // Загружаем текущие назначения при редактировании
      if (initialData?.id) {
        setLoadingAssignments(true);
        getTeacherAssignments({ subject_id: initialData.id, size: 100 })
          .then((response) => {
            const assignments = response.data?.assignments || [];
            console.log('[CourseModal] Loaded assignments:', assignments);
            if (assignments.length > 0) {
              // Берем первого преподавателя (можно выбрать любого)
              const firstAssignment = assignments[0];
              const teacherId = firstAssignment.teacher?.id || firstAssignment.teacher_id;
              // Собираем все группы из назначений
              const groupIds = assignments
                .map(a => a.group?.id || a.group_id)
                .filter(Boolean)
                .map(id => String(id));
              
              setFormData((prev) => ({
                ...prev,
                teacher_id: teacherId ? String(teacherId) : "",
                group_ids: groupIds,
              }));
            }
          })
          .catch((err) => {
            console.error("[CourseModal] Failed to load assignments:", err);
          })
          .finally(() => {
            setLoadingAssignments(false);
          });
      }
    }
  }, [isOpen, initialData]);
  
  const handleGroupToggle = (groupId) => {
    const groupIdStr = String(groupId);
    setFormData((prev) => {
      const currentIds = prev.group_ids || [];
      if (currentIds.includes(groupIdStr)) {
        return { ...prev, group_ids: currentIds.filter(id => id !== groupIdStr) };
      } else {
        return { ...prev, group_ids: [...currentIds, groupIdStr] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование курса" : "Новый курс"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Код курса *
            </label>
            <input
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например, CS-101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название курса (полное) *
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например, Алгоритмизация и программирование"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Преподаватель (куратор) {initialData && <span className="text-gray-500 text-xs">(оставьте пустым, чтобы не менять)</span>}
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, teacher_id: e.target.value }))
              }
              disabled={loadingAssignments}
              className={`w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                !formData.teacher_id && !loadingAssignments ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            >
              <option value="">{loadingAssignments ? "Загрузка..." : "✓ Выберите преподавателя"}</option>
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.email ? `(${teacher.email})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>Нет доступных преподавателей</option>
              )}
            </select>
            {teachers && teachers.length === 0 && !loadingAssignments && (
              <p className="mt-1 text-xs text-red-600">Загрузите преподавателей в разделе "Преподаватели"</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Группы {initialData && <span className="text-gray-500 text-xs">(оставьте пустым, чтобы не менять)</span>}
            </label>
            <div className={`border rounded-lg p-3 max-h-48 overflow-y-auto ${
              formData.group_ids?.length === 0 ? 'border-gray-200' : 'border-gray-200'
            }`}>
              {groups && groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.map((group) => {
                    const isSelected = formData.group_ids?.includes(String(group.id));
                    return (
                      <label
                        key={group.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleGroupToggle(group.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{group.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Нет доступных групп</p>
              )}
            </div>
            {formData.group_ids?.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Выбрано групп: {formData.group_ids.length}
              </p>
            )}
            {groups && groups.length === 0 && (
              <p className="mt-1 text-xs text-red-600">Создайте группы в разделе "Группы"</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit(formData)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LessonsModal = ({ isOpen, onClose, course, lessons, onManageQuestions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Уроки курса: {course.name}
          </h3>
          <div className="flex gap-2">
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["№", "Название урока", "Описание", "Действия"].map((header) => (
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
              {lessons.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Уроки не найдены
                  </td>
                </tr>
              ) : (
                lessons.map((lesson, idx) => (
                  <tr key={lesson.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-left text-sm text-gray-900">
                      {lesson.title}
                    </td>
                    <td className="px-4 py-3 text-left text-sm text-gray-600">
                      {lesson.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-500 hover:text-green-600 transition-colors"
                          title="Управление вопросами"
                          onClick={() => onManageQuestions(lesson)}
                        >
                          <BookOpen className="w-4 h-4" />
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
  );
};

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
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
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
              После сохранения урока нажмите кнопку "Вопросы" в списке уроков для добавления вопросов. 
              Вы можете добавить любое количество вопросов (рекомендуется не менее 100).
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

const TeacherModal = ({ isOpen, onClose, onSubmit, initialData, groups, groupCourses, onGroupChange, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    selectedGroups: [], // Массив выбранных групп с предметами
    is_curator: "no",
  });
  const [allGroupCourses, setAllGroupCourses] = useState({}); // {groupId: [courses]}

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || "",
        email: initialData?.email || "",
        password: "",
        selectedGroups: [],
        is_curator: "no",
      });
      setAllGroupCourses({});
      
      // Загружаем текущие назначения при редактировании
      if (initialData?.id) {
        getTeacherAssignments({ teacher_id: initialData.id, size: 100 })
          .then((response) => {
            const assignments = response.data?.assignments || [];
            const groupsData = [];
            const coursesMap = {};
            
            assignments.forEach((assignment) => {
              const groupId = assignment.group?.id;
              if (groupId) {
                // Загружаем курсы для каждой группы
                getTeacherAssignments({ group_id: groupId, size: 100 })
                  .then((res) => {
                    const courses = res.data?.assignments?.map(a => ({
                      id: a.subject?.id,
                      name: a.subject?.name,
                      code: a.subject?.code || a.subject?.name?.substring(0, 4).toUpperCase() || "—",
                    })) || [];
                    setAllGroupCourses(prev => ({
                      ...prev,
                      [groupId]: [...new Map(courses.map(c => [c.id, c])).values()],
                    }));
                  })
                  .catch(console.error);
                
                groupsData.push({
                  group_id: String(groupId),
                  subject_id: assignment.subject?.id ? String(assignment.subject.id) : "",
                });
              }
            });
            
            setFormData((prev) => ({
              ...prev,
              selectedGroups: groupsData,
              is_curator: assignments.some(a => a.is_curator) ? "yes" : "no",
            }));
          })
          .catch((err) => {
            console.error("Failed to load assignments:", err);
          });
      }
    }
  }, [isOpen, initialData]);

  const handleAddGroup = () => {
    setFormData((prev) => ({
      ...prev,
      selectedGroups: [...prev.selectedGroups, { group_id: "", subject_id: "" }],
    }));
  };

  const handleRemoveGroup = (index) => {
    setFormData((prev) => ({
      ...prev,
      selectedGroups: prev.selectedGroups.filter((_, i) => i !== index),
    }));
  };

  const handleGroupSelect = async (index, groupId) => {
    const newGroups = [...formData.selectedGroups];
    newGroups[index] = { ...newGroups[index], group_id: groupId, subject_id: "" };
    setFormData((prev) => ({ ...prev, selectedGroups: newGroups }));
    
    // Загружаем курсы для выбранной группы
    if (groupId) {
      try {
        const assignmentsRes = await getTeacherAssignments({ group_id: groupId, size: 100 });
        const assignments = assignmentsRes.data?.assignments || [];
        const courses = assignments.map(a => ({
          id: a.subject?.id,
          name: a.subject?.name,
          code: a.subject?.code || a.subject?.name?.substring(0, 4).toUpperCase() || "—",
        }));
        setAllGroupCourses(prev => ({
          ...prev,
          [groupId]: [...new Map(courses.map(c => [c.id, c])).values()],
        }));
      } catch (error) {
        console.error("Failed to load group courses:", error);
      }
    }
  };

  const handleSubjectSelect = (index, subjectId) => {
    const newGroups = [...formData.selectedGroups];
    newGroups[index] = { ...newGroups[index], subject_id: subjectId };
    setFormData((prev) => ({ ...prev, selectedGroups: newGroups }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование преподавателя" : "Новый преподаватель"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя и фамилия *
            </label>
            <input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например, Иван Иванов"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@educode.com"
            />
          </div>
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль * (минимум 8 символов)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Минимум 8 символов"
              />
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Группы, в которых будет преподавать *
              </label>
              <button
                type="button"
                onClick={handleAddGroup}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Добавить группу
              </button>
            </div>
            {formData.selectedGroups.length === 0 && (
              <p className="text-sm text-gray-500 mb-2">
                Группы можно назначить позже. Нажмите "Добавить группу" чтобы выбрать группы для преподавания сейчас (необязательно).
              </p>
            )}
            {formData.selectedGroups.map((groupData, index) => (
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Группа {index + 1}</span>
                  {formData.selectedGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Группа *
                  </label>
                  <select
                    value={groupData.group_id}
                    onChange={(e) => handleGroupSelect(index, e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Выберите группу</option>
                    {groups
                      .filter(g => !formData.selectedGroups.some((sg, i) => i !== index && sg.group_id === String(g.id)))
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>
                {groupData.group_id && allGroupCourses[groupData.group_id] && allGroupCourses[groupData.group_id].length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Предмет (код предмета подберется автоматически) *
                    </label>
                    <select
                      value={groupData.subject_id}
                      onChange={(e) => handleSubjectSelect(index, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Выберите предмет</option>
                      {allGroupCourses[groupData.group_id].map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                    </select>
                    {groupData.subject_id && (
                      <p className="mt-1 text-xs text-gray-500">
                        Код предмета: {allGroupCourses[groupData.group_id].find(c => c.id === Number(groupData.subject_id))?.code || "—"}
                      </p>
                    )}
                  </div>
                )}
                {groupData.group_id && allGroupCourses[groupData.group_id] && allGroupCourses[groupData.group_id].length === 0 && (
                  <div className="text-sm text-gray-500">
                    Для выбранной группы нет доступных предметов. Сначала создайте курс и назначьте его группе.
                  </div>
                )}
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Куратор
            </label>
            <select
              value={formData.is_curator}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_curator: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="no">Нет</option>
              <option value="yes">Да</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit(formData, allGroupCourses)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Модальное окно для управления вопросами урока
const QuestionsModal = ({ isOpen, onClose, lesson, questions, onAddQuestion, onEditQuestion, onDeleteQuestion }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Вопросы урока: {lesson.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Всего вопросов: {questions.length} | Каждому студенту будет выдано случайных 10 вопросов
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAddQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить вопрос
            </button>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["№", "Вопрос", "Варианты ответов", "Правильный ответ", "Действия"].map((header) => (
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
              {questions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Вопросы не найдены. Добавьте первый вопрос.
                  </td>
                </tr>
              ) : (
                questions.map((question, idx) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-sm text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-left text-sm text-gray-900 max-w-xs">
                      {question.question_text || question.text || "—"}
                    </td>
                    <td className="px-4 py-3 text-left text-sm text-gray-600 max-w-md">
                      <div className="space-y-1">
                        {(question.options || []).map((option, optIdx) => (
                          <div key={optIdx} className="text-xs">
                            {String.fromCharCode(65 + optIdx)}. {option}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {String.fromCharCode(65 + (question.correct_answer_index || 0))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Редактировать"
                          onClick={() => onEditQuestion(question)}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                          title="Удалить"
                          onClick={() => onDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
  );
};

// Модальное окно для добавления/редактирования вопроса
const QuestionModal = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState({
    question_text: "",
    options: ["", ""],
    correct_answer_index: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          question_text: initialData.question_text || initialData.text || "",
          options: initialData.options || ["", ""],
          correct_answer_index: initialData.correct_answer_index !== undefined ? String(initialData.correct_answer_index) : "",
        });
      } else {
        setFormData({
          question_text: "",
          options: ["", ""],
          correct_answer_index: "",
        });
      }
      setError("");
    }
  }, [isOpen, initialData]);

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const handleRemoveOption = (index) => {
    if (formData.options.length <= 2) {
      setError("Минимум 2 варианта ответа");
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
      correct_answer_index: prev.correct_answer_index === String(index) ? "" : prev.correct_answer_index,
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = () => {
    setError("");
    
    if (!formData.question_text || !formData.question_text.trim()) {
      setError("Пожалуйста, введите текст вопроса");
      return;
    }

    const validOptions = formData.options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError("Добавьте минимум 2 варианта ответа");
      return;
    }

    if (!formData.correct_answer_index && formData.correct_answer_index !== "0") {
      setError("Выберите правильный ответ");
      return;
    }

    const correctIndex = Number(formData.correct_answer_index);
    if (correctIndex < 0 || correctIndex >= validOptions.length) {
      setError("Некорректный индекс правильного ответа");
      return;
    }

    onSubmit({
      question_text: formData.question_text.trim(),
      options: validOptions,
      correct_answer_index: correctIndex,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование вопроса" : "Новый вопрос"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст вопроса <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, question_text: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите текст вопроса..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Варианты ответов <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Добавить вариант
              </button>
            </div>
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Вариант ${index + 1}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="text-red-500 hover:text-red-700"
                    disabled={loading || formData.options.length <= 2}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Правильный ответ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.correct_answer_index}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, correct_answer_index: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Выберите правильный ответ</option>
              {formData.options.map((option, index) => (
                option.trim() && (
                  <option key={index} value={index}>
                    {String.fromCharCode(65 + index)}. {option}
                  </option>
                )
              ))}
            </select>
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

export default AdminDashboard;
