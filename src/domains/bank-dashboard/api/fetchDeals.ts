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

export async function fetchDeals(
  params: FetchDealsParams = {}
): Promise<FetchDealsResult> {
  const {
    page = 1,
    perPage = 10,
    stageId,
    search,
    dateFrom,
    dateTo,
    sortBy = 'DATE_CREATE',
    sortOrder = 'DESC',
  } = params;

  const filter: Record<string, unknown> = {
    CATEGORY_ID: CLOUD_KASSA_CATEGORY_ID,
  };

  if (stageId) {
    filter['STAGE_ID'] = stageId;
  }

  if (dateFrom) {
    filter['>=DATE_CREATE'] = dateFrom;
  }

  if (dateTo) {
    filter['<=DATE_CREATE'] = dateTo;
  }

  if (search) {
    filter['%TITLE'] = search;
  }

  const allDeals: B24Deal[] = [];
  let start = 0;
  const batchSize = 50; // Bitrix24 max per request
  let hasMore = true;

  while (hasMore) {
    let data;
    try {
      data = await callBitrix('crm.deal.list', {
        order: { [sortBy]: sortOrder },
        filter,
        select: [
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
        ],
        start,
        limit: batchSize,
      });
    } catch (err) {
      console.error('[fetchDeals] Bitrix API call failed:', err);
      throw new Error('Failed to load deals from CRM');
    }

    const batch: B24Deal[] = (data.result as B24Deal[]) || [];
    allDeals.push(...batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      start += batchSize;
    }

    if (start > 50000) {
      console.warn('[fetchDeals] Safety break: exceeded 50000 items');
      break;
    }
  }

  // Client-side text search fallback (if Bitrix %TITLE is not sufficient)
  let filteredDeals = allDeals;
  if (search) {
    const q = search.toLowerCase();
    filteredDeals = allDeals.filter(
      (d) =>
        d.TITLE.toLowerCase().includes(q) ||
        (d.COMMENTS && d.COMMENTS.toLowerCase().includes(q)) ||
        (d.SOURCE_DESCRIPTION &&
          d.SOURCE_DESCRIPTION.toLowerCase().includes(q))
    );
  }

  const total = filteredDeals.length;
  const pageStart = (page - 1) * perPage;
  const pageEnd = pageStart + perPage;
  const deals = filteredDeals.slice(pageStart, pageEnd);

  return {
    deals,
    total,
    page,
    perPage,
    hasNext: pageEnd < total,
  };
}