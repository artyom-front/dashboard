// src\domains\bank-dashboard\api\fetchDeals.ts

import { callBitrix } from '@/domains/shared/api/b24Client';
import type {
  B24Deal,
  B24Contact,
  B24User,
  DealDashboardSummary,
  FetchDealsResult,
  StageStat,
} from '@/domains/bank-dashboard/model/types';
import {
  STAGE_MAP,
} from '@/domains/bank-dashboard/model/constants';

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

// Глобальный кэш пользователей
const USER_CACHE: Record<string, string> = {};

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
    for (const item of value) collectSearchText(item, acc, depth + 1);
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

async function loadUsers(userIds: string[]): Promise<Record<string, string>> {
  const missing = userIds.filter(id => !USER_CACHE[id]);

  if (missing.length > 0) {
    for (const id of missing) {
      try {
        const response = await callBitrix('user.get', { id: id });
        
        // callBitrix возвращает { result: [...] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users = (response as any)?.result as B24User[] | undefined;
        
        if (Array.isArray(users) && users.length > 0) {
          const user = users[0];
          const name = `${user.NAME || ''} ${user.LAST_NAME || ''}`.trim();
          if (name) USER_CACHE[id] = name;
        }
      } catch (e) {
        console.log(`Failed to load user ${id}:`, e);
      }
    }
  }

  for (const id of missing) {
    if (!USER_CACHE[id]) {
      USER_CACHE[id] = `ID:${id}`;
    }
  }

  const map: Record<string, string> = {};
  for (const id of userIds) map[id] = USER_CACHE[id] || `ID:${id}`;
  return map;
}

async function loadContacts(contactIds: string[]): Promise<Record<string, { name: string; phone: string; email: string }>> {
  const contactMap: Record<string, { name: string; phone: string; email: string }> = {};

  for (const id of contactIds) {
    try {
      const response = await callBitrix('crm.contact.get', { id });
      
      // callBitrix возвращает { result: contact }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contact = (response as any)?.result as B24Contact | undefined;

      if (contact && typeof contact === 'object') {
        const name = `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim();
        const phones = (contact.PHONE || []).map(p => p.VALUE).filter(Boolean).join(', ');
        const emails = (contact.EMAIL || []).map(e => e.VALUE).filter(Boolean).join(', ');
        contactMap[id] = { name, phone: phones, email: emails };
      }
    } catch (e) {
      contactMap[id] = { name: '', phone: '', email: '' };
    }
  }

  return contactMap;
}

async function enrichDeals(deals: B24Deal[]): Promise<B24Deal[]> {
  const userIds = [...new Set(deals.map(d => d.ASSIGNED_BY_ID).filter(Boolean))];
  const contactIds = [...new Set(deals.map(d => d.CONTACT_ID).filter(Boolean))];

  const [userMap, contactMap] = await Promise.all([
    loadUsers(userIds),
    loadContacts(contactIds),
  ]);

  for (const deal of deals) {
    const d = deal as B24Deal & Record<string, unknown>;
    if (deal.ASSIGNED_BY_ID && userMap[deal.ASSIGNED_BY_ID]) {
      d.ASSIGNED_BY_NAME = userMap[deal.ASSIGNED_BY_ID];
    }
    if (deal.CONTACT_ID && contactMap[deal.CONTACT_ID]) {
      const c = contactMap[deal.CONTACT_ID];
      d.CONTACT_NAME = c.name;
      d.CONTACT_PHONE = c.phone;
      d.CONTACT_EMAIL = c.email;
    }
  }

console.log('[enrichDeals] enriched deals sample:', deals[0]);

  return deals;
}

async function loadAllDeals(sortBy: 'DATE_CREATE' | 'TITLE', sortOrder: 'ASC' | 'DESC') {
  const allDeals: B24Deal[] = [];
  let start = 0;
  const batchSize = 50;
  let hasMore = true;
  const stageIds = Object.keys(STAGE_MAP);

  while (hasMore) {
    const data = await callBitrix('crm.deal.list', {
      order: { [sortBy]: sortOrder },
      filter: { '@STAGE_ID': stageIds },
      select: [
        '*',
        'UF_CRM_1605269817',
        'UF_CRM_1696587488771',
        'UF_CRM_1696587549662',
        'UF_CRM_1780931799',
        'UF_CRM_1780931836',
        'UF_CRM_1780931855',
        'UF_CRM_1777549192165',
        'UF_CRM_1780931961',
        'UF_CRM_1780932003',
        'UF_CRM_1777549089614',
        'UF_CRM_1777552279762',
        'UF_CRM_1696588034362',
      ],
      start,
      limit: batchSize,
    });


    const batch = ((data as { result?: unknown }).result as B24Deal[] | undefined) ?? [];
    allDeals.push(...batch);

    console.log('[loadAllDeals] batch sample:', batch[0]);
    console.log('[loadAllDeals] batch keys:', batch[0] ? Object.keys(batch[0] as Record<string, unknown>) : []);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      start += batchSize;
    }

    if (start > 50000) break;
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
  const pageDeals = stageFilteredDeals.slice(pageStart, pageEnd);

  const enrichedDeals = await enrichDeals(pageDeals);

  return {
    deals: enrichedDeals,
    total,
    page,
    perPage,
    hasNext: pageEnd < total,
    summary,
  };
}