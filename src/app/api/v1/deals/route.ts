// src/app/api/v1/deals/route.ts
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';
import { NextRequest } from 'next/server';

// src/app/api/v1/deals/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '10', 10);
  const stageId = searchParams.get('stageId') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;

  try {
    const result = await fetchDeals({ page, perPage, stageId, dateFrom, dateTo });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch deals', details: (error as Error).message },
      { status: 500 }
    );
  }
}