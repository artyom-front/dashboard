// src/domains/bank-dashboard/api/fetchDeals.ts
import { callBitrix } from '@/domains/shared/api/b24Client';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';
import { CLOUD_KASSA_CATEGORY_ID } from '@/domains/bank-dashboard/model/constants';

export interface FetchDealsParams {
 page?: number;
  perPage?: number;
  stageId?: string;
  bankFilter?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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
    const {
    page = 1,
    perPage = 10,
    stageId,
    bankFilter,
    search,
    dateFrom,
    dateTo,
    sortBy = 'DATE_CREATE',
    sortOrder = 'DESC',
  } = params;

 const filterKey = `${stageId || 'all'}-${bankFilter || 'all'}-${dateFrom || 'all'}-${dateTo || 'all'}-${search || 'all'}-${sortBy}-${sortOrder}`;

  if (filterKey !== cachedFilterKey) {
    cachedDeals = null;
    cachedFilterKey = filterKey;
  }

  console.log('>>> filterKey:', filterKey)

  if (!cachedDeals) {
    const filter: Record<string, unknown> = {
      CATEGORY_ID: CLOUD_KASSA_CATEGORY_ID,
    };

    if (stageId) filter['STAGE_ID'] = stageId;

    const data = await callBitrix('crm.deal.list', {
      order: { [sortBy]: sortOrder },
      filter,
      select: [
        'ID', 'TITLE', 'STAGE_ID', 'CATEGORY_ID',
        'DATE_CREATE', 'DATE_MODIFY', 'ASSIGNED_BY_ID',
        'COMMENTS', 'SOURCE_ID', 'SOURCE_DESCRIPTION',
      ],
    });

    let deals: B24Deal[] = data.result || [];

    // Фильтр по дате (если Б24 не отфильтровал)
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      deals = deals.filter((d) => new Date(d.DATE_CREATE).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      deals = deals.filter((d) => new Date(d.DATE_CREATE).getTime() <= to);
    }

    // Поиск по тексту (TITLE, COMMENTS, SOURCE_DESCRIPTION)
    if (search) {
      const q = search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.TITLE.toLowerCase().includes(q) ||
          (d.COMMENTS && d.COMMENTS.toLowerCase().includes(q)) ||
          (d.SOURCE_DESCRIPTION && d.SOURCE_DESCRIPTION.toLowerCase().includes(q))
      );
    }

    cachedDeals = deals;
  }

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