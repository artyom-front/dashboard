// src/app/api/v1/deals/route.ts
import { fetchDeals } from '@/domains/bank-dashboard/api/fetchDeals';

export async function GET() {
  try {
    const deals = await fetchDeals();
    return Response.json({
      count: deals.length,
      firstDeal: deals[0] || null,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}