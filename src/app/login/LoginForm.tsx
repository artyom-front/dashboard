'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useMemo, useState, Suspense, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/domains/shared/ui/ThemeToggle';

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: 'Доступ запрещён. Обратитесь к администратору.',
  CredentialsSignin: 'Эта почта не входит в список доступа.',
  Configuration: 'Ошибка конфигурации авторизации.',
  Default: 'Не удалось войти.',
};

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/bank';
  const reason = searchParams.get('reason') ?? '';
  const urlError = searchParams.get('error') ?? '';

  const message = useMemo(() => {
    if (reason === 'idle') {
      return 'Сессия завершена из-за простоя. Войдите снова.';
    }

    if (urlError) {
      return ERROR_MESSAGES[urlError] ?? ERROR_MESSAGES.Default;
    }

    return '';
  }, [reason, urlError]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setLocalError('Введите рабочую почту.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: normalizedEmail,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setLocalError('Не удалось выполнить вход.');
        return;
      }

      if (result.error) {
        setLocalError(
          'Эта почта не входит в список доступа. Проверьте корпоративный email или запросите доступ у администратора.'
        );
        return;
      }

      router.replace(result.url || callbackUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900 dark:bg-[#0f1724] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold">Первый ККМ</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Вход только для сотрудников из списка доступа
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="mb-6 rounded-2xl border border-[#10385c]/15 bg-[#10385c]/5 p-4 text-sm text-[#10385c] dark:border-[#10385c]/30 dark:bg-[#10385c]/10 dark:text-slate-200">
            Введите рабочую почту. Если она есть в allowlist, вы попадёте в дашборд.
          </div>

          {message ? (
            <div className="mb-4 rounded-2xl border border-[#f10d30]/20 bg-[#f10d30]/8 px-4 py-3 text-sm text-[#f10d30] dark:border-[#f10d30]/30 dark:bg-[#f10d30]/10 dark:text-red-100">
              {message}
            </div>
          ) : null}

          {localError ? (
            <div className="mb-4 rounded-2xl border border-[#f10d30]/20 bg-[#f10d30]/8 px-4 py-3 text-sm text-[#f10d30] dark:border-[#f10d30]/30 dark:bg-[#f10d30]/10 dark:text-red-100">
              {localError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Рабочая почта
              </span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.ru"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#10385c] dark:border-slate-800 dark:bg-slate-900 dark:focus:border-[#f10d30]"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#f10d30] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Проверяем доступ...' : 'Войти'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            <p>Если почта отсутствует в списке доступа, вход будет отклонён.</p>
            <p>Чтобы получить доступ, напишите администратору и укажите ФИО, корпоративную почту и банк.</p>
            <p>Сессия завершится автоматически при простое.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center dark:bg-[#0f1724]">
          <div className="text-slate-500 dark:text-slate-400">Загрузка...</div>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}