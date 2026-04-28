'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Building2, ChevronDown, LogOut, Shield } from 'lucide-react';

function roleLabel(role?: string) {
  switch (role) {
    case 'admin':
      return 'Администратор';
    case 'manager':
      return 'Менеджер';
    case 'viewer':
      return 'Просмотр';
    default:
      return 'Пользователь';
  }
}

function getInitials(nameOrEmail: string) {
  const source = nameOrEmail.trim();
  if (!source) return 'U';

  const parts = source
    .replace(/@.*$/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const user = session?.user;
  const displayName = useMemo(() => {
    if (!user) return 'Пользователь';
    return user.name?.trim() || user.email;
  }, [user]);

  if (status === 'loading') {
    return (
      <div className="h-11 w-52 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    );
  }

  if (!user) return null;

  const banks = user.banks ?? [];
  const role = user.role;
  const bankScopeLabel = banks.length > 1 ? `Доступ к ${banks.length} банкам` : banks[0] ?? null;

  const handleSignOut = async () => {
    try {
      await fetch('/api/audit/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      await signOut({ callbackUrl: '/login' });
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 pr-4 text-left shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f10d30] text-xs font-semibold text-white">
          {getInitials(displayName)}
        </span>

        <span className="hidden min-w-0 flex-col items-start sm:flex">
          <span className="max-w-[160px] truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {displayName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {roleLabel(role)}
          </span>
        </span>

        <ChevronDown
          className={[
            'h-4 w-4 text-slate-400 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f10d30] text-sm font-semibold text-white">
                {getInitials(displayName)}
              </span>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <Shield className="h-3.5 w-3.5" />
              {roleLabel(role)}
            </div>

            {bankScopeLabel ? (
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#10385c]/20 bg-[#10385c]/10 px-3 py-1 text-xs font-medium text-[#10385c]">
                <Building2 className="h-3.5 w-3.5" />
                {bankScopeLabel}
              </div>
            ) : null}
          </div>

          <div className="p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Доступные банки
            </div>

            <div className="flex flex-wrap gap-2">
              {banks.length > 0 ? (
                banks.map((bank) => (
                  <span
                    key={bank}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {bank}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Банки не назначены
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 dark:bg-white dark:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}