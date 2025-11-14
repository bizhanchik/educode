import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyCourses from './pages/MyCourses';
import ProgrammingBasics from './pages/ProgrammingBasics';
import Lesson1 from './pages/Lesson1';
import Lesson2 from './pages/Lesson2';
import DatabaseLesson1 from './pages/DatabaseLesson1';
import ICTLesson1 from './pages/ICTLesson1';
import Notifications from './pages/Notifications';
import Journal from './pages/Journal';
import JournalDetail from './pages/JournalDetail';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuthModal from './components/AuthModal';
import AnimatedBackground from './components/AnimatedBackground';
import { LanguageProvider } from './i18n.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import { useAuth } from './hooks/useAuth.jsx';
import { getLandingPageForRole } from './utils/navigation.js';

const ROUTE_RULES = {
  home: { isPublic: true },
  courses: { roles: ['student', 'teacher', 'admin'] },
  'programming-basics': { roles: ['student', 'teacher', 'admin'] },
  'lesson-1': { roles: ['student', 'teacher'] },
  'lesson-2': { roles: ['student', 'teacher'] },
  'database-lesson-1': { roles: ['student', 'teacher'] },
  'ict-lesson-1': { roles: ['student', 'teacher'] },
  notifications: { roles: ['student', 'teacher', 'admin'] },
  journal: { roles: ['student', 'teacher', 'admin'] },
  'journal-detail': { roles: ['student', 'teacher', 'admin'] },
  'teacher-dashboard': { roles: ['teacher'] },
  'admin-dashboard': { roles: ['admin'] }
};

const AppContent = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'login' or 'signup'
  });

  const [currentPage, setCurrentPage] = useState('home');
  const [guardMessage, setGuardMessage] = useState('');
  const [pageParams, setPageParams] = useState({});
  const { user, isAuthenticated, loading } = useAuth();

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
  };

  const handleSwitchModal = (type) => {
    setModalState({
      isOpen: true,
      type,
    });
  };

  const handlePageChange = useCallback((page, params = {}) => {
    const routeRule = ROUTE_RULES[page] || ROUTE_RULES.home;
    const isPublic = !!routeRule?.isPublic;

    if (!isPublic && !isAuthenticated) {
      setGuardMessage('Пожалуйста, войдите, чтобы получить доступ к этой странице.');
      handleOpenModal('login');
      return;
    }

    if (!isPublic && routeRule?.roles && user && !routeRule.roles.includes(user.role)) {
      setGuardMessage('У вас нет доступа к выбранной странице.');
      return;
    }

    setGuardMessage('');
    setPageParams(params || {});
    setCurrentPage(page);
  }, [isAuthenticated, user, handleOpenModal]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const routeRule = ROUTE_RULES[currentPage];
      if (routeRule && !routeRule.isPublic) {
        setCurrentPage('home');
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
      case 'courses':
        return <MyCourses onPageChange={handlePageChange} pageParams={pageParams} />;
      case 'programming-basics':
        return <ProgrammingBasics onPageChange={handlePageChange} pageParams={pageParams} />;
      case 'lesson-1':
        return <Lesson1 onPageChange={handlePageChange} />;
      case 'lesson-2':
        return <Lesson2 onPageChange={handlePageChange} />;
      case 'database-lesson-1':
        return <DatabaseLesson1 onPageChange={handlePageChange} />;
      case 'ict-lesson-1':
        return <ICTLesson1 onPageChange={handlePageChange} />;
      case 'notifications':
        return <Notifications onPageChange={handlePageChange} />;
      case 'journal':
        return <Journal onPageChange={handlePageChange} />;
      case 'journal-detail':
        return <JournalDetail onPageChange={handlePageChange} courseId={1} />;
      case 'teacher-dashboard':
        return <TeacherDashboard onPageChange={handlePageChange} />;
      case 'admin-dashboard':
        return <AdminDashboard onPageChange={handlePageChange} />;
      default:
        return <Home onOpenModal={handleOpenModal} onPageChange={handlePageChange} />;
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
            <div className="max-w-3xl mx-auto mt-6 px-4">
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
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
