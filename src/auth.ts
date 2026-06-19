import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAllowedUserByEmail, type Role } from '@/lib/auth/allowlist';
import { auditAccessDenied, auditAuthSignIn } from '@/lib/audit';

function normalizeEmail(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 30,
    updateAge: 60 * 5,
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'name@company.ru',
        },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email as string | undefined);

        if (!email || !email.includes('@')) {
          return null;
        }

        const access = getAllowedUserByEmail(email);

        if (!access) {
          auditAccessDenied({
            email,
            reason: 'allowlist_miss',
            resource: 'auth.authorize',
          });

          return null;
        }

        auditAuthSignIn({
          email,
          role: access.role,
          bankCount: access.banks.length,
        });

        return {
          id: email,
          email,
          name: access.name ?? email,
          role: access.role,
          banks: access.banks,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = user.role;
        token.banks = user.banks;
      } else {
        const email = normalizeEmail(token.email);
        const access = getAllowedUserByEmail(email);

        if (access) {
          token.role = access.role;
          token.banks = access.banks;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) return session;

      session.user.email = String(token.email ?? session.user.email ?? '');
      session.user.role = (token.role as Role) ?? 'viewer';
      session.user.banks = Array.isArray(token.banks) ? token.banks : [];

      return session;
    },
    async redirect({ url, baseUrl }) {
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    if (new URL(url).origin === baseUrl) return url;
    return `${baseUrl}/login`;  // <-- fallback
  },
  },
};