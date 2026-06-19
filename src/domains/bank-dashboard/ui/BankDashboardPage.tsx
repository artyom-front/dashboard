'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { B24Deal, DealDashboardSummary } from '@/domains/bank-dashboard/model/types';
import type { DashboardFilters } from '@/domains/bank-dashboard/model/filter';
import { buildDashboardSearchParams, parseDashboardFilters } from '@/domains/bank-dashboard/model/filter';
import { BankDashboardKpis } from '@/domains/bank-dashboard/ui/BankDashboardKpis';
import { CompactFilterBar } from '@/domains/bank-dashboard/ui/CompactFilterBar';
import { DealTable } from '@/domains/bank-dashboard/ui/DealTable';
import { ConsultationModal } from '@/domains/bank-dashboard/ui/ConsultationModal';
import { PlusCircle } from 'lucide-react';

type PageMeta = { total: number; page: number; perPage: number; hasNext: boolean };
const EMPTY_SUMMARY: DealDashboardSummary = { total: 0, inWorkCount: 0, newCount: 0, todayCount: 0, stageStats: [], suggestedWorkingStageId: undefined };

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

interface BankDashboardPageProps { bankCode: string; }

export function BankDashboardPage({ bankCode }: BankDashboardPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  const availableBanks = session?.user?.banks ?? [];
  const normalizedBank = (bankCode || '').trim().toLowerCase();
  const hasAccess = normalizedBank ? availableBanks.includes(normalizedBank) : false;

  const filters = useMemo(() => parseDashboardFilters(params, normalizedBank), [params, normalizedBank]);
  const page = useMemo(() => toPositiveInt(params.get('page'), 1), [params]);
  const perPage = useMemo(() => toPositiveInt(params.get('perPage'), 10), [params]);

  const [data, setData] = useState<B24Deal[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ total: 0, page: 1, perPage: 10, hasNext: false });
  const [summary, setSummary] = useState<DealDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isConsultOpen, setIsConsultOpen] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !hasAccess || !normalizedBank) return;
    const controller = new AbortController();

    const loadDeals = async () => {
      setLoading(true); setLoadError('');
      try {
        const apiQuery = buildDashboardSearchParams(filters, { page, perPage });
        const res = await fetch(`/api/v1/deals?${apiQuery.toString()}`, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) throw new Error(`Ошибка загрузки (${res.status})`);
        const result = await res.json();
        setData(Array.isArray(result.deals) ? result.deals : []);
        setMeta({ total: Number(result.total ?? 0), page: Number(result.page ?? page), perPage: Number(result.perPage ?? perPage), hasNext: Boolean(result.hasNext) });
        setSummary(result.summary ?? EMPTY_SUMMARY);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setLoadError(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadDeals();
    return () => controller.abort();
  }, [filters, page, perPage, status, hasAccess, normalizedBank]);

  const replaceUrl = useCallback((next: URLSearchParams) => {
    const nextQuery = next.toString();
    if (nextQuery === queryString) return;
    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [pathname, queryString, router]);

  const handleFilterChange = useCallback((patch: Partial<DashboardFilters>) => {
    const nextFilters: DashboardFilters = { ...filters, ...patch };
    const next = buildDashboardSearchParams(nextFilters, { page: 1, perPage });
    replaceUrl(next);
  }, [filters, perPage, replaceUrl]);

  const handlePageChange = useCallback((nextPage: number) => {
    const next = buildDashboardSearchParams(filters, { page: nextPage, perPage });
    replaceUrl(next);
  }, [filters, perPage, replaceUrl]);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true); setLoadError('');
    try {
      const query = buildDashboardSearchParams(filters, { page: 1, perPage });
      const res = await fetch(`/api/v1/deals/export?${query.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Ошибка экспорта');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deals-${normalizedBank}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  }, [filters, perPage, isExporting, normalizedBank]);

  if (status === 'loading') return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="space-y-4">
        <div className="h-8 w-72 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/60" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    </main>
  );

  if (!hasAccess) return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900/30 dark:bg-red-950/20">
        <div className="text-lg font-semibold text-red-700 dark:text-red-400">Доступ запрещён</div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">У вас нет доступа к банку <strong>{normalizedBank.toUpperCase()}</strong>.</p>
      </div>
    </main>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
      {/* ===== HEADER ===== */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Заявки на установку платежного модуля</h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* 🔴 КНОПКА КОНСУЛЬТАЦИИ */}
          <button onClick={() => setIsConsultOpen(true)} type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f10d30] hover:bg-[#d10a28] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#f10d30]/20 hover:shadow-xl hover:shadow-[#f10d30]/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer">
            <PlusCircle className="h-5 w-5" />
            <span>Консультация</span>
          </button>
         
        </div>
      </div>

      <div className="space-y-4">
        <BankDashboardKpis summary={summary} loading={loading} />
        <CompactFilterBar filters={filters} bankOptions={availableBanks} stageOptions={summary.stageStats} defaultBank={normalizedBank} workingStageId={summary.suggestedWorkingStageId} loading={loading} isExporting={isExporting} onChange={handleFilterChange} onExport={handleExport} />
        {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20">Ошибка: {loadError}</div> : null}
        <DealTable data={data} total={meta.total} page={meta.page} perPage={meta.perPage} hasNext={meta.hasNext} loading={loading} onPageChange={handlePageChange} />
      </div>

      <ConsultationModal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} bankCode={normalizedBank} />
    </main>
  );
}