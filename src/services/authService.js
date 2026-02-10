import api from './api';

export const authService = {
  // Register client
  register: (data) => {
    return api.post('/auth/register', {
      ...data,
      userType: 'CLIENT'
    });
  },

  // Login (supports multiple user types)
  login: (email, password, rememberMe = false) => {
    return api.post('/auth/login', {
      email,
      password,
      rememberMe
    });
  },

  // Guest login
  guestLogin: () => {
    return api.post('/auth/guest');
  },

  // Get current user
  getMe: () => {
    return api.get('/auth/me');
  },

  // Update profile
  updateProfile: (data) => {
    return api.put('/auth/me', data);
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh-token', { refreshToken });
  },

  // Forgot password
  forgotPassword: (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: (token, password) => {
    return api.post('/auth/reset-password', { token, password });
  },

  // Verify email
  verifyEmail: (token) => {
    return api.post('/auth/verify-email', { token });
  },

  // Resend verification
  resendVerification: () => {
    return api.post('/auth/resend-verification');
  },

  // Store token in localStorage
  setToken: (token, refreshToken = null) => {
    localStorage.setItem('token', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Remove token from localStorage
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  },

  // Store user data
  setUser: (user, userType) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userType', userType);
  },

  // Get user data
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Get user type
  getUserType: () => {
    return localStorage.getItem('userType');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};









