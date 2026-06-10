// src\domains\bank-dashboard\model\filter.ts
import type { StageStat } from './types';

export type DashboardFilters = {
  bank: string;
  search: string;
  stageId: string;
  dateFrom: string;
  dateTo: string;
  sortOrder: 'ASC' | 'DESC';
};

function localDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDashboardFilters(
  params: URLSearchParams,
  defaultBank: string,
): DashboardFilters {
  return {
    bank: params.get('bank')?.trim() || defaultBank.trim(),
    search: params.get('search')?.trim() || '',
    stageId: params.get('stageId')?.trim() || '',
    dateFrom: params.get('dateFrom')?.trim() || '',
    dateTo: params.get('dateTo')?.trim() || '',
    sortOrder: params.get('sortOrder') === 'ASC' ? 'ASC' : 'DESC',
  };
}

export function buildDashboardSearchParams(
  filters: DashboardFilters,
  options?: {
    page?: number;
    perPage?: number;
  },
): URLSearchParams {
  const params = new URLSearchParams();

  params.set('bank', filters.bank);

  if (options?.page !== undefined) params.set('page', String(options.page));
  if (options?.perPage !== undefined) params.set('perPage', String(options.perPage));

  params.set('sortOrder', filters.sortOrder);

  if (filters.search) params.set('search', filters.search);
  if (filters.stageId) params.set('stageId', filters.stageId);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  return params;
}

export function countActiveFilters(filters: DashboardFilters, defaultBank?: string) {
  let count = 0;

  if (filters.search) count += 1;
  if (filters.stageId) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  if (filters.sortOrder === 'ASC') count += 1;
  if (defaultBank && filters.bank && filters.bank !== defaultBank) count += 1;

  return count;
}

export function humanizeStageId(stageId: string) {
  const normalized = stageId.replace(/^C\d+:/i, '').trim();
  const s = normalized.toUpperCase();

  if (!normalized) return 'Этап';
  if (s.includes('NEW')) return 'Новая';
  if (s.includes('WON')) return 'Успех';
  if (s.includes('LOSE') || s.includes('REJECT') || s.includes('CANCEL')) return 'Отказ';
  if (s.includes('PROCESS') || s.includes('WORK') || s.includes('PREP') || s.includes('REVIEW')) {
    return 'В работе';
  }

  return normalized;
}

export function prettyBankLabel(bank: string) {
  const cleaned = bank.trim();
  if (!cleaned) return 'Банк';

  const lower = cleaned.toLowerCase();

  if (lower === 'spb') return 'СПБ';
  if (lower === 'vtb') return 'ВТБ';

  return cleaned.toUpperCase();
}

export function presetToday() {
  const now = new Date();
  const value = localDateKey(now);
  return { dateFrom: value, dateTo: value };
}

export function presetWeek() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 6);

  return {
    dateFrom: localDateKey(from),
    dateTo: localDateKey(now),
  };
}

export function presetMonth() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);

  return {
    dateFrom: localDateKey(from),
    dateTo: localDateKey(now),
  };
}

export function toStageOptions(stageStats: StageStat[]) {
  return stageStats.map((item) => ({
    value: item.stageId,
    label: humanizeStageId(item.stageId),
    count: item.count,
  }));
}