// src/domains/bank-dashboard/api/fetchDeals.ts
import { callBitrix } from '@/domains/shared/api/b24Client';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';
import { CLOUD_KASSA_CATEGORY_ID } from '@/domains/bank-dashboard/model/constants';

export async function fetchDeals(): Promise<B24Deal[]> {
  const allDeals: B24Deal[] = [];
  let start = 0;

  while (true) {
    const params: Record<string, unknown> = {
      order: { DATE_MODIFY: 'DESC' },
      // Фильтр по воронке! Без этого получим сделки из всех отделов.
      filter: {
        CATEGORY_ID: CLOUD_KASSA_CATEGORY_ID,
      },
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
    };

    const data = await callBitrix('crm.deal.list', params);
    const deals: B24Deal[] = data.result || [];
    allDeals.push(...deals);

    if (!data.next) break;
    start = data.next;
  }

  return allDeals;
}