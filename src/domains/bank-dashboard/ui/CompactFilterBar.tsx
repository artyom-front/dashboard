'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Loader2, Building2, Calendar, Filter, X } from 'lucide-react';
import type { DashboardFilters } from '@/domains/bank-dashboard/model/filter';
import type { StageStat } from '@/domains/bank-dashboard/model/types';
import { STAGE_MAP } from '@/domains/bank-dashboard/model/constants';

interface CompactFilterBarProps {
  filters: DashboardFilters; bankOptions: string[]; stageOptions: StageStat[];
  defaultBank: string; workingStageId?: string; loading?: boolean; isExporting?: boolean;
  onChange: (patch: Partial<DashboardFilters>) => void; onExport: () => void;
}

const BANK_NAMES: Record<string, string> = { bspb: 'Банк СПБ', sber: 'СберБанк', vtb: 'ВТБ', alfa: 'Альфа-Банк', tinkoff: 'Т-Банк', raiff: 'Райффайзен', otkritie: 'Открытие', psb: 'Промсвязьбанк' };

export function CompactFilterBar({ filters, bankOptions, stageOptions, defaultBank, workingStageId, loading = false, isExporting = false, onChange, onExport }: CompactFilterBarProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchSubmit = useCallback(() => { onChange({ search: searchInput.trim() || undefined }); }, [searchInput, onChange]);
  const handleBankChange = useCallback((bank: string) => { if (bank && bank !== filters.bank) router.push(`/bank/${bank}`); }, [filters.bank, router]);
  const hasActiveFilters = filters.search || filters.stageId || filters.dateFrom || filters.dateTo;
  const clearFilters = useCallback(() => { setSearchInput(''); onChange({ search: undefined, stageId: undefined, dateFrom: undefined, dateTo: undefined }); }, [onChange]);

  return (
    <div className="card-surface soft-shadow space-y-3 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Поиск по клиенту, ИНН, сайту..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }} disabled={loading} className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-[#f10d30] disabled:opacity-50" />
            {searchInput && <button onClick={() => { setSearchInput(''); onChange({ search: undefined }); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition" type="button"><X className="h-4 w-4" /></button>}
          </div>
          {bankOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <select value={filters.bank || defaultBank} onChange={(e) => handleBankChange(e.target.value)} disabled={loading} className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-[#f10d30] disabled:opacity-50 cursor-pointer">
                {bankOptions.map((b) => <option key={b} value={b}>{BANK_NAMES[b.toLowerCase()] || b.toUpperCase()}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && <button onClick={clearFilters} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98] disabled:opacity-50 cursor-pointer" type="button"><Filter className="h-4 w-4" />Сбросить</button>}
          {/* 🔴 КНОПКА ЭКСПОРТА СО СПИННЕРОМ */}
          <button onClick={onExport} disabled={loading || isExporting} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed ${isExporting ? 'bg-[#10385c] cursor-wait' : 'bg-[#f10d30] hover:bg-[#d10a28] hover:shadow-lg cursor-pointer'}`} type="button">
            {isExporting ? <><Loader2 className="h-4 w-4 animate-spin" />Экспорт...</> : <><Download className="h-4 w-4" />Экспорт CSV</>}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={filters.stageId || ''} onChange={(e) => onChange({ stageId: e.target.value || undefined })} disabled={loading} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-[#f10d30] disabled:opacity-50 cursor-pointer">
            <option value="">Все стадии</option>
            {stageOptions.map((s) => <option key={s.stageId} value={s.stageId}>{STAGE_MAP[s.stageId] || s.stageId} ({s.count})</option>)}
          </select>
        </div>
        {workingStageId && workingStageId !== filters.stageId && <button onClick={() => onChange({ stageId: workingStageId })} disabled={loading} className="h-9 rounded-lg border border-[#2FC6F6]/30 bg-[#2FC6F6]/10 px-3 text-sm text-[#2FC6F6] transition hover:bg-[#2FC6F6]/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer" type="button">В работе</button>}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input type="date" value={filters.dateFrom || ''} onChange={(e) => onChange({ dateFrom: e.target.value || undefined })} disabled={loading} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-[#f10d30] disabled:opacity-50" />
          <span className="text-sm text-muted-foreground">—</span>
          <input type="date" value={filters.dateTo || ''} onChange={(e) => onChange({ dateTo: e.target.value || undefined })} disabled={loading} className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-[#f10d30] disabled:opacity-50" />
        </div>
      </div>
    </div>
  );
}