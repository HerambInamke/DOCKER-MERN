import { useCallback, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from './auth-context';

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const getApiErrorMessage = (error, fallback) => {
  return error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || fallback;
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'USER_LOADED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_ERROR':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      dispatch({
        type: 'USER_LOADED',
        payload: res.data.user,
      });
    } catch {
      dispatch({ type: 'AUTH_ERROR' });
    }
  }, []);

  // Load user on app start
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: 'AUTH_ERROR' });
    }
  }, [loadUser, state.token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Login failed');
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/api/auth/register', userData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Registration failed');
      toast.error(message);
      return { success: false, message };
    }
  };

  const completeOAuthLogin = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      const res = await api.get('/api/auth/me');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token,
          user: res.data.user,
        },
      });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'AUTH_ERROR' });
      const message = getApiErrorMessage(error, 'Social login failed');
      toast.error(message);
      return { success: false, message };
    }
  }, []);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/api/auth/profile', profileData);
      dispatch({
        type: 'UPDATE_USER',
        payload: res.data.user,
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Profile update failed');
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      const message = getApiErrorMessage(error, 'Password change failed');
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    ...state,
    login,
    register,
    completeOAuthLogin,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
