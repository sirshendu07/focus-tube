import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('focustube_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('focustube_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('focustube_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('focustube_user', JSON.stringify(res.user));
      }
    } catch (err) {
      console.warn('Failed to verify existing session:', err.message);
      if (err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    localStorage.setItem('focustube_token', data.token);
    setUser(data.user);
    localStorage.setItem('focustube_user', JSON.stringify(data.user));
    setAuthModalOpen(false);
    refreshUser();
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    setToken(data.token);
    localStorage.setItem('focustube_token', data.token);
    setUser(data.user);
    localStorage.setItem('focustube_user', JSON.stringify(data.user));
    setAuthModalOpen(false);
    refreshUser();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('focustube_token');
    localStorage.removeItem('focustube_user');
    setToken(null);
    setUser(null);
  };

  const openAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
        authModalOpen,
        authModalMode,
        openAuth,
        closeAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
