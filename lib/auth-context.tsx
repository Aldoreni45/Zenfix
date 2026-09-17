'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useAuthApi } from './hooks';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthApi();

  const value: AuthContextType = {
    user: auth.user,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    logout: auth.logout,
    refetch: auth.refetch,
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