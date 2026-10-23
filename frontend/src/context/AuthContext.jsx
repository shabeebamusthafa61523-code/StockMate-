import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, getStoredUser, setStoredUser } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            setStoredUser(res.data);
          }
        } catch (error) {
          console.error('Session expired or invalid token');
          setAuthToken(null);
          setStoredUser(null);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.success && res.data) {
        const { token: receivedToken, ...userData } = res.data;
        setAuthToken(receivedToken);
        setStoredUser(userData);
        setToken(receivedToken);
        setUser(userData);
        toast.success(`Welcome back, ${userData.name}!`);
        return { success: true };
      }
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
    setToken(null);
    toast.success('Logged out successfully');
  };

  const hasRole = (roles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has super-access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
