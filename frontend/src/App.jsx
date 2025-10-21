import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyCourses from './pages/MyCourses';
import ProgrammingBasics from './pages/ProgrammingBasics';
import DatabaseBasics from './pages/DatabaseBasics';
import ICTBasics from './pages/ICTBasics';
import Lesson1 from './pages/Lesson1';
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
      case 'database-basics':
        return <DatabaseBasics onPageChange={handlePageChange} />;
      case 'ict-basics':
        return <ICTBasics onPageChange={handlePageChange} />;
      case 'lesson-1':
        return <Lesson1 onPageChange={handlePageChange} />;
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
          />
        </div>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
