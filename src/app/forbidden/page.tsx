// src\app\forbidden\page.tsx

import Link from 'next/link';
import { ThemeToggle } from '@/domains/shared/ui/ThemeToggle';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg items-center px-4">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-2xl font-semibold">Доступ ограничен</div>
            <ThemeToggle />
          </div>

          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            У вашей учётной записи нет доступа к этому разделу или банку.
            Обратитесь к администратору, если доступ должен быть предоставлен.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/bank"
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[#f10d30] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95"
            >
              Вернуться в дашборд
            </Link>
            <Link
              href="/login"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Войти заново
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}