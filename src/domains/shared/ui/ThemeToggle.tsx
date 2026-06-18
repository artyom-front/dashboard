'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return <Button variant="outline" size="icon" disabled><div className="h-4 w-4 animate-pulse rounded-full bg-muted" /></Button>;

  const isDark = resolvedTheme === 'dark';
  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} title={isDark ? 'Светлая тема' : 'Тёмная тема'} aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}>
      {isDark ? '☀️' : '🌙'}
    </Button>
  );
}