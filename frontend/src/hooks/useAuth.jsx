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
  // Preserve the role from backend - only default to 'student' if role is truly missing
  // Backend returns role as string: 'admin', 'teacher', or 'student'
  const userRole = rawUser.role || 'student';
  
  // Log for debugging
  if (rawUser.role) {
    console.log('[Auth] Normalizing user with role:', rawUser.role);
  } else {
    console.warn('[Auth] User object missing role field, defaulting to student:', rawUser);
  }
  
  return {
    ...rawUser,
    fullName,
    name: rawUser.name || fullName,
    role: userRole, // Use the role from backend, or 'student' as fallback
    teacherId: rawUser.teacherId || rawUser.teacher_id || (userRole === 'teacher' ? `teacher_${rawUser.id}` : undefined)
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
      // Use the provided token, or get from storage if not provided
      const authToken = token || getStoredToken();
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      try {
        // Call /auth/me endpoint with the token
        // Use skipAuth: true and pass token manually to ensure we use the correct token
        const profile = await apiRequest('/auth/me', { 
          token: authToken,
          skipAuth: true
        });
        
        console.log('[Auth] Fetched user profile from /auth/me:', profile);
        
        // Validate that profile has required fields
        if (!profile || typeof profile !== 'object') {
          throw new Error('Invalid user profile received from server - expected object but got: ' + typeof profile);
        }
        
        if (!profile.id) {
          throw new Error('Invalid user profile received from server - missing user ID');
        }
        
        // Validate role is present
        if (!profile.role) {
          console.error('[Auth] WARNING: User profile missing role field!', profile);
          throw new Error('User profile missing role information');
        }
        
        const normalized = normalizeUser(profile);
        console.log('[Auth] Normalized user with role:', normalized.role);
        
        // Always update state and storage with fresh data from API
        // This ensures we always have the correct role
        setUser(normalized);
        setStoredUser(normalized);
        
        return normalized;
      } catch (error) {
        // Only log non-network errors as errors
        // Network errors (backend offline) are expected and handled gracefully
        const isNetworkError = error?.message?.includes('Failed to fetch') || 
                              error?.message?.includes('ERR_CONNECTION') ||
                              error?.name === 'TypeError';
        if (isNetworkError) {
          // Silently handle network errors - backend might be offline
          if (import.meta.env.DEV) {
            console.warn('[Auth] Backend unavailable, using cached user if available');
          }
        } else {
          console.error('[Auth] Error fetching user profile:', error);
        }
        throw error;
      }
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
    // Cleanup legacy localStorage keys from old mock data system
    const migrateLocalStorage = () => {
      try {
        const migrationKey = 'educode_migration_v1_complete';
        if (localStorage.getItem(migrationKey)) return;

        const legacyKeys = [
          'educode_users', 'educode_courses', 'educode_progress',
          'educode_grades', 'educode_notifications', 'educode_submissions',
          'educode_journal', 'educode_current_user', 'user',
          'userProgress', 'practiceSubmissions', 'lessonProgress', 'courseProgress'
        ];

        legacyKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`[Auth] Removed legacy key: ${key}`);
          }
        });

        // Remove dynamic keys like lessonProgress:userId
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('lessonProgress:')) {
            localStorage.removeItem(key);
            console.log(`[Auth] Removed dynamic legacy key: ${key}`);
          }
        });

        localStorage.setItem(migrationKey, 'true');
        console.log('[Auth] ✓ localStorage migration complete');
      } catch (error) {
        console.error('[Auth] Error during localStorage migration:', error);
      }
    };

    migrateLocalStorage();
    initDatabase();
    const initializeAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        clearAuthState();
        setLoading(false);
        return;
      }

      // Don't set cached user immediately - always fetch fresh data from API first
      // This ensures we always have the correct role from the backend
      const cachedUser = getStoredUser();
      if (cachedUser) {
        console.log('[Auth] Found cached user, but fetching fresh data from API:', cachedUser);
      }

      try {
        // Always fetch fresh user data from /auth/me endpoint
        // This ensures we always have the correct role from the backend
        const freshUser = await fetchCurrentUser(token);
        console.log('[Auth] Fresh user data fetched from API with role:', freshUser?.role);
        
        // Verify role matches cached user (if exists) - this is just for logging/debugging
        if (cachedUser && cachedUser.role && freshUser && freshUser.role) {
          if (cachedUser.role !== freshUser.role) {
            console.warn('[Auth] ⚠️ Role mismatch detected on reload!');
            console.warn('[Auth] Cached role:', cachedUser.role, '→ Fresh role:', freshUser.role);
            console.warn('[Auth] Using fresh role from API (correct).');
          } else {
            console.log('[Auth] ✓ Role matches cached user:', freshUser.role);
          }
        }
        
        // fetchCurrentUser already sets user and storedUser, so we're done here
      } catch (error) {
        // Check if it's a network error (backend offline)
        const isNetworkError = error?.message?.includes('Failed to fetch') || 
                              error?.message?.includes('ERR_CONNECTION') ||
                              error?.name === 'TypeError';
        
        if (error?.status === 401) {
          clearAuthState();
        } else {
          // If API call fails but we have a cached user, use it as fallback
          if (cachedUser) {
            // Only log in dev mode for network errors
            if (isNetworkError) {
              if (import.meta.env.DEV) {
                console.warn('[Auth] Backend unavailable, using cached user');
              }
            } else {
              console.warn('[Auth] API call failed, using cached user as fallback:', cachedUser);
            }
            setUser(cachedUser);
          } else {
            // Only log non-network errors
            if (!isNetworkError) {
              console.warn('Не удалось обновить профиль пользователя', error);
            }
            clearAuthState();
          }
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

      console.log('[Auth] Login response:', authData);
      console.log('[Auth] Role from login response:', authData.role);

      setStoredToken(authData.access_token);
      if (authData.expires_in) {
        const expiresAt = Date.now() + authData.expires_in * 1000;
        persistTokenExpiration(expiresAt);
        setTokenExpiry(expiresAt);
      } else {
        persistTokenExpiration(null);
        setTokenExpiry(null);
      }
      
      // Fetch full user profile
      const profile = await fetchCurrentUser(authData.access_token);
      
      // Ensure role is set - use role from login response if profile doesn't have it
      if (profile) {
        if (!profile.role && authData.role) {
          console.log('[Auth] Profile missing role, using role from login response:', authData.role);
          profile.role = authData.role;
        } else if (profile.role && authData.role && profile.role !== authData.role) {
          // Role mismatch - use the role from login response (more authoritative)
          console.warn('[Auth] Role mismatch detected! Profile role:', profile.role, 'Login role:', authData.role);
          console.warn('[Auth] Using role from login response:', authData.role);
          profile.role = authData.role;
        }
        setUser(profile);
        setStoredUser(profile);
      }
      
      console.log('[Auth] Login successful, final user role:', profile?.role);
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
