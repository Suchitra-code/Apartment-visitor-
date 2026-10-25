import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
    : '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apartmenthub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 unauthorized to automatically log out
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('apartmenthub_token');
        localStorage.removeItem('apartmenthub_user');
      }
    }
    return Promise.reject(error.response?.data || error.message || 'Network error');
  }
);

export default api;
