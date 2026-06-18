import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getAllowedUserByEmail } from '@/lib/auth/allowlist';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

const BANK_NAMES: Record<string, string> = {
  bspb: 'Банк СПБ', sber: 'СберБанк', vtb: 'ВТБ',
  alfa: 'Альфа-Банк', tinkoff: 'Т-Банк', raiff: 'Райффайзен',
  otkritie: 'Открытие', psb: 'Промсвязьбанк',
};

export default async function BankSelectorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');
  const user = getAllowedUserByEmail(session.user.email);
  if (!user || user.banks.length === 0) redirect('/forbidden');
  if (user.banks.length === 1) redirect(`/bank/${user.banks[0]}`);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f10d30]/10 text-[#f10d30] mb-4">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Выберите банк</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Доступ к {user.banks.length} банкам
          </p>
          <div className="mt-8 space-y-3 text-left">
            {user.banks.map((bankCode) => (
              <Link key={bankCode} href={`/bank/${bankCode}`}
                className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#f10d30]/30 hover:shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-lg font-bold">
                    {bankCode.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{BANK_NAMES[bankCode.toLowerCase()] || bankCode.toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">Код: {bankCode.toUpperCase()}</div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-[#f10d30]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}