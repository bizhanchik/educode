import React, { useState } from 'react';
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

function App() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'login' or 'signup'
  });

  const [currentPage, setCurrentPage] = useState('home');

  const handleOpenModal = (type) => {
    setModalState({
      isOpen: true,
      type,
    });
  };

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'courses':
        return <MyCourses onPageChange={handlePageChange} />;
      case 'programming-basics':
        return <ProgrammingBasics onPageChange={handlePageChange} />;
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
    <LanguageProvider>
      <AuthProvider>
        <div className="app min-h-screen relative">
          <AnimatedBackground />
          <Navbar onOpenModal={handleOpenModal} onPageChange={handlePageChange} />
          {renderCurrentPage()}
          <AuthModal 
            isOpen={modalState.isOpen}
            type={modalState.type}
            onClose={handleCloseModal}
            onSwitchModal={handleSwitchModal}
            onPageChange={handlePageChange}
          />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;