'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, apiEndpoints, clearTokens, extractApiErrorMessage, getStoredAccessToken, storeTokens } from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'owner' | 'manager' | 'employee';
  role_name: string;
  status: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Attempt to fetch current user with existing access token
      let response = await api.get<User>(apiEndpoints.me);

      // 2. If unauthorized or missing, attempt refresh using HttpOnly cookie
      if (!response.data) {
        const refreshedToken = await api.refreshToken();
        if (refreshedToken) {
          response = await api.get<User>(apiEndpoints.me);
        }
      }

      if (response.data && (response.data.id || response.data.username)) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post<any>(apiEndpoints.login, credentials);
      const payload = response.data as any;
      const userData = payload?.user || payload;
      const access = payload?.access;

      if (!response.error && userData && access) {
        storeTokens(access);
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: extractApiErrorMessage(response) };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post<any>(apiEndpoints.logout, {});
    } catch {
      // Ignore network errors on logout
    } finally {
      clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refetch: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based helpers
export function useUserRole() {
  const { user } = useAuth();
  return user?.role || 'employee';
}

export function useIsOwner() {
  const role = useUserRole();
  return role === 'owner';
}

export function useIsManager() {
  const role = useUserRole();
  return role === 'manager';
}

export function useIsEmployee() {
  const role = useUserRole();
  return role === 'employee';
}

export function useCanManageUsers() {
  return useIsOwner();
}

export function useCanApproveVideos() {
  return useIsOwner();
}