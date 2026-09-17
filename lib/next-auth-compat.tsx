'use client';

import React from 'react';
import { useAuth } from './auth-context';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useSession() {
  const { user, loading, isAuthenticated } = useAuth();

  return {
    data: user
      ? {
          user: {
            ...user,
            id: user.id,
            name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username,
            email: user.email,
            role: user.role,
            username: user.username,
          },
        }
      : null,
    status: loading
      ? ('loading' as const)
      : isAuthenticated
        ? ('authenticated' as const)
        : ('unauthenticated' as const),
    update: async () => {},
  };
}

export async function signIn() {
  if (typeof window !== 'undefined') {
    window.location.href = '/adminzenfix/login';
  }
}

export async function signOut() {
  if (typeof window !== 'undefined') {
    window.location.href = '/adminzenfix/login';
  }
}
