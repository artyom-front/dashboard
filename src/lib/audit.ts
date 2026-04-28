import { appendFileSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, resolve } from 'path';

export type AuditAction =
  | 'auth.sign_in'
  | 'auth.sign_out'
  | 'auth.denied'
  | 'deal.export'
  | 'deal.status_change';

export type AuditMeta = Record<string, unknown>;

function hashSubject(subject?: string | null): string | null {
  if (!subject) return null;

  return createHash('sha256')
    .update(subject.trim().toLowerCase())
    .digest('hex');
}

function redactMeta(meta: unknown): unknown {
  if (meta == null) return meta;

  if (Array.isArray(meta)) {
    return meta.map(redactMeta);
  }

  if (typeof meta === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
      if (['search', 'fio', 'organization', 'inn', 'dealNumber', 'email'].includes(key)) {
        out[key] = typeof value === 'string' ? Boolean(value.trim()) : Boolean(value);
        continue;
      }

      out[key] = redactMeta(value);
    }
    return out;
  }

  return meta;
}

function writeAuditLine(payload: Record<string, unknown>) {
  const filePath = process.env.AUDIT_LOG_PATH?.trim()
    || resolve(process.cwd(), 'logs', 'audit.log');

  try {
    mkdirSync(dirname(filePath), { recursive: true });
    appendFileSync(filePath, `${JSON.stringify(payload)}\n`, { encoding: 'utf8' });
  } catch {
    // fail closed: do not print sensitive data to console
  }
}

export function auditEvent(params: {
  action: AuditAction;
  subjectEmail?: string | null;
  meta?: AuditMeta;
}) {
  writeAuditLine({
    ts: new Date().toISOString(),
    action: params.action,
    subjectHash: hashSubject(params.subjectEmail),
    meta: redactMeta(params.meta ?? {}),
  });
}

export function auditAuthSignIn(params: {
  email?: string | null;
  role: string;
  bankCount: number;
}) {
  auditEvent({
    action: 'auth.sign_in',
    subjectEmail: params.email,
    meta: {
      role: params.role,
      bankCount: params.bankCount,
    },
  });
}

export function auditAuthSignOut(params: {
  email?: string | null;
  role?: string;
  bankCount?: number;
}) {
  auditEvent({
    action: 'auth.sign_out',
    subjectEmail: params.email,
    meta: {
      role: params.role ?? 'unknown',
      bankCount: params.bankCount ?? 0,
    },
  });
}

export function auditAccessDenied(params: {
  email?: string | null;
  reason: string;
  resource: string;
  bank?: string;
}) {
  auditEvent({
    action: 'auth.denied',
    subjectEmail: params.email,
    meta: {
      reason: params.reason,
      resource: params.resource,
      bank: params.bank ?? null,
    },
  });
}

export function auditExport(params: {
  email?: string | null;
  bank: string;
  count: number;
  filters: {
    search?: string;
    stageId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}) {
  auditEvent({
    action: 'deal.export',
    subjectEmail: params.email,
    meta: {
      bank: params.bank,
      count: params.count,
      filters: {
        search: Boolean(params.filters.search),
        stageId: Boolean(params.filters.stageId),
        dateFrom: Boolean(params.filters.dateFrom),
        dateTo: Boolean(params.filters.dateTo),
      },
    },
  });
}

export function auditDealStatusChange(params: {
  email?: string | null;
  bank: string;
  dealId: string | number;
  fromStatus?: string;
  toStatus?: string;
}) {
  auditEvent({
    action: 'deal.status_change',
    subjectEmail: params.email,
    meta: {
      bank: params.bank,
      dealId: params.dealId,
      fromStatus: params.fromStatus ?? null,
      toStatus: params.toStatus ?? null,
    },
  });
}