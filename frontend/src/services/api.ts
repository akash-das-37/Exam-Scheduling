import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentToken = localStorage.getItem('token');
      // If user has a demo/offline session, do NOT clear session or redirect to login
      if (currentToken && currentToken.startsWith('token_')) {
        console.warn('Backend returned 401 for demo token - preserving local session');
        return Promise.reject(error);
      }

      // Do not redirect on auth endpoints (login/signup errors should show inline)
      const reqUrl = error.config?.url || '';
      if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register')) {
        return Promise.reject(error);
      }

      // Only redirect on genuine expired session if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
