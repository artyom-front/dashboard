// src/app/(dashboard)/bank/page.tsx
'use client';

import { useState, useCallback } from 'react';
import { DealTable } from '@/domains/bank-dashboard/ui/DealTable';
import { exportToCsv } from '@/domains/bank-dashboard/lib/exportToCsv';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';

export default function BankPage() {
  const [data, setData] = useState<B24Deal[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 10, hasNext: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDeals = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/v1/deals?page=${pageNum}&perPage=10`, {
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

  // Загружаем при первом рендере через кнопку или авто
  // Можно вернуть useEffect, но без setState внутри — через IIFE
  useState(() => {
    loadDeals(1);
  });

  const handleExport = useCallback(() => {
    exportToCsv(data, `deals-page-${meta.page}.csv`);
  }, [data, meta.page]);

  if (loading && data.length === 0) return <div className="p-8">Загрузка...</div>;
  if (error) return <div className="p-8 text-red-600">Ошибка: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Заявки на облачные кассы</h1>
      <DealTable
        data={data}
        total={meta.total}
        page={meta.page}
        perPage={meta.perPage}
        hasNext={meta.hasNext}
        onPageChange={loadDeals}
        onExport={handleExport}
      />
    </div>
  );
}