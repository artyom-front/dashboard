// src/domains/bank-dashboard/api/fetchDeals.ts
import { callBitrix } from '@/domains/shared/api/b24Client';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';
import { CLOUD_KASSA_CATEGORY_ID } from '@/domains/bank-dashboard/model/constants';

export interface FetchDealsParams {
  page?: number;
  perPage?: number;
  stageId?: string;
  bankFilter?: string;
  dateFrom?: string;  // YYYY-MM-DD
  dateTo?: string;    // YYYY-MM-DD
}

export interface FetchDealsResult {
  deals: B24Deal[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
}

// Кэш для текущей сессии (простой, без Redis)
let cachedDeals: B24Deal[] | null = null;
let cachedFilterKey: string | null = null;

// src/domains/bank-dashboard/api/fetchDeals.ts
export async function fetchDeals(params: FetchDealsParams = {}): Promise<FetchDealsResult> {
  const { page = 1, perPage = 10, stageId, bankFilter, dateFrom, dateTo } = params;

  const filterKey = `${stageId || 'all'}-${bankFilter || 'all'}`;

  if (filterKey !== cachedFilterKey) {
    cachedDeals = null;
    cachedFilterKey = filterKey;
  }

  if (!cachedDeals) {
    const filter: Record<string, unknown> = {
      CATEGORY_ID: CLOUD_KASSA_CATEGORY_ID,
    };

    if (dateFrom) {
  filter['>=DATE_CREATE'] = dateFrom;
}
if (dateTo) {
  filter['<=DATE_CREATE'] = dateTo;
}
    if (stageId) filter['STAGE_ID'] = stageId;
    if (bankFilter) filter['SOURCE_DESCRIPTION'] = bankFilter;

    // Загружаем ВСЕ сделки порциями по 50
    const allDeals: B24Deal[] = [];
    let start = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Максимум 500 сделок

    while (iterations < MAX_ITERATIONS) {
      const data = await callBitrix('crm.deal.list', {
        order: { DATE_MODIFY: 'DESC' },
        filter,
        select: [
          'ID', 'TITLE', 'STAGE_ID', 'CATEGORY_ID',
          'DATE_CREATE', 'DATE_MODIFY', 'ASSIGNED_BY_ID',
          'COMMENTS', 'SOURCE_ID', 'SOURCE_DESCRIPTION',
        ],
        start,
      });

      const batch: B24Deal[] = data.result || [];
      allDeals.push(...batch);

      console.log(`>>> Batch ${iterations + 1}: loaded ${batch.length}, total so far: ${allDeals.length}`);

      // Если вернулось меньше 50 — это последняя порция
      if (batch.length < 50 || !data.next) break;

      start = data.next;
      iterations++;
    }

    cachedDeals = allDeals;
    console.log('>>> Total loaded:', allDeals.length);
  }

  // Виртуальная пагинация
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const deals = cachedDeals.slice(start, end);

  return {
    deals,
    total: cachedDeals.length,
    page,
    perPage,
    hasNext: end < cachedDeals.length,
  };
}