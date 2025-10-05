'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';
import { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('token');
    console.log('Checking auth, token:', token ? 'exists' : 'missing');
    
    if (token) {
      try {
        const userData = await authAPI.getMe();
        console.log('User data from getMe:', userData);
        setUser(userData);
      } catch (error) {
        console.log("Auth check failed:", error);
        Cookies.remove('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (identifier: string, password: string) => {
    const data: AuthResponse = await authAPI.login(identifier, password);
    console.log('Login response:', data);
    setUser(data.user);
    // Force re-check to get full user data with role
    setTimeout(() => checkAuth(), 100);
  };

  const register = async (username: string, email: string, password: string) => {
    const data: AuthResponse = await authAPI.register(username, email, password);
    console.log('Register response:', data);
    setUser(data.user);
    // Force re-check to get full user data with role
    setTimeout(() => checkAuth(), 100);
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
