import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKEN: 'SET_TOKEN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER'
};

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  isAuthenticated: false
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    case AUTH_ACTIONS.SET_TOKEN:
      return {
        ...state,
        token: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      localStorage.setItem('token', state.token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (state.token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/auth/me`);
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data.user });
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, [state.token]);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { user, token } = response.data;
      
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      toast.success('Login successful!');
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: false, error: message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { user, token } = response.data;
      
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      toast.success('Registration successful!');
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/profile`, profileData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: response.data.user });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`);
      const { token } = response.data;
      
      dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: token });
      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Context value
  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;