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
    'STAGE_NAME',
    'DATE_CREATE',
    'DATE_MODIFY',
    'ASSIGNED_BY_ID',
    'ASSIGNED_BY_NAME',
    'CONTACT_NAME',
    'CONTACT_PHONE',
    'CONTACT_EMAIL',
    'COMMENTS',
    'SOURCE_ID',
    'SOURCE_DESCRIPTION',
    'INN',
    'SITE',
    'INTEGRATION',
    'CERT_DATE',
    'TEST_DATE',
    'LAUNCH_DATE',
    'NEED_OK',
    'INSTALLED_OK',
    'OK_TEST_DATE',
    'SSL_STATUS',
    'OK_TYPE',
    'LAST_CONTACT',
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

    // Map deals to flat export format with UF fields
    const exportRows = result.deals.map((deal) => {
      const d = deal as Record<string, unknown>;
      return {
        ID: d.ID,
        TITLE: d.TITLE,
        STAGE_ID: d.STAGE_ID,
        STAGE_NAME: d.STAGE_ID,
        DATE_CREATE: d.DATE_CREATE,
        DATE_MODIFY: d.DATE_MODIFY,
        ASSIGNED_BY_ID: d.ASSIGNED_BY_ID,
        ASSIGNED_BY_NAME: d.ASSIGNED_BY_NAME || d.ASSIGNED_BY_ID,
        CONTACT_NAME: d.CONTACT_NAME || '',
        CONTACT_PHONE: d.CONTACT_PHONE || '',
        CONTACT_EMAIL: d.CONTACT_EMAIL || '',
        COMMENTS: d.COMMENTS,
        SOURCE_ID: d.SOURCE_ID,
        SOURCE_DESCRIPTION: d.SOURCE_DESCRIPTION,
        INN: d.UF_CRM_1605269817,
        SITE: d.UF_CRM_1696587488771,
        INTEGRATION: d.UF_CRM_1696587549662,
        CERT_DATE: d.UF_CRM_1780931799,
        TEST_DATE: d.UF_CRM_1780931836,
        LAUNCH_DATE: d.UF_CRM_1780931855,
        NEED_OK: d.UF_CRM_1777549192165,
        INSTALLED_OK: d.UF_CRM_1780931961,
        OK_TEST_DATE: d.UF_CRM_1780932003,
        SSL_STATUS: d.UF_CRM_1777549089614,
        OK_TYPE: d.UF_CRM_1777552279762,
        LAST_CONTACT: d.UF_CRM_1696588034362 || d.LAST_ACTIVITY_TIME,
      };
    });

    const csv = toCsv(exportRows);

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
        'Content-Disposition': `attachment; filename="deals-export-${requestedBank}-${new Date().toISOString().slice(0, 10)}.csv"`,
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