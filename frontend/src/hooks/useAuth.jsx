import { useState, useEffect, createContext, useContext } from 'react';
import { 
  login as authLogin, 
  register as authRegister, 
  logout as authLogout, 
  getCurrentUser, 
  isAuthenticated,
  initDatabase 
} from '../utils/auth.js';

// Контекст аутентификации
const AuthContext = createContext();

// Провайдер аутентификации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Инициализация при загрузке
  useEffect(() => {
    initDatabase();
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  // Функция входа
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = authLogin(email, password);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Ошибка при входе в систему' };
    } finally {
      setLoading(false);
    }
  };

  // Функция регистрации
  const register = async (email, password, fullName) => {
    setLoading(true);
    try {
      const result = authRegister(email, password, fullName);
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Ошибка при регистрации' };
    } finally {
      setLoading(false);
    }
  };

  // Функция выхода
  const logout = () => {
    authLogout();
    setUser(null);
  };

  // Проверка авторизации
  const checkAuth = () => {
    return isAuthenticated();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
