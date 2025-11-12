import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { initDatabase } from '../utils/auth.js';
import apiRequest, {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser,
  getTokenExpiration,
  setTokenExpiration as persistTokenExpiration
} from '../utils/apiClient.js';

// Контекст аутентификации
const AuthContext = createContext();

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  const fullName = rawUser.fullName || rawUser.name || '';
  return {
    ...rawUser,
    fullName,
    name: rawUser.name || fullName,
    role: rawUser.role || 'student',
    teacherId: rawUser.teacherId || rawUser.teacher_id || (rawUser.role === 'teacher' ? `teacher_${rawUser.id}` : undefined)
  };
};

// Провайдер аутентификации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(() => getTokenExpiration());
  const tokenExpiryTimeoutRef = useRef(null);

  const clearAuthState = useCallback(() => {
    clearStoredToken();
    persistTokenExpiration(null);
    setTokenExpiry(null);
    setStoredUser(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(
    async (token) => {
      const profile = await apiRequest('/auth/me', { token, skipAuth: true });
      const normalized = normalizeUser(profile);
      setUser(normalized);
      setStoredUser(normalized);
      return normalized;
    },
    []
  );

  const scheduleTokenExpirationCheck = useCallback(() => {
    if (tokenExpiryTimeoutRef.current) {
      clearTimeout(tokenExpiryTimeoutRef.current);
    }
    if (!tokenExpiry) return;

    const timeoutMs = tokenExpiry - Date.now();
    if (timeoutMs <= 0) {
      clearAuthState();
      return;
    }

    tokenExpiryTimeoutRef.current = setTimeout(() => {
      clearAuthState();
    }, timeoutMs);
  }, [tokenExpiry, clearAuthState]);

  // Инициализация при загрузке
  useEffect(() => {
    initDatabase();
    const initializeAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        clearAuthState();
        setLoading(false);
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        await fetchCurrentUser(token);
      } catch (error) {
        console.warn('Не удалось обновить профиль пользователя', error);
        if (error?.status === 401) {
          clearAuthState();
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [fetchCurrentUser, clearAuthState]);

  useEffect(() => {
    scheduleTokenExpirationCheck();
    return () => {
      if (tokenExpiryTimeoutRef.current) {
        clearTimeout(tokenExpiryTimeoutRef.current);
      }
    };
  }, [scheduleTokenExpirationCheck]);

  // Функция входа
  const login = async (email, password) => {
    setLoading(true);
    try {
      const authData = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true
      });

      setStoredToken(authData.access_token);
      if (authData.expires_in) {
        const expiresAt = Date.now() + authData.expires_in * 1000;
        persistTokenExpiration(expiresAt);
        setTokenExpiry(expiresAt);
      } else {
        persistTokenExpiration(null);
        setTokenExpiry(null);
      }
      const profile = await fetchCurrentUser(authData.access_token);
      return { success: true, user: profile };
    } catch (error) {
      clearAuthState();
      return { success: false, error: error.message || 'Ошибка при входе в систему' };
    } finally {
      setLoading(false);
    }
  };

  // Функция регистрации
  const register = async () => {
    return {
      success: false,
      error: 'Регистрация новых пользователей доступна только через администратора.'
    };
  };

  // Функция выхода
  const logout = () => {
    clearAuthState();
  };

  // Проверка авторизации
  const checkAuth = () => {
    const token = getStoredToken();
    if (!token) return false;
    if (!tokenExpiry) return true;
    return tokenExpiry > Date.now();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user && checkAuth(),
    tokenExpiry
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
