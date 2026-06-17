

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Building2 } from 'lucide-react';
import { ThemeToggle } from '@/domains/shared/ui/ThemeToggle';
import { UserMenu } from '@/domains/shared/ui/UserMenu';


function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={[
        'rounded-xl px-3 py-2 text-sm font-medium transition',
        active
          ? 'bg-[#f10d30]/10 text-[#f10d30]'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

function BankScopeBadge() {
  const { data: session } = useSession();
  const banks = session?.user?.banks ?? [];

  if (banks.length <= 1) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#10385c]/20 bg-[#10385c]/10 px-3 py-1.5 text-xs font-medium text-[#10385c]">
      <Building2 className="h-3.5 w-3.5" />
      Доступ к {banks.length} банкам
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/bank" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f10d30] font-bold text-white">
              К
            </div>
            <span className="hidden font-semibold text-slate-900 dark:text-slate-100 sm:inline">
              Первый ККМ
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem href="/bank" label="Дашборд" />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <BankScopeBadge />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}