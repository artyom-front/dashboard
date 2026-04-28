'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Download, Search, X } from 'lucide-react';
import type { DashboardFilters } from '@/domains/bank-dashboard/model/filter';
import {
  countActiveFilters,
  humanizeStageId,
  presetMonth,
  presetToday,
  presetWeek,
  prettyBankLabel,
} from '@/domains/bank-dashboard/model/filter';
import type { StageStat } from '@/domains/bank-dashboard/model/types';

type CompactFilterBarProps = {
  filters: DashboardFilters;
  bankOptions: string[];
  stageOptions: StageStat[];
  defaultBank: string;
  workingStageId?: string;
  loading?: boolean;
  onChange: (patch: Partial<DashboardFilters>) => void;
  onExport: () => void;
};

function Chip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
    >
      <span className="font-medium text-muted-foreground">{label}:</span>
      <span className="max-w-56 truncate">{value}</span>
      <X className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function SearchField({
  initialValue,
  onCommit,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialValue);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    if (draft === initialValue) {
      return;
    }

    const timer = window.setTimeout(() => {
      onCommitRef.current(draft);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draft, initialValue]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Поиск по заявкам..."
        className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-[#f10d30] focus:ring-0"
      />
    </div>
  );
}

export function CompactFilterBar({
  filters,
  bankOptions,
  stageOptions,
  defaultBank,
  workingStageId,
  loading,
  onChange,
  onExport,
}: CompactFilterBarProps) {
  const activeCount = useMemo(
    () => countActiveFilters(filters, defaultBank),
    [filters, defaultBank],
  );

  const quickPreset = (type: 'today' | 'week' | 'month') => {
    const preset =
      type === 'today' ? presetToday() : type === 'week' ? presetWeek() : presetMonth();

    onChange(preset);
  };

  const chips = useMemo(() => {
    const result: Array<{
      key: string;
      label: string;
      value: string;
      onRemove: () => void;
    }> = [];

    if (filters.bank && defaultBank && filters.bank !== defaultBank) {
      result.push({
        key: 'bank',
        label: 'Банк',
        value: prettyBankLabel(filters.bank),
        onRemove: () => onChange({ bank: defaultBank }),
      });
    }

    if (filters.search) {
      result.push({
        key: 'search',
        label: 'Поиск',
        value: filters.search,
        onRemove: () => onChange({ search: '' }),
      });
    }

    if (filters.stageId) {
      result.push({
        key: 'stageId',
        label: 'Статус',
        value: humanizeStageId(filters.stageId),
        onRemove: () => onChange({ stageId: '' }),
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      result.push({
        key: 'period',
        label: 'Период',
        value: `${filters.dateFrom || '…'} → ${filters.dateTo || '…'}`,
        onRemove: () => onChange({ dateFrom: '', dateTo: '' }),
      });
    }

    if (filters.sortOrder === 'ASC') {
      result.push({
        key: 'sortOrder',
        label: 'Сортировка',
        value: 'Сначала старые',
        onRemove: () => onChange({ sortOrder: 'DESC' }),
      });
    }

    return result;
  }, [defaultBank, filters, onChange]);

  const canUseWorkingStage = Boolean(workingStageId);

  return (
    <section className="card-surface soft-shadow overflow-hidden border-[#10385c]/10">
      <div className="border-b border-border bg-gradient-to-r from-[#f10d30]/6 to-[#10385c]/6 px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Фильтры</h2>
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                Активно: {activeCount}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Компактный поиск, период, статус и сортировка без лишней высоты.
            </p>
          </div>

          <button
            type="button"
            onClick={onExport}
            aria-disabled={Boolean(loading)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f10d30] px-3 py-2 text-sm font-medium text-white transition hover:opacity-95 aria-disabled:cursor-not-allowed aria-disabled:opacity-70"
          >
            <Download className="h-4 w-4" />
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,2fr)_180px_190px_230px_150px_150px]">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span
                title="Ищет по ФИО, компании, ИНН, номеру заявки и комментариям"
                className="inline-flex items-center gap-1"
              >
                Универсальный поиск
                <span className="text-[#f10d30]">?</span>
              </span>
            </span>

            <SearchField
              key={filters.search}
              initialValue={filters.search}
              onCommit={(search) => onChange({ search })}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Банк
            </span>

            {bankOptions.length > 1 ? (
              <select
                value={filters.bank}
                onChange={(e) => onChange({ bank: e.target.value })}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#10385c] focus:ring-0"
              >
                {bankOptions.map((bank) => (
                  <option key={bank} value={bank}>
                    {prettyBankLabel(bank)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex h-10 items-center rounded-xl border border-border bg-muted/35 px-3 text-sm text-muted-foreground">
                {prettyBankLabel(filters.bank || defaultBank)}
              </div>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Статус
            </span>

            <select
              value={filters.stageId}
              onChange={(e) => onChange({ stageId: e.target.value })}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#10385c] focus:ring-0"
            >
              <option value="">Все статусы</option>
              {stageOptions.map((stage) => (
                <option key={stage.stageId} value={stage.stageId}>
                  {humanizeStageId(stage.stageId)} · {stage.count}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Период
              </span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChange({ dateFrom: e.target.value })}
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#10385c] focus:ring-0"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChange({ dateTo: e.target.value })}
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#10385c] focus:ring-0"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Сортировка
            </span>

            <select
              value={filters.sortOrder}
              onChange={(e) =>
                onChange({
                  sortOrder: e.target.value === 'ASC' ? 'ASC' : 'DESC',
                })
              }
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-[#f10d30] focus:ring-0"
            >
              <option value="DESC">Сначала новые</option>
              <option value="ASC">Сначала старые</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                if (canUseWorkingStage) {
                  onChange({ stageId: workingStageId! });
                }
              }}
              aria-disabled={!canUseWorkingStage}
              className={[
                'h-10 w-full rounded-xl border px-3 text-sm font-medium transition',
                canUseWorkingStage
                  ? 'border-[#10385c]/20 bg-[#10385c]/8 text-[#10385c] hover:bg-[#10385c]/12'
                  : 'cursor-not-allowed border-border bg-muted/35 text-muted-foreground',
              ].join(' ')}
            >
              В работе
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => quickPreset('today')}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Сегодня
          </button>
          <button
            type="button"
            onClick={() => quickPreset('week')}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Неделя
          </button>
          <button
            type="button"
            onClick={() => quickPreset('month')}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            Месяц
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {chips.length > 0 ? (
            chips.map(({ key, label, value, onRemove }) => (
              <Chip key={key} label={label} value={value} onRemove={onRemove} />
            ))
          ) : (
            <div className="text-xs text-muted-foreground">Активных фильтров нет.</div>
          )}
        </div>
      </div>
    </section>
  );
}