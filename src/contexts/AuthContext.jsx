import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    console.log("AuthContext: Mounting - Starting loadUser");
    const loadUser = async () => {
      try {
        const token = authService.getToken();
        const storedUser = authService.getUser();
        const storedUserType = authService.getUserType();

        if (token && storedUser) {
          setUser(storedUser);
          setUserType(storedUserType);
          
          // Verify token is still valid by fetching current user
          try {
            const response = await authService.getMe();
            if (response.data.success) {
              const userData = response.data.data;
              
              // Normalize preferredCategories (backend may return it as JSON string)
              const normalizedUser = { ...userData };
              if (normalizedUser && typeof normalizedUser.preferredCategories === 'string') {
                try {
                  normalizedUser.preferredCategories = JSON.parse(normalizedUser.preferredCategories);
                } catch (e) {
                  normalizedUser.preferredCategories = [];
                }
              } else if (normalizedUser && !Array.isArray(normalizedUser.preferredCategories)) {
                normalizedUser.preferredCategories = normalizedUser.preferredCategories ? [normalizedUser.preferredCategories] : [];
              }
              
              setUser(normalizedUser);
              setUserType(normalizedUser.userType);
              authService.setUser(normalizedUser, normalizedUser.userType);
            }
          } catch (error) {
            // Token invalid, clear auth
            authService.removeToken();
            setUser(null);
            setUserType(null);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
        console.log("AuthContext: loadUser finished, loading set to false");
      }
    };

    loadUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authService.login(email, password, rememberMe);
      
      if (response.data.success) {
        const { user, token, refreshToken, linkedProfiles } = response.data.data;
        
        // Store token
        authService.setToken(token, refreshToken);
        
        // Store user data
        authService.setUser(user, user.userType || 'CLIENT');
        
        setUser(user);
        setUserType(user.userType || 'CLIENT');
        
        return { success: true, user, token, linkedProfiles };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || t('auth.loginFailed') || 'Login failed'
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authService.register(data);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data.data;

        // Normalize preferredCategories (backend may return it as JSON string)
        const normalizedUser = { ...user };
        if (normalizedUser && typeof normalizedUser.preferredCategories === 'string') {
          try {
            normalizedUser.preferredCategories = JSON.parse(normalizedUser.preferredCategories);
          } catch (e) {
            normalizedUser.preferredCategories = [];
          }
        } else if (normalizedUser && !Array.isArray(normalizedUser.preferredCategories)) {
          normalizedUser.preferredCategories = normalizedUser.preferredCategories ? [normalizedUser.preferredCategories] : [];
        }
        
        // Store token
        authService.setToken(token, refreshToken);
        
        // Store user data
        authService.setUser(normalizedUser, 'CLIENT');
        
        setUser(normalizedUser);
        setUserType('CLIENT');
        
        return { success: true, user: normalizedUser };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || t('auth.registrationFailed') || 'Registration failed'
      };
    }
  };

  const guestLogin = async () => {
    try {
      const response = await authService.guestLogin();
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Store token
        authService.setToken(token);
        
        // Store user data
        authService.setUser(user, 'CLIENT');
        
        setUser(user);
        setUserType('CLIENT');
        
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || t('auth.guestLoginFailed') || 'Guest login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.removeToken();
      setUser(null);
      setUserType(null);
      navigate('/');
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        authService.setUser(updatedUser, updatedUser.userType || userType);
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed'
      };
    }
  };

  const value = {
    user,
    userType,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    guestLogin,
    logout,
    updateProfile,
    refreshUser: async () => {
      try {
        const response = await authService.getMe();
        if (response.data.success) {
          const userData = response.data.data;
          
          // Normalize preferredCategories (backend may return it as JSON string)
          const normalizedUser = { ...userData };
          if (normalizedUser && typeof normalizedUser.preferredCategories === 'string') {
            try {
              normalizedUser.preferredCategories = JSON.parse(normalizedUser.preferredCategories);
            } catch (e) {
              normalizedUser.preferredCategories = [];
            }
          } else if (normalizedUser && !Array.isArray(normalizedUser.preferredCategories)) {
            normalizedUser.preferredCategories = normalizedUser.preferredCategories ? [normalizedUser.preferredCategories] : [];
          }
          
          authService.setUser(normalizedUser, normalizedUser.userType || userType);
          setUser(normalizedUser);
          setUserType(normalizedUser.userType || userType);
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};







