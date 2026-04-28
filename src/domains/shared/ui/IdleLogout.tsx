'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

type IdleLogoutProps = {
  idleTimeoutMs?: number;
};

export function IdleLogout({ idleTimeoutMs = 15 * 60 * 1000 }: IdleLogoutProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (pathname === '/login' || pathname === '/forbidden') return;

    const resetTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        signOut({ callbackUrl: '/login?reason=idle' });
      }, idleTimeoutMs);
    };

    const onActivity = () => resetTimer();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        resetTimer();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'pointerdown',
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, onActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', onVisibility);

    resetTimer();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      events.forEach((eventName) => window.removeEventListener(eventName, onActivity));
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [idleTimeoutMs, pathname, status]);

  return null;
}