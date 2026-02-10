import axios from 'axios';

// Get API URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get full URL for files (images, videos, etc.)
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  // Use the base URL from API_URL (removing /api)
  const baseUrl = API_URL.replace(/\/api$/, '');
  return `${baseUrl}/${cleanPath}`;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // FormData must be sent without Content-Type so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      config.headers = config.headers || {};
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token
      localStorage.removeItem('token');
      // Let the app handle the redirect based on context (e.g. AuthContext will catch this)
    }
    return Promise.reject(error);
  }
);

export default api;






