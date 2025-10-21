import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Eye, User, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n.jsx';
import { useAuth } from '../hooks/useAuth.jsx';

const TypewriterText = ({ text, delay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80 + delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className="inline-block">
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          className="inline-block w-0.5 h-6 bg-gray-600 ml-1"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
};

const AuthModal = ({ isOpen, onClose, type, onSwitchModal }) => {
  const modalRef = useRef(null);
  const { t } = useLanguage();
  
  // Безопасное получение useAuth
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (error) {
    console.warn('AuthModal: useAuth not available', error);
  }
  
  const { login, register, loading } = authContext || { login: null, register: null, loading: false };
  const [mode, setMode] = useState(type === 'login' ? 'login' : 'register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  
  // Состояние формы
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Block page scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }, [isOpen]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Update mode when type changes
  useEffect(() => {
    setMode(type === 'login' ? 'login' : 'register');
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      fullName: '',
      confirmPassword: ''
    });
  }, [type]);

  // Обработка изменения полей формы
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    
    if (field === 'password') {
      setPassword(value);
      validatePassword(value);
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!login || !register) {
      setError('Система аутентификации недоступна');
      return;
    }

    if (mode === 'login') {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setSuccess('Успешный вход в систему!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error);
      }
    } else {
      // Регистрация
      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают');
        return;
      }
      
      const result = await register(formData.email, formData.password, formData.fullName);
      if (result.success) {
        setSuccess('Регистрация успешна! Добро пожаловать!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error);
      }
    }
  };

  const validatePassword = (pwd) => {
    if (pwd.length === 0) {
      setPasswordStrength('');
      setPasswordMessage('');
      return;
    }

    let strength = 0;
    let message = '';

    if (pwd.length < 6) {
      message = 'Пароль слишком короткий (минимум 6 символов)';
      setPasswordStrength('weak');
    } else if (pwd.length >= 6 && pwd.length < 8) {
      strength++;
    } else if (pwd.length >= 8) {
      strength++;
    }

    if (/[a-zA-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength < 2) {
      message = 'Слабый пароль. Добавьте цифры и символы';
      setPasswordStrength('weak');
    } else if (strength < 3) {
      message = 'Средний пароль. Добавьте специальные символы';
      setPasswordStrength('medium');
    } else {
      message = 'Надежный пароль';
      setPasswordStrength('strong');
    }

    setPasswordMessage(message);
  };

  const toggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    onSwitchModal(newMode === 'login' ? 'login' : 'signup');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop with blur effect */}
          <motion.div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal container with glassmorphism */}
          <motion.div
            ref={modalRef}
            className="relative bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md mx-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close button */}
            <motion.button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onClose}
              whileHover={{ rotate: 90 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            
                {/* Title with typewriter effect */}
            <motion.h2 
              className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TypewriterText 
                key={mode}
                text={mode === 'login' ? t('modal.loginWelcome') : t('modal.registerWelcome')} 
                delay={0}
              />
            </motion.h2>

                   {/* Сообщения об ошибках и успехе */}
                   {error && (
                     <motion.div
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"
                     >
                       <AlertCircle className="w-5 h-5" />
                       {error}
                     </motion.div>
                   )}
                   
                   {success && (
                     <motion.div
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2"
                     >
                       <CheckCircle className="w-5 h-5" />
                       {success}
                     </motion.div>
                   )}

                   {/* Form */}
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.2 }}
                   >
                     <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name field (only for register) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modal.fullName')}
                    </label>
                    <div className="relative">
                           <input
                             type="text"
                             placeholder={t('modal.fullName')}
                             value={formData.fullName}
                             onChange={(e) => handleInputChange('fullName', e.target.value)}
                             className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                             required
                           />
                      <User className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )}

                {/* Email field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modal.email')}
                  </label>
                  <div className="relative">
                           <input
                             type="email"
                             placeholder="square.one@gmail.com"
                             value={formData.email}
                             onChange={(e) => handleInputChange('email', e.target.value)}
                             className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                             required
                           />
                    <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modal.password')}
                  </label>
                  <div className="relative">
                           <input
                             type={showPassword ? "text" : "password"}
                             placeholder="••••••••••••"
                             value={formData.password}
                             onChange={(e) => handleInputChange('password', e.target.value)}
                             onCopy={(e) => e.preventDefault()}
                             onPaste={(e) => e.preventDefault()}
                             onCut={(e) => e.preventDefault()}
                             className={`w-full px-4 py-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                               passwordStrength === 'weak' ? 'border-red-500 focus:ring-red-500' :
                               passwordStrength === 'medium' ? 'border-yellow-500 focus:ring-yellow-500' :
                               passwordStrength === 'strong' ? 'border-green-500 focus:ring-green-500' :
                               'border-gray-300 focus:ring-blue-500'
                             }`}
                             required
                           />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                  {passwordMessage && (
                    <p className={`text-sm mt-1 ${
                      passwordStrength === 'weak' ? 'text-red-500' :
                      passwordStrength === 'medium' ? 'text-yellow-500' :
                      passwordStrength === 'strong' ? 'text-green-500' :
                      'text-gray-500'
                    }`}>
                      {passwordMessage}
                    </p>
                  )}
                </div>

                {/* Confirm Password field (only for register) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modal.confirmPassword')}
                    </label>
                    <div className="relative">
                           <input
                             type={showConfirmPassword ? "text" : "password"}
                             placeholder="••••••••••••"
                             value={formData.confirmPassword}
                             onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                             onCopy={(e) => e.preventDefault()}
                             onPaste={(e) => e.preventDefault()}
                             onCut={(e) => e.preventDefault()}
                             className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                             required
                           />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot password link (only for login) */}
                {mode === 'login' && (
                  <div className="flex justify-end items-center text-sm">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t('modal.forgotPassword')}
                    </button>
                  </div>
                )}

                       {/* Main action button */}
                       <motion.button
                         type="submit"
                         disabled={loading}
                         className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                           loading 
                             ? 'bg-gray-400 cursor-not-allowed' 
                             : 'bg-black hover:bg-gray-800'
                         } text-white`}
                         whileHover={!loading ? { scale: 1.02 } : {}}
                         whileTap={!loading ? { scale: 0.98 } : {}}
                       >
                         {loading ? 'Загрузка...' : (mode === 'login' ? t('modal.login') : t('modal.register'))}
                       </motion.button>
              </form>
              
              {/* Switch mode section */}
              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  type="button"
                  onClick={toggleMode}
                  className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {mode === 'login' ? t('modal.noAccount') : t('modal.haveAccount')}
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;