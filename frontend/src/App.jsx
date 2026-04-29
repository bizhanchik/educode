import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MyCourses from "./pages/MyCourses";

import Notifications from "./pages/Notifications";
import Journal from "./pages/Journal";
import JournalDetail from "./pages/JournalDetail";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TaskManagement from "./pages/TaskManagement";
import SubmitTask from "./pages/SubmitTask";
import TaskSubmissions from "./pages/TaskSubmissions";
import MyGrades from "./pages/MyGrades";
import LessonCreator from "./pages/LessonCreator";
import LessonAssignmentManager from "./pages/LessonAssignmentManager";
import LessonDetail from "./pages/LessonDetail";
import AuthModal from "./components/AuthModal";
import AnimatedBackground from "./components/AnimatedBackground";
import { LanguageProvider } from "./i18n.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { RoleProvider } from "./hooks/useRole.jsx";
import { useAuth } from "./hooks/useAuth.jsx";
import { getLandingPageForRole } from "./utils/navigation.js";

const ROUTE_RULES = {
  home: { isPublic: true },
  courses: { roles: ["student", "teacher", "admin"] },

  notifications: { roles: ["student", "admin"] },
  journal: { roles: ["student", "teacher"] },
  "journal-detail": { roles: ["student", "teacher"] },
  "teacher-dashboard": { roles: ["teacher"] },
  "admin-dashboard": { roles: ["admin"] },
  "student-dashboard": { roles: ["student"] },
  "task-management": { roles: ["teacher", "admin"] },
  "submit-task": { roles: ["student"] },
  "task-submissions": { roles: ["teacher", "admin"] },
  "my-grades": { roles: ["student"] },
  "lesson-creator": { roles: ["teacher"] },
  "lesson-assign": { roles: ["teacher"] },
  "lesson-detail": { roles: ["student", "teacher"] },
};

const AppContent = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'login' or 'signup'
  });

  const [currentPage, setCurrentPage] = useState("home");
  const [guardMessage, setGuardMessage] = useState("");
  const [pageParams, setPageParams] = useState({});
  const { user, isAuthenticated, loading } = useAuth();

  // Backend health check on app load (silent - only logs success)
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const headers = apiUrl.includes("ngrok") ? { "ngrok-skip-browser-warning": "1" } : {};
        const response = await fetch(`${apiUrl}/api/v1/health`, {
          signal: controller.signal,
          headers,
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log("[App] Backend is healthy:", data);
        }
      } catch (error) {
        // Silently handle connection errors - backend might not be running
        // Only log in development mode
        if (import.meta.env.DEV && error.name !== 'AbortError') {
          console.warn("[App] Backend health check: backend may be offline");
        }
      }
    };
    checkBackendHealth();
  }, []);

  // Debug: Log user role changes
  useEffect(() => {
    if (user) {
      console.log("[App] Current user role:", user.role, "User object:", user);
    } else {
      console.log("[App] No user logged in");
    }
  }, [user]);

  const handleOpenModal = useCallback((type) => {
    setModalState({
      isOpen: true,
      type,
    });
  }, []);

  const handleCloseModal = () => {
    setModalState({
      ...modalState,
      isOpen: false,
    });
    // Очищаем guardMessage при закрытии модального окна
    if (isAuthenticated) {
      setGuardMessage("");
    }
  };

  const handleSwitchModal = (type) => {
    setModalState({
      isOpen: true,
      type,
    });
  };

  const handlePageChange = useCallback(
    (page, params = {}) => {
      const routeRule = ROUTE_RULES[page] || ROUTE_RULES.home;
      const isPublic = !!routeRule?.isPublic;

      if (!isPublic && !isAuthenticated) {
        setGuardMessage(
          "Пожалуйста, войдите, чтобы получить доступ к этой странице."
        );
        handleOpenModal("login");
        return;
      }

      if (
        !isPublic &&
        routeRule?.roles &&
        user &&
        !routeRule.roles.includes(user.role)
      ) {
        setGuardMessage("У вас нет доступа к выбранной странице.");
        return;
      }

      setGuardMessage("");
      setPageParams(params || {});
      setCurrentPage(page);
    },
    [isAuthenticated, user, handleOpenModal]
  );

  // Очищаем guardMessage после успешного входа
  useEffect(() => {
    if (isAuthenticated && guardMessage) {
      setGuardMessage("");
    }
  }, [isAuthenticated, guardMessage]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const routeRule = ROUTE_RULES[currentPage];
      if (routeRule && !routeRule.isPublic) {
        setCurrentPage("home");
        setPageParams({});
      }
      return;
    }

    const routeRule = ROUTE_RULES[currentPage];
    if (!routeRule) {
      setCurrentPage(getLandingPageForRole(user.role));
      setPageParams({});
      return;
    }

    if (routeRule.roles && !routeRule.roles.includes(user.role)) {
      const landing = getLandingPageForRole(user.role);
      setCurrentPage(landing);
      setPageParams({});
    }
  }, [user, loading, currentPage]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "courses":
        return (
          <MyCourses onPageChange={handlePageChange} pageParams={pageParams} />
        );

      case "notifications":
        return <Notifications onPageChange={handlePageChange} />;
      case "journal":
        return <Journal onPageChange={handlePageChange} />;
      case "journal-detail":
        return (
          <JournalDetail
            onPageChange={handlePageChange}
            courseId={pageParams?.courseId || 1}
          />
        );
      case "teacher-dashboard":
        return <TeacherDashboard onPageChange={handlePageChange} />;
      case "admin-dashboard":
        return <AdminDashboard onPageChange={handlePageChange} />;
      case "student-dashboard":
        return <StudentDashboard onPageChange={handlePageChange} />;
      case "task-management":
        return (
          <TaskManagement
            onPageChange={handlePageChange}
            pageParams={pageParams}
          />
        );
      case "submit-task":
        return (
          <SubmitTask onPageChange={handlePageChange} pageParams={pageParams} />
        );
      case "task-submissions":
        return (
          <TaskSubmissions
            onPageChange={handlePageChange}
            pageParams={pageParams}
          />
        );
      case "my-grades":
        return <MyGrades onPageChange={handlePageChange} />;
      case "lesson-creator":
        return (
          <LessonCreator
            onPageChange={handlePageChange}
            pageParams={pageParams}
          />
        );
      case "lesson-assign":
        return (
          <LessonAssignmentManager
            onPageChange={handlePageChange}
            pageParams={pageParams}
          />
        );
      case "lesson-detail":
        return (
          <LessonDetail
            onPageChange={handlePageChange}
            lessonId={pageParams?.lessonId}
          />
        );
      default:
        return (
          <Home onOpenModal={handleOpenModal} onPageChange={handlePageChange} />
        );
    }
  };

  return (
    <div className="app min-h-screen relative">
      <AnimatedBackground />
      <Navbar
        onOpenModal={handleOpenModal}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      />
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Загрузка профиля...</p>
          </div>
        </div>
      ) : (
        <>
          {guardMessage && (
            <div
              className="max-w-3xl mx-auto mt-6 px-4 relative z-[60]"
              style={{ marginTop: "100px" }}
            >
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {guardMessage}
              </div>
            </div>
          )}
          {renderCurrentPage()}
        </>
      )}
      <AuthModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={handleCloseModal}
        onSwitchModal={handleSwitchModal}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
