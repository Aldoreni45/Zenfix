'use client';

import { SessionProvider } from '@/lib/next-auth-compat';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
