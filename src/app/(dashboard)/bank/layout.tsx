import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth';
import { getAllowedUserByEmail } from '@/lib/auth/allowlist';
import { AppHeader } from '@/domains/shared/ui/AppHeader';

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const access = getAllowedUserByEmail(email);

  if (!email) {
    redirect('/login');
  }

  if (!access) {
    redirect('/forbidden');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      {children}
    </div>
  );
}