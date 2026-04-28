'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';

type DealTableProps = {
  data: B24Deal[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

function getValue(deal: B24Deal, keys: string[]) {
  const record = deal as B24Deal & Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value);
      if (text.trim()) return text;
    }
  }

  return '';
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 6 }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm text-foreground">{value}</div>
    </div>
  );
}

export function DealTable({
  data,
  total,
  page,
  perPage,
  hasNext,
  loading = false,
  onPageChange,
}: DealTableProps) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const canPrev = page > 1 && !loading;
  const canNext = hasNext && !loading;

  const skeletonRows = useMemo(() => Array.from({ length: 8 }), []);

  return (
    <section className="card-surface soft-shadow overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Таблица клиентов</div>
          <div className="text-xs text-muted-foreground">
            Клик по строке раскрывает подробности
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Всего: <span className="font-medium text-foreground">{total}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-left">
          <thead className="border-b border-border bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-[14%] px-4 py-3 font-medium">№ заявки</th>
              <th className="w-[22%] px-4 py-3 font-medium">Клиент</th>
              <th className="w-[24%] px-4 py-3 font-medium">Организация</th>
              <th className="w-[14%] px-4 py-3 font-medium">ИНН</th>
              <th className="w-[13%] px-4 py-3 font-medium">Статус</th>
              <th className="w-[13%] px-4 py-3 font-medium">Дата</th>
            </tr>
          </thead>

          <tbody>
            {loading && data.length === 0 ? (
              skeletonRows.map((_, index) => <SkeletonRow key={index} />)
            ) : data.length > 0 ? (
              data.map((deal, index) => {
                const id = deal.ID;
                const expanded = expandedId === id;

                return (
                  <Fragment key={String(id ?? `${page}-${index}`)}>
                    <tr
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      onClick={() => setExpandedId(expanded ? null : id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(expanded ? null : id);
                        }
                      }}
                      className={[
                        'cursor-pointer border-b border-border transition-colors duration-200',
                        expanded ? 'bg-[#f10d30]/4' : 'hover:bg-muted/40',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            className={[
                              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                              expanded ? 'rotate-180' : '',
                            ].join(' ')}
                          />
                          <span className="truncate">{getValue(deal, ['dealNumber', 'ID', 'TITLE'])}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['fio', 'clientName', 'fullName', 'TITLE'])}>
                          {getValue(deal, ['fio', 'clientName', 'fullName', 'TITLE'])}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['organization', 'company', 'companyName'])}>
                          {getValue(deal, ['organization', 'company', 'companyName'])}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['inn', 'taxId'])}>
                          {getValue(deal, ['inn', 'taxId'])}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['stageName', 'STAGE_ID', 'STAGE_NAME'])}>
                          {getValue(deal, ['stageName', 'STAGE_ID', 'STAGE_NAME'])}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['DATE_CREATE', 'DATE_MODIFY'])}>
                          {getValue(deal, ['DATE_CREATE', 'DATE_MODIFY'])}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={6} className="p-0">
                        <div
                          className={[
                            'grid overflow-hidden transition-all duration-300 ease-out',
                            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0',
                          ].join(' ')}
                        >
                          <div className="overflow-hidden">
                            <div className="border-b border-border bg-muted/25 px-4 py-4">
                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <DetailCard label="ID" value={String(deal.ID ?? '')} />
                                <DetailCard label="Создана" value={getValue(deal, ['DATE_CREATE'])} />
                                <DetailCard label="Изменена" value={getValue(deal, ['DATE_MODIFY'])} />
                                <DetailCard label="Ответственный" value={getValue(deal, ['ASSIGNED_BY_ID'])} />
                                <DetailCard label="Категория" value={getValue(deal, ['CATEGORY_ID'])} />
                                <DetailCard label="Источник" value={getValue(deal, ['SOURCE_ID', 'SOURCE_DESCRIPTION'])} />
                              </div>

                              {getValue(deal, ['COMMENTS']) ? (
                                <div className="mt-3 rounded-xl border border-border bg-card p-3">
                                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Комментарий
                                  </div>
                                  <div className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                                    {getValue(deal, ['COMMENTS'])}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Нет заявок по выбранным условиям
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <button
          type="button"
          aria-disabled={!canPrev}
          onClick={() => {
            if (canPrev) onPageChange(page - 1);
          }}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Назад
        </button>

        <div className="text-sm text-muted-foreground">
          Страница {page} из {totalPages}
        </div>

        <button
          type="button"
          aria-disabled={!canNext}
          onClick={() => {
            if (canNext) onPageChange(page + 1);
          }}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Вперёд
        </button>
      </div>
    </section>
  );
}