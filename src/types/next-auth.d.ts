import type { Role } from '@/lib/auth/allowlist';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email: string;
      image?: string | null;
      role: Role;
      banks: string[];
    };
  }

  interface User {
    role: Role;
    banks: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    banks?: string[];
  }
}