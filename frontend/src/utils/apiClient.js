// Upgrade http:// → https:// automatically when the page itself is served over HTTPS.
// This prevents "Mixed Content" browser blocks when the backend URL is accidentally
// configured with http:// while the frontend is deployed on a TLS host (e.g. Vercel).
const _upgradeToHttpsIfNeeded = (url) => {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Get API URL from environment variable, fallback to localhost:8000 for local dev
const API_BASE_URL = _upgradeToHttpsIfNeeded(
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/v1`
    : 'http://localhost:8000/api/v1'
);

/** Base API URL without /api/v1 (for error messages, health checks, etc.) */
export const getApiBaseUrl = () =>
  _upgradeToHttpsIfNeeded(
    import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:8000'
  );

export const ACCESS_TOKEN_KEY = 'educode_access_token';
export const ACCESS_TOKEN_EXP_KEY = 'educode_access_token_expires_at';
export const USER_STORAGE_KEY = 'educode_user';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error('Cannot read token from storage', error);
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Cannot persist token', error);
  }
};

export const setTokenExpiration = (expiresAt) => {
  try {
    if (expiresAt) {
      localStorage.setItem(ACCESS_TOKEN_EXP_KEY, String(expiresAt));
    } else {
      localStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
    }
  } catch (error) {
    console.error('Cannot persist token expiration', error);
  }
};

export const getTokenExpiration = () => {
  try {
    const raw = localStorage.getItem(ACCESS_TOKEN_EXP_KEY);
    return raw ? Number(raw) : null;
  } catch (error) {
    console.error('Cannot read token expiration', error);
    return null;
  }
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_EXP_KEY);
  } catch (error) {
    console.error('Cannot remove token', error);
  }
};

export const clearStoredUser = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Cannot remove user from storage', error);
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Cannot parse stored user', error);
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Cannot persist user', error);
  }
};

/** Fetch with auth and 401 handling, returns raw Response. Use for blob/download responses. */
export const fetchWithAuth = async (endpoint, options = {}) => {
  const { method = 'GET', headers = {}, token, skipAuth = false } = options;
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const requestHeaders = {
    ...(apiUrl.includes('ngrok') ? { 'ngrok-skip-browser-warning': '1' } : {}),
    ...headers,
  };
  const authToken = token ?? (skipAuth ? null : getStoredToken());
  if (authToken) requestHeaders.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    credentials: 'omit',
  });

  if (response.status === 401 && !skipAuth) {
    clearStoredToken();
    clearStoredUser();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        setTimeout(() => { window.location.href = '/'; }, 100);
      }
    }
    const err = new Error('Сессия истекла. Пожалуйста, войдите снова.');
    err.status = 401;
    throw err;
  }
  return response;
};

export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    token,
    skipAuth = false
  } = options;

  const payloadIsFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const requestHeaders = {
    ...(payloadIsFormData ? {} : { 'Content-Type': 'application/json' }),
    // Skip ngrok interstitial page on free tier - required when API is behind ngrok
    ...(apiUrl.includes('ngrok') ? { 'ngrok-skip-browser-warning': '1' } : {}),
    ...headers,
  };

  const authToken = token ?? (skipAuth ? null : getStoredToken());
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body === undefined || payloadIsFormData ? body : JSON.stringify(body),
      credentials: 'omit', // JWT in Authorization header - no cookies needed. Avoids CORS * conflict.
    });
  } catch (networkError) {
    // Обработка сетевых ошибок (CORS, нет соединения и т.д.)
    if (networkError.name === 'TypeError' && networkError.message.includes('fetch')) {
      // Проверяем, является ли это CORS ошибкой
      const isCorsError = networkError.message.includes('CORS') || 
                          networkError.message.includes('Access-Control') ||
                          networkError.message.includes('blocked by CORS');
      
      let errorMessage;
      if (isCorsError) {
        errorMessage = 'Ошибка CORS: Backend не настроен для работы с фронтендом. Проверьте настройки CORS на backend.';
      } else {
        const apiUrl = getApiBaseUrl();
        errorMessage = `Не удалось подключиться к API. Проверьте, что backend запущен (${apiUrl})`;
      }
      
      const corsError = new Error(errorMessage);
      corsError.status = 0;
      corsError.isNetworkError = true;
      corsError.isCorsError = isCorsError;
      throw corsError;
    }
    throw networkError;
  }

  // Handle 401 Unauthorized - logout user gracefully
  if (response.status === 401 && !skipAuth) {
    clearStoredToken();
    clearStoredUser();
    // Dispatch a custom event that useAuth can listen to, or redirect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Redirect to home (SPA has no /login page - auth is via modal on home)
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
    const error = new Error('Сессия истекла. Пожалуйста, войдите снова.');
    error.status = 401;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  
  let data;
  if (isJson) {
    data = await response.json();
  } else {
    const responseText = await response.text();
    // Try to parse as JSON even if content-type doesn't indicate JSON
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    // Handle validation errors (422) and conflict errors (409)
    let message = 'Не удалось выполнить запрос';
    if (isJson || (typeof data === 'object' && data !== null)) {
      // Handle validation errors with detail array
      if (data?.detail && Array.isArray(data.detail)) {
        message = data.detail.map(err => {
          if (typeof err === 'string') return err;
          return `${err.loc?.join('.') || 'field'}: ${err.msg || err.message || 'validation error'}`;
        }).join('; ');
      } else {
        message = data?.detail || data?.message || data?.error || message;
      }
    } else if (typeof data === 'string') {
      message = data;
    }
    
    // Для ошибки 500 добавляем больше информации
    if (response.status === 500) {
      const serverError = message || 'Внутренняя ошибка сервера';
      if (import.meta.env.DEV) {
        console.error('[API] Server error (500) details:', {
          endpoint,
          method,
          payloadIsFormData,
          responseData: data,
          fullError: serverError
        });
      }
      message = `Ошибка сервера: ${serverError}. Проверьте логи backend или обратитесь к администратору.`;
    }
    
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export default apiRequest;
