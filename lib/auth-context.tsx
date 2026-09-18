'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, apiEndpoints, clearTokens, hasAccessToken, hasRefreshToken } from './api';

const USER_ROLE_KEY = 'zenfix_user_role';

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
  initialized: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_INTERVAL_MS = 14 * 60 * 1000; // refresh every 14 minutes (access token is 1 hour)

// Helper functions for sessionStorage
function saveUserRole(role: string) {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(USER_ROLE_KEY, role);
    } catch {
      // Ignore errors
    }
  }
}

function getSavedUserRole(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem(USER_ROLE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

function clearSavedUserRole() {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(USER_ROLE_KEY);
    } catch {
      // Ignore errors
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const logout = async () => {
    console.log('[AUTH] logout:start');
    try {
      await api.post(apiEndpoints.logout, {});
    } catch (error) {
      console.error('[AUTH] logout:error', error);
    } finally {
      clearTokens();
      clearSavedUserRole();
      setUser(null);
      setIsAuthenticated(false);
      stopRefreshTimer();
      console.log('[AUTH] logout:complete');
    }
  };

  const scheduleRefresh = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(async () => {
      try {
        const refreshedToken = await api.refreshToken();
        if (!refreshedToken) {
          console.log('[AUTH] Background refresh failed, logging out');
          await logout();
        }
      } catch (error) {
        console.log('[AUTH] Background refresh error, logging out');
        await logout();
      }
    }, REFRESH_INTERVAL_MS);
  }, [stopRefreshTimer, logout]);

  const initializeAuth = useCallback(async () => {
    console.log('[AUTH] initialization:start');
    setLoading(true);
    setInitialized(false);

    // Optimistic: if tokens exist, assume authenticated while we fetch user data
    const hasAccess = hasAccessToken();
    const hasRefresh = hasRefreshToken();
    const tokensExist = hasAccess || hasRefresh;
    
    if (tokensExist) {
      console.log('[AUTH] tokens-found, setting authenticated=true optimistically');
      setIsAuthenticated(true);
    }

    try {
      // Step 1: Try to get current user
      let response = await api.get<User>(apiEndpoints.me);
      console.log('[AUTH] current-user:status', response.status);

      // Step 2: If 401, try to refresh token and retry
      if (response.status === 401 && hasRefresh) {
        console.log('[AUTH] access-token-expired, attempting refresh');
        const refreshedToken = await api.refreshToken();
        
        if (refreshedToken) {
          console.log('[AUTH] refresh-success, retrying /me');
          response = await api.get<User>(apiEndpoints.me);
          console.log('[AUTH] current-user:retry-status', response.status);
        } else {
          console.log('[AUTH] refresh-failed');
        }
      }

      // Step 3: Set auth state based on final response
      if (response.data && (response.data.id || response.data.username)) {
        console.log('[AUTH] user-restored', { userId: response.data.id, role: response.data.role });
        setUser(response.data);
        saveUserRole(response.data.role);
        setIsAuthenticated(true);
        scheduleRefresh();
      } else {
        console.log('[AUTH] no-user-restored', { status: response.status, hasError: !!response.error });
        // Only clear auth if no tokens exist
        if (!tokensExist) {
          setUser(null);
          setIsAuthenticated(false);
          clearSavedUserRole();
          stopRefreshTimer();
        } else {
          // Tokens exist but user fetch failed - keep isAuthenticated=true
          console.log('[AUTH] tokens-exist-but-user-fetch-failed, keeping-authenticated=true');
        }
      }
    } catch (error) {
      console.log('[AUTH] initialization:error', error);
      // Only clear auth if no tokens exist
      if (!tokensExist) {
        setUser(null);
        setIsAuthenticated(false);
        clearSavedUserRole();
        stopRefreshTimer();
      } else {
        // Tokens exist but error occurred - keep isAuthenticated=true
        console.log('[AUTH] tokens-exist-but-error-occurred, keeping-authenticated=true');
      }
    } finally {
      console.log('[AUTH] initialization:complete', { isAuthenticated, hasUser: !!user });
      setLoading(false);
      setInitialized(true);
    }
  }, [scheduleRefresh, stopRefreshTimer]);

  useEffect(() => {
    mountedRef.current = true;
    initializeAuth();
    return () => {
      mountedRef.current = false;
      stopRefreshTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setLoading(true);
    try {
      console.log('[AUTH] login:start');
      const response = await api.post<any>(apiEndpoints.login, credentials);
      const payload = response.data as any;
      const userData = payload?.user || payload;
      const access = payload?.access;

      if (!response.error && userData && access) {
        console.log('[AUTH] login:success', { userId: userData.id, role: userData.role });
        setUser(userData);
        saveUserRole(userData.role);
        setIsAuthenticated(true);
        scheduleRefresh();
        return { success: true };
      }

      console.log('[AUTH] login:failed', response.error);
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.log('[AUTH] login:error', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    isAuthenticated,
    login,
    logout,
    refetch: initializeAuth,
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
  // Fallback to sessionStorage if user is null (during initial load)
  if (user?.role) return user.role;
  const savedRole = getSavedUserRole();
  return (savedRole as 'owner' | 'manager' | 'employee') || 'employee';
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
  const role = useUserRole();
  return role === 'owner' || role === 'manager';
}

export function useCanApproveVideos() {
  const role = useUserRole();
  return role === 'owner' || role === 'manager';
}
