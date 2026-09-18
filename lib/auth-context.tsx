'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, apiEndpoints, clearTokens, extractApiErrorMessage, getStoredAccessToken, storeTokens, setAccessToken } from './api';

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

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // refresh every 14 minutes (access token is 1 hour)
const ACCESS_TOKEN_COOKIE_KEY = 'zenfix_access_token';

function syncAccessTokenCookie(token: string | null) {
  if (typeof document === 'undefined') return;
  if (token) {
    const maxAge = 60 * 60; // 1 hour
    document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=${token}; path=/; max-age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  } else {
    document.cookie = `${ACCESS_TOKEN_COOKIE_KEY}=; path=/; max-age=0`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(async () => {
      try {
        const newToken = await api.refreshToken();
        if (newToken && mountedRef.current) {
          syncAccessTokenCookie(newToken);
        } else if (!newToken && mountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          syncAccessTokenCookie(null);
        }
      } catch {
        if (mountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
          syncAccessTokenCookie(null);
        }
      }
    }, REFRESH_INTERVAL_MS);
  }, [stopRefreshTimer]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      let response = await api.get<User>(apiEndpoints.me);

      if (!response.data) {
        const refreshedToken = await api.refreshToken();
        if (refreshedToken) {
          syncAccessTokenCookie(refreshedToken);
          response = await api.get<User>(apiEndpoints.me);
        }
      }

      if (response.data && (response.data.id || response.data.username)) {
        setUser(response.data);
        setIsAuthenticated(true);
        const currentToken = getStoredAccessToken();
        if (currentToken) syncAccessTokenCookie(currentToken);
        scheduleRefresh();
      } else {
        clearTokens();
        syncAccessTokenCookie(null);
        setUser(null);
        setIsAuthenticated(false);
        stopRefreshTimer();
      }
    } catch {
      clearTokens();
      syncAccessTokenCookie(null);
      setUser(null);
      setIsAuthenticated(false);
      stopRefreshTimer();
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [scheduleRefresh, stopRefreshTimer]);

  useEffect(() => {
    mountedRef.current = true;
    checkAuth();
    return () => {
      mountedRef.current = false;
      stopRefreshTimer();
    };
  }, [checkAuth, stopRefreshTimer]);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.post<any>(apiEndpoints.login, credentials);
      const payload = response.data as any;
      const userData = payload?.user || payload;
      const access = payload?.access;

      if (!response.error && userData && access) {
        storeTokens(access);
        syncAccessTokenCookie(access);
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
        scheduleRefresh();
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
      syncAccessTokenCookie(null);
      setUser(null);
      setIsAuthenticated(false);
      stopRefreshTimer();
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
