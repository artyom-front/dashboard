'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';
import { IdleLogout } from '@/domains/shared/ui/IdleLogout';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={60 * 5} refetchOnWindowFocus>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <IdleLogout idleTimeoutMs={15 * 60 * 1000} />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}

export default Providers;