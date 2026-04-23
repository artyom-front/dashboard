// src/app/api/v1/deals/route.ts
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '10', 10);
  const stageId = searchParams.get('stageId') || undefined;
  const search = searchParams.get('search') || undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const sortBy = searchParams.get('sortBy') || 'DATE_CREATE'; // DATE_CREATE | TITLE
  const sortOrder = searchParams.get('sortOrder') || 'DESC'; // ASC | DESC

  try {
    const result = await fetchDeals({
      page,
      perPage,
      stageId,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch deals', details: (error as Error).message },
      { status: 500 }
    );
  }
}