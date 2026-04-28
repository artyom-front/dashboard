import { callBitrix } from '@/domains/shared/api/b24Client';
import type {
  B24Deal,
  DealDashboardSummary,
  FetchDealsResult,
  StageStat,
} from '@/domains/bank-dashboard/model/types';
import { CLOUD_KASSA_CATEGORY_ID } from '@/domains/bank-dashboard/model/constants';

export interface FetchDealsParams {
  bank?: string;
  page?: number;
  perPage?: number;
  stageId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'DATE_CREATE' | 'TITLE';
  sortOrder?: 'ASC' | 'DESC';
}

function extractDateKey(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 10) return null;
  return value.slice(0, 10);
}

function localTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function classifyStageId(stageId: string): 'new' | 'work' | 'closed' | 'other' {
  const s = stageId.toLowerCase();

  if (/(won|success|done|finish|close|closed|reject|lose|lost|cancel|fail)/.test(s)) {
    return 'closed';
  }

  if (/(new|start|incoming|draft|open)/.test(s)) {
    return 'new';
  }

  if (/(work|process|progress|active|prepare|prepar|review|check|wait|analysis|handling)/.test(s)) {
    return 'work';
  }

  return 'other';
}

function collectSearchText(value: unknown, acc: string[], depth = 0): void {
  if (value == null || depth > 2) return;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    acc.push(String(value));
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSearchText(item, acc, depth + 1);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectSearchText(item, acc, depth + 1);
    }
  }
}

function dealMatchesSearch(deal: B24Deal, search?: string): boolean {
  if (!search?.trim()) return true;

  const query = search.trim().toLowerCase();
  const values: string[] = [];
  collectSearchText(deal, values);

  const haystack = values.join(' ').toLowerCase();
  return haystack.includes(query);
}

function dealMatchesDateRange(deal: B24Deal, dateFrom?: string, dateTo?: string): boolean {
  const createdAt = extractDateKey(deal.DATE_CREATE);
  if (!createdAt) return true;

  if (dateFrom && createdAt < dateFrom) return false;
  if (dateTo && createdAt > dateTo) return false;

  return true;
}

function summarizeDeals(deals: B24Deal[]): DealDashboardSummary {
  const today = localTodayKey();
  const stageCounts = new Map<string, number>();

  let inWorkCount = 0;
  let newCount = 0;
  let todayCount = 0;

  for (const deal of deals) {
    const stageId = String(deal.STAGE_ID ?? '').trim() || 'UNKNOWN';
    const classification = classifyStageId(stageId);
    const createdKey = extractDateKey(deal.DATE_CREATE);

    stageCounts.set(stageId, (stageCounts.get(stageId) ?? 0) + 1);

    if (classification === 'work') inWorkCount += 1;
    if (classification === 'new') newCount += 1;
    if (createdKey === today) todayCount += 1;
  }

  const stageStats: StageStat[] = Array.from(stageCounts.entries())
    .map(([stageId, count]) => ({ stageId, count }))
    .sort((a, b) => b.count - a.count || a.stageId.localeCompare(b.stageId));

  const suggestedWorkingStageId =
    stageStats.find((item) => classifyStageId(item.stageId) === 'work')?.stageId ??
    stageStats.find((item) => classifyStageId(item.stageId) !== 'closed')?.stageId;

  return {
    total: deals.length,
    inWorkCount,
    newCount,
    todayCount,
    stageStats,
    suggestedWorkingStageId,
  };
}

async function loadAllDeals(sortBy: 'DATE_CREATE' | 'TITLE', sortOrder: 'ASC' | 'DESC') {
  const allDeals: B24Deal[] = [];
  let start = 0;
  const batchSize = 50;
  let hasMore = true;

  while (hasMore) {
    const data = await callBitrix('crm.deal.list', {
      order: { [sortBy]: sortOrder },
      filter: {
        CATEGORY_ID: CLOUD_KASSA_CATEGORY_ID,
      },
      select: ['*', 'UF_*'],
      start,
      limit: batchSize,
    });

    const batch = ((data as { result?: unknown }).result as B24Deal[] | undefined) ?? [];
    allDeals.push(...batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      start += batchSize;
    }

    if (start > 50000) {
      break;
    }
  }

  return allDeals;
}

export async function fetchDeals(
  params: FetchDealsParams = {},
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

  const allDeals = await loadAllDeals(sortBy, sortOrder);

  const baseDeals = allDeals.filter(
    (deal) =>
      dealMatchesSearch(deal, search) &&
      dealMatchesDateRange(deal, dateFrom, dateTo),
  );

  const summary = summarizeDeals(baseDeals);

  const stageFilteredDeals = stageId
    ? baseDeals.filter((deal) => String(deal.STAGE_ID ?? '') === stageId)
    : baseDeals;

  const total = stageFilteredDeals.length;
  const pageStart = (page - 1) * perPage;
  const pageEnd = pageStart + perPage;
  const deals = stageFilteredDeals.slice(pageStart, pageEnd);

  return {
    deals,
    total,
    page,
    perPage,
    hasNext: pageEnd < total,
    summary,
  };
}