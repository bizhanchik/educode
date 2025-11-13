const API_BASE_URL = 'http://localhost:8000/api/v1';
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

export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    token,
    skipAuth = false
  } = options;

  const payloadIsFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders = {
    ...(payloadIsFormData ? {} : { 'Content-Type': 'application/json' }),
    ...headers,
  };

  const authToken = token ?? (skipAuth ? null : getStoredToken());
  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body === undefined || payloadIsFormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson
      ? data?.detail || data?.message || data?.error || 'Не удалось выполнить запрос'
      : data || 'Не удалось выполнить запрос';
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export default apiRequest;
