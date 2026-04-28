import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { auditAuthSignOut } from '@/lib/audit';
import { getAllowedUserByEmail } from '@/lib/auth/allowlist';

export async function POST() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const access = getAllowedUserByEmail(email);

  auditAuthSignOut({
    email,
    role: access?.role,
    bankCount: access?.banks.length ?? 0,
  });

  return NextResponse.json({ ok: true });
}