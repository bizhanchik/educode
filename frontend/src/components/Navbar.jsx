import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getLandingPageForRole } from '../utils/navigation.js';

const Navbar = ({ onOpenModal, onPageChange, currentPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();
  
  // Безопасное получение useAuth
  let isAuthenticated = false;
  let user = null;
  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
    user = authContext.user;
  } catch (error) {
    console.warn('Navbar: useAuth not available', error);
  }

  const handleDashboardNavigate = () => {
    if (!user) return;
    const landing = getLandingPageForRole(user.role);
    if (landing) {
      onPageChange?.(landing);
    }
  };
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);


  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-xl bg-gradient-to-b from-white/70 to-white/40 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-b border-white/30 h-16' 
          : 'backdrop-blur-md bg-gradient-to-b from-white/70 to-white/40 border-b border-white/30 h-20'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo и навигация */}
          <div className="flex items-center space-x-8">
            <motion.div 
              className="flex-shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
                     <motion.button 
                       onClick={() => onPageChange && onPageChange('home')}
                       className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                     >
                       <span className="text-2xl font-bold text-gray-900">
                         EduCode<span className="bg-clip-text text-transparent bg-gradient-to-r from-[#22C55E] to-[#3B82F6]">.</span>
                       </span>
                     </motion.button>
            </motion.div>
            
            {/* Навигационные ссылки */}
            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => {
                  if (currentPage === 'home') {
                    // Прокручиваем к секции "О проекте"
                    const aboutSection = document.getElementById('about');
                    if (aboutSection) {
                      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } else {
                    onPageChange?.('home');
                    // Ждем немного и прокручиваем
                    setTimeout(() => {
                      const aboutSection = document.getElementById('about');
                      if (aboutSection) {
                        aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hover:opacity-80"
              >
                {t('navbar.about')}
              </button>
              <button
                onClick={() => {
                  if (currentPage === 'home') {
                    // Прокручиваем к футеру "Важно"
                    const contactsSection = document.getElementById('contacts');
                    if (contactsSection) {
                      contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  } else {
                    onPageChange?.('home');
                    // Ждем немного и прокручиваем
                    setTimeout(() => {
                      const contactsSection = document.getElementById('contacts');
                      if (contactsSection) {
                        contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors hover:opacity-80"
              >
                {t('navbar.contacts')}
              </button>
            </div>
          </div>
          
          {/* Auth Buttons and Language Switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
                   {isAuthenticated ? (
                     <>
                       <motion.button
                         onClick={handleDashboardNavigate}
                         className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                         whileHover={{ scale: 1.03 }}
                         whileTap={{ scale: 0.98 }}
                       >
                         {user?.role === 'admin' ? 'Админ-панель' : user?.role === 'teacher' ? 'Кабинет преподавателя' : 'Мои курсы'}
                       </motion.button>
                       <UserMenu onPageChange={onPageChange} />
                     </>
                   ) : (
              <>
                <motion.button 
                  className="px-3 sm:px-4 py-2 rounded-xl border border-gray-300 bg-white/40 backdrop-blur-md text-gray-700 hover:bg-white/70 transition-all duration-300 text-sm sm:text-base"
                  onClick={() => onOpenModal('login')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('navbar.signin')}
                </motion.button>
                <motion.button
                  className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                  onClick={() => onOpenModal('signup')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="hidden sm:inline">{t('navbar.signup')}</span>
                  <span className="sm:hidden">{t('navbar.signupMobile')}</span>
                </motion.button>
              </>
            )}
          </div>
          
        </div>
      </div>
      
    </motion.nav>
  );
};

// NavLink component for desktop navigation
const NavLink = ({ href, children, active }) => {
  return (
    <motion.a
      href={href}
      className={`relative px-1 py-2 text-sm font-medium ${
        active ? 'text-primary' : 'text-dark-text hover:text-primary'
      } transition-colors`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {active && (
        <motion.span
          className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"
          layoutId="underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.a>
  );
};

// MobileNavLink component for mobile navigation
const MobileNavLink = ({ href, children, active }) => {
  return (
    <motion.a
      href={href}
      className={`block px-3 py-2 rounded-lg text-base font-medium ${
        active 
          ? 'text-primary bg-primary/5' 
          : 'text-dark-text hover:bg-light-surface'
      } transition-colors`}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  );
};

export default Navbar;
