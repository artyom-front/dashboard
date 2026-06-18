import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');
  redirect('/bank');
}