'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { B24Deal, DealDashboardSummary } from '@/domains/bank-dashboard/model/types';
import type { DashboardFilters } from '@/domains/bank-dashboard/model/filter';
import {
  buildDashboardSearchParams,
  parseDashboardFilters,
} from '@/domains/bank-dashboard/model/filter';
import { BankDashboardKpis } from '@/domains/bank-dashboard/ui/BankDashboardKpis';
import { CompactFilterBar } from '@/domains/bank-dashboard/ui/CompactFilterBar';
import { DealTable } from '@/domains/bank-dashboard/ui/DealTable';

type PageMeta = {
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
};

const EMPTY_SUMMARY: DealDashboardSummary = {
  total: 0,
  inWorkCount: 0,
  newCount: 0,
  todayCount: 0,
  stageStats: [],
  suggestedWorkingStageId: undefined,
};

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function BankDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  const availableBanks = session?.user?.banks ?? [];
  const defaultBank = availableBanks[0] ?? '';

  const filters = useMemo(
    () => parseDashboardFilters(params, defaultBank),
    [params, defaultBank],
  );

  const page = useMemo(() => toPositiveInt(params.get('page'), 1), [params]);
  const perPage = useMemo(() => toPositiveInt(params.get('perPage'), 10), [params]);

  const [data, setData] = useState<B24Deal[]>([]);
  const [meta, setMeta] = useState<PageMeta>({
    total: 0,
    page: 1,
    perPage: 10,
    hasNext: false,
  });
  const [summary, setSummary] = useState<DealDashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (status !== 'authenticated' || availableBanks.length === 0) return;

    const bankParam = searchParams.get('bank');

    if (!bankParam || !availableBanks.includes(bankParam)) {
      const next = new URLSearchParams(queryString);
      next.set('bank', defaultBank);
      next.set('page', '1');

      const nextQuery = next.toString();
      if (nextQuery !== queryString) {
        router.replace(`${pathname}?${nextQuery}`, { scroll: false });
      }
    }
  }, [availableBanks, defaultBank, pathname, queryString, router, searchParams, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !filters.bank) return;

    const controller = new AbortController();

    const loadDeals = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const apiQuery = buildDashboardSearchParams(filters, {
          page,
          perPage,
        });

        const res = await fetch(`/api/v1/deals?${apiQuery.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Failed to load deals (${res.status})`);
        }

        const result = await res.json();

        setData(Array.isArray(result.deals) ? result.deals : []);
        setMeta({
          total: Number(result.total ?? 0),
          page: Number(result.page ?? page),
          perPage: Number(result.perPage ?? perPage),
          hasNext: Boolean(result.hasNext),
        });
        setSummary(result.summary ?? EMPTY_SUMMARY);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setLoadError(error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadDeals();

    return () => controller.abort();
  }, [filters, page, perPage, status]);

  const replaceUrl = useCallback(
    (next: URLSearchParams) => {
      const nextQuery = next.toString();
      if (nextQuery === queryString) return;

      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    },
    [pathname, queryString, router],
  );

  const handleFilterChange = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const nextFilters: DashboardFilters = {
        ...filters,
        ...patch,
      };

      const next = buildDashboardSearchParams(nextFilters, {
        page: 1,
        perPage,
      });

      replaceUrl(next);
    },
    [filters, perPage, replaceUrl],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const next = buildDashboardSearchParams(filters, {
        page: nextPage,
        perPage,
      });

      replaceUrl(next);
    },
    [filters, perPage, replaceUrl],
  );

  const handleExport = useCallback(async () => {
    try {
      const query = buildDashboardSearchParams(filters, {
        page: 1,
        perPage,
      });

      const res = await fetch(`/api/v1/deals/export?${query.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to export deals');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'deals-export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to export deals');
    }
  }, [filters, perPage]);

  if (status === 'loading') {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="space-y-4">
          <div className="h-8 w-72 animate-pulse rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          {/* <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Дашборд
          </div> */}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Заявки на установку платежного модуля          
          </h1>
          {/* <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Компактный интерфейс с пастельной подложкой, мягкими акцентами и быстрыми фильтрами.
          </p> */}
        </div>

        <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          {filters.bank ? `Банк: ${filters.bank.toUpperCase()}` : 'Банк не выбран'}
        </div>
      </div>

      <div className="space-y-4">
        <BankDashboardKpis summary={summary} loading={loading} />

        <CompactFilterBar
          filters={filters}
          bankOptions={availableBanks}
          stageOptions={summary.stageStats}
          defaultBank={defaultBank}
          workingStageId={summary.suggestedWorkingStageId}
          loading={loading}
          onChange={handleFilterChange}
          onExport={handleExport}
        />

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Ошибка: {loadError}
          </div>
        ) : null}

        <DealTable
          data={data}
          total={meta.total}
          page={meta.page}
          perPage={meta.perPage}
          hasNext={meta.hasNext}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </div>
    </main>
  );
}