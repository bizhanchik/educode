import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from './LanguageSwitcher';
import UserMenu from './UserMenu';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const Navbar = ({ onOpenModal, onPageChange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  
  // Безопасное получение useAuth
  let isAuthenticated = false;
  try {
    const authContext = useAuth();
    isAuthenticated = authContext.isAuthenticated;
  } catch (error) {
    console.warn('Navbar: useAuth not available', error);
  }
  
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
              <a href="#about" className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors hover:opacity-80">
                {t('navbar.about')}
              </a>
              <a href="#contacts" className="text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors hover:opacity-80">
                {t('navbar.contacts')}
              </a>
            </div>
          </div>
          
          {/* Auth Buttons and Language Switcher */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
                   {isAuthenticated ? (
                     <UserMenu onPageChange={onPageChange} />
                   ) : (
              <>
                <motion.button 
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white/40 backdrop-blur-md text-gray-700 hover:bg-white/70 transition-all duration-300"
                  onClick={() => onOpenModal('login')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('navbar.signin')}
                </motion.button>
                <motion.button
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={() => onOpenModal('signup')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('navbar.signup')}
                </motion.button>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-dark-text p-2 rounded-lg bg-white/10 backdrop-blur-sm"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-glass-white backdrop-blur-lg border-t border-light-border"
          >
            <div className="px-4 py-5 space-y-3">
              <MobileNavLink href="#about">{t('navbar.about')}</MobileNavLink>
              <MobileNavLink href="#contacts">{t('navbar.contacts')}</MobileNavLink>
              
              <div className="pt-4 flex flex-col gap-3">
                <motion.button
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/40 backdrop-blur-md text-gray-700 hover:bg-white/70 transition-all duration-300"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenModal('login');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('navbar.signin')}
                </motion.button>
                    <motion.button
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenModal('signup');
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t('navbar.signup')}
                    </motion.button>
                <div className="pt-2">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
           </motion.div>
         )}
       </AnimatePresence>
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