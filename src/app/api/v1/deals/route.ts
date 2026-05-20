import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { auditAccessDenied } from '@/lib/audit';
import { canAccessBank, getAllowedUserByEmail } from '@/lib/auth/allowlist';
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';

type SortBy = 'DATE_CREATE' | 'TITLE';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const access = getAllowedUserByEmail(email);

  if (!email) {
    auditAccessDenied({
      email,
      reason: 'unauthorized',
      resource: 'api.v1.deals',
    });

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!access) {
    auditAccessDenied({
      email,
      reason: 'allowlist_miss',
      resource: 'api.v1.deals',
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
      resource: 'api.v1.deals',
      bank: requestedBank || undefined,
    });

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const perPage = Math.max(1, parseInt(searchParams.get('perPage') || '10', 10) || 10);

  const stageId = searchParams.get('stageId')?.trim() || undefined;
  const search = searchParams.get('search')?.trim() || undefined;
  const dateFrom = searchParams.get('dateFrom')?.trim() || undefined;
  const dateTo = searchParams.get('dateTo')?.trim() || undefined;

  const sortBy: SortBy = searchParams.get('sortBy') === 'TITLE' ? 'TITLE' : 'DATE_CREATE';

  const sortOrderParam = searchParams.get('sortOrder');
  const sortOrder: 'ASC' | 'DESC' | undefined =
    sortOrderParam === 'ASC' || sortOrderParam === 'DESC'
      ? sortOrderParam
      : undefined;

  try {
    const result = await fetchDeals({
      bank: requestedBank,
      page,
      perPage,
      stageId,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 },
    );
  }
}