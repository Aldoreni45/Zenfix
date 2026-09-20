'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, apiEndpoints, clearTokens, getStoredAccessToken, hasAccessToken, hasRefreshToken, storeTokens } from './api';

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

  const initStartedRef = useRef(false);

  const initializeAuth = useCallback(async () => {
    // React StrictMode double-invokes effects in development. Guard so the
    // auth bootstrap (and its network calls) runs exactly once per mount.
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    console.log('[AUTH] initialization:start');
    setLoading(true);
    setInitialized(false);

    const hasAccess = hasAccessToken();
    const hasRefresh = hasRefreshToken();
    // Session signal: any JS-visible JWT cookie or stored access token.
    // Used only for recovery decisions, NEVER as a reason to skip restore
    // (cookies may be HttpOnly and invisible to document.cookie while still
    // being sent to the /me endpoint by the browser).
    const sessionHint = hasAccess || hasRefresh || !!getStoredAccessToken();

    try {
      // Step 1: always try to get the current user. The browser automatically
      // sends the session cookies (even HttpOnly ones), so /me restores the
      // session even when JS cannot read them from document.cookie.
      let response = await api.get<User>(apiEndpoints.me);
      console.log('[AUTH] current-user:status', response.status);

      // Step 2: if 401, refresh once and retry once (bounded, never a loop)
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

      // Step 3: deterministic auth state from the final response
      if (response.data && (response.data.id || response.data.username)) {
        console.log('[AUTH] user-restored', { userId: response.data.id, role: response.data.role });
        setUser(response.data);
        saveUserRole(response.data.role);
        setIsAuthenticated(true);
        scheduleRefresh();
      } else if (sessionHint) {
        // A session signal exists but the restore request failed (e.g. a
        // transient network hiccup while the page reloads). Keep the admin
        // logged in instead of bouncing to the login screen; the background
        // refresh loop will recover the session or clear it if truly dead.
        console.log('[AUTH] no-user-restored-but-session-exists, keeping-authenticated', { status: response.status, hasError: !!response.error });
        setUser(null);
        setIsAuthenticated(true);
        scheduleRefresh();
      } else {
        console.log('[AUTH] no-user-restored', { status: response.status, hasError: !!response.error });
        setUser(null);
        setIsAuthenticated(false);
        clearSavedUserRole();
        stopRefreshTimer();
      }
    } catch (error) {
      console.log('[AUTH] initialization:error', error);
      if (sessionHint) {
        console.log('[AUTH] error-but-session-exists, keeping-authenticated');
        setUser(null);
        setIsAuthenticated(true);
        scheduleRefresh();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        clearSavedUserRole();
        stopRefreshTimer();
      }
    } finally {
      console.log('[AUTH] initialization:complete');
      setLoading(false);
      setInitialized(true);
    }
  }, [scheduleRefresh, stopRefreshTimer]);

  // Explicit re-initialization used by UI (e.g. profile after save). Bypasses
  // the StrictMode early-run guard because it is a deliberate user action.
  const refetch = useCallback(async () => {
    initStartedRef.current = false;
    await initializeAuth();
  }, [initializeAuth]);

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
        storeTokens(access);
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
    refetch,
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
  const { user, initialized } = useAuth();
  if (user?.role) return user.role;
  // Only trust the sessionStorage fallback after the auth bootstrap finishes.
  // Reading it during SSR or the first client render would diverge from the
  // server (no storage server-side) and break React hydration.
  const savedRole = initialized ? getSavedUserRole() : null;
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

export function useCanManage() {
  const role = useUserRole();
  return role === 'owner' || role === 'manager';
}

export function useCanManageUsers() {
  const role = useUserRole();
  return role === 'owner' || role === 'manager';
}

export function useCanApproveVideos() {
  const role = useUserRole();
  return role === 'owner' || role === 'manager';
}
