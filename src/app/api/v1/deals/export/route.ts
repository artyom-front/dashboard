// src\app\api\v1\deals\export\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { auditAccessDenied, auditExport } from '@/lib/audit';
import { canAccessBank, getAllowedUserByEmail } from '@/lib/auth/allowlist';
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);

  if (/[",\n\r;]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const headers = [
    'ID',
    'TITLE',
    'STAGE_ID',
    'CATEGORY_ID',
    'DATE_CREATE',
    'DATE_MODIFY',
    'ASSIGNED_BY_ID',
    'COMMENTS',
    'SOURCE_ID',
    'SOURCE_DESCRIPTION',
  ];

  const lines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers.map((key) => escapeCsv(row[key])).join(';'),
    ),
  ];

  return `\uFEFF${lines.join('\n')}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const access = getAllowedUserByEmail(email);

  if (!email) {
    auditAccessDenied({
      email,
      reason: 'unauthorized',
      resource: 'api.v1.deals.export',
    });

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!access) {
    auditAccessDenied({
      email,
      reason: 'allowlist_miss',
      resource: 'api.v1.deals.export',
    });

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const requestedBank = (searchParams.get('bank') ?? access.banks[0] ?? '')
    .trim()
    .toLowerCase();

  if (!requestedBank || !canAccessBank(email, requestedBank)) {
    auditAccessDenied({
      email,
      reason: 'bank_scope_denied',
      resource: 'api.v1.deals.export',
      bank: requestedBank || undefined,
    });

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const stageId = searchParams.get('stageId')?.trim() || undefined;
  const search = searchParams.get('search')?.trim() || undefined;
  const dateFrom = searchParams.get('dateFrom')?.trim() || undefined;
  const dateTo = searchParams.get('dateTo')?.trim() || undefined;

  try {
    const result = await fetchDeals({
      bank: requestedBank,
      page: 1,
      perPage: 1000000,
      stageId,
      search,
      dateFrom,
      dateTo,
      sortBy: 'DATE_CREATE',
      sortOrder: 'DESC',
    });

    const csv = toCsv(result.deals as Array<Record<string, unknown>>);

    auditExport({
      email,
      bank: requestedBank,
      count: result.total,
      filters: { search, stageId, dateFrom, dateTo },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="deals-export.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to export deals' },
      { status: 500 },
    );
  }
}