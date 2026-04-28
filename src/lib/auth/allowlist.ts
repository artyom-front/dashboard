export type Role = 'admin' | 'manager' | 'viewer';

export interface AllowedUser {
  role: Role;
  banks: string[];
  name?: string;
}

type RawAllowlistEntry = {
  role?: unknown;
  banks?: unknown;
  name?: unknown;
};

type RawAllowlist = Record<string, RawAllowlistEntry>;

const ENV_NAME = 'BANK_AUTH_ALLOWLIST_JSON';

let cachedAllowlist: Map<string, AllowedUser> | null = null;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeBankCode(value: string): string {
  return value.trim().toLowerCase();
}

function assertRole(value: unknown, email: string): Role {
  if (value === 'admin' || value === 'manager' || value === 'viewer') {
    return value;
  }

  throw new Error(`[auth] Invalid role for ${email}. Allowed: admin | manager | viewer`);
}

function assertBanks(value: unknown, email: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`[auth] Missing banks array for ${email}`);
  }

  const banks = value
    .map((item) => (typeof item === 'string' ? normalizeBankCode(item) : ''))
    .filter(Boolean);

  const unique = Array.from(new Set(banks));

  if (unique.length === 0) {
    throw new Error(`[auth] Empty banks array for ${email}`);
  }

  return unique;
}

function loadAllowlist(): Map<string, AllowedUser> {
  const raw = process.env[ENV_NAME];

  if (!raw) {
    return new Map();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Map(); // fail closed
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return new Map(); // fail closed
  }

  const result = new Map<string, AllowedUser>();

  for (const [emailRaw, entryRaw] of Object.entries(parsed as RawAllowlist)) {
    try {
      const email = normalizeEmail(emailRaw);

      if (!email.includes('@')) {
        continue;
      }

      if (!entryRaw || typeof entryRaw !== 'object') {
        continue;
      }

      const role = assertRole(entryRaw.role, email);
      const banks = assertBanks(entryRaw.banks, email);
      const name = typeof entryRaw.name === 'string' ? entryRaw.name.trim() : undefined;

      result.set(email, {
        role,
        banks,
        ...(name ? { name } : {}),
      });
    } catch {
      // fail closed on invalid entry
    }
  }

  return result;
}

export function getAllowlist(): Map<string, AllowedUser> {
  if (!cachedAllowlist) {
    cachedAllowlist = loadAllowlist();
  }

  return cachedAllowlist;
}

export function getAllowedUserByEmail(email?: string | null): AllowedUser | null {
  if (!email) return null;
  return getAllowlist().get(normalizeEmail(email)) ?? null;
}

export function isAllowedEmail(email?: string | null): boolean {
  return Boolean(getAllowedUserByEmail(email));
}

export function canAccessBank(email: string, bankCode: string): boolean {
  const user = getAllowedUserByEmail(email);
  if (!user) return false;
  return user.banks.includes(normalizeBankCode(bankCode));
}

export function getPrimaryBank(email?: string | null): string | null {
  return getAllowedUserByEmail(email)?.banks[0] ?? null;
}