import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAllowedUserByEmail } from '@/lib/auth/allowlist';

const PUBLIC_PATHS = [
  '/login',
  '/forbidden',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email =
    typeof token?.email === 'string' ? token.email.trim().toLowerCase() : null;

  if (!email) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', `${req.nextUrl.pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  const access = getAllowedUserByEmail(email);

  if (!access) {
    const url = new URL('/forbidden', req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/auth|login|forbidden).*)'],
};