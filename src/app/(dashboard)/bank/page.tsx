'use client';

import { useState, useCallback, useEffect } from 'react';
import { DealTable } from '@/domains/bank-dashboard/ui/DealTable';
import { DealFilters } from '@/domains/bank-dashboard/ui/DealFilters';
import { ThemeToggle } from '@/domains/shared/ui/ThemeToggle';
import { exportToCsv } from '@/domains/bank-dashboard/lib/exportToCsv';
import { Button } from '@/components/ui/button';  // ← ДОБАВИЛИ
import type { B24Deal } from '@/domains/bank-dashboard/model/types';
import { error } from 'console';

export default function BankPage() {
  const [data, setData] = useState<B24Deal[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 10, hasNext: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    stageId: '',
    dateFrom: '',
    dateTo: '',
    sortOrder: 'DESC' as 'DESC' | 'ASC',
  });

  const loadDeals = useCallback(async (
    pageNum: number,
    currentFilters: typeof filters
  ) => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      page: String(pageNum),
      perPage: '10',
      sortOrder: currentFilters.sortOrder,
    });
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.stageId) params.set('stageId', currentFilters.stageId);
    if (currentFilters.dateFrom) params.set('dateFrom', currentFilters.dateFrom);
    if (currentFilters.dateTo) params.set('dateTo', currentFilters.dateTo);

    try {
      const res = await fetch(`/api/v1/deals?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load');

      const result = await res.json();
      setData(result.deals);
      setMeta({
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        hasNext: result.hasNext,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ← ВЕРНУЛИ useEffect вместо вызова в render
  useEffect(() => {
    loadDeals(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Только при монтировании

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    loadDeals(1, newFilters);
  }, [loadDeals]);

  const handlePageChange = useCallback((page: number) => {
    loadDeals(page, filters);
  }, [loadDeals, filters]);

  const handleExport = useCallback(() => {
    exportToCsv(data, `deals-page-${meta.page}.csv`);
  }, [data, meta.page]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Первый ККМ</h1>
          <span className="text-sm text-muted-foreground">Банковский дашборд</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Заявки на облачные кассы</h2>
          <Button variant="outline" onClick={handleExport}>
            📥 CSV
          </Button>
        </div>

        <DealFilters onFilterChange={handleFilterChange} />

        {loading && data.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        )}
        {error && <div className="p-4 text-red-600 bg-red-50 rounded">Ошибка: {error}</div>}

        {data.length > 0 && (
          <DealTable
            data={data}
            total={meta.total}
            page={meta.page}
            perPage={meta.perPage}
            hasNext={meta.hasNext}
            onPageChange={handlePageChange}
          />
        )}
      </main>
    </div>
  );
}