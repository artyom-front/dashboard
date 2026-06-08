'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';
import { STAGE_STATUS_MAP } from '@/domains/bank-dashboard/model/constants';

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
    if (typeof value === 'boolean') {
      return value ? 'Да' : 'Нет';
    }
  }
  return '';
}

function formatDate(value: string | undefined | null): string {
  if (!value || value.length < 10) return '';
  return value.slice(0, 10).split('-').reverse().join('.');
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: 9 }).map((_, index) => (
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

function StatusBadge({ stageId }: { stageId: string }) {
  const status = STAGE_STATUS_MAP[stageId];
  if (!status) {
    return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">{stageId}</span>;
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}>
      {status.status}
    </span>
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
              <th className="w-[8%] px-4 py-3 font-medium">№</th>
              <th className="w-[12%] px-4 py-3 font-medium">Дата</th>
              <th className="w-[16%] px-4 py-3 font-medium">Клиент</th>
              <th className="w-[12%] px-4 py-3 font-medium">ИНН</th>
              <th className="w-[14%] px-4 py-3 font-medium">Статус</th>
              <th className="w-[12%] px-4 py-3 font-medium">Сертификат</th>
              <th className="w-[10%] px-4 py-3 font-medium">Тест</th>
              <th className="w-[10%] px-4 py-3 font-medium">Запуск</th>
              <th className="w-[6%] px-4 py-3 font-medium text-center">☁️</th>
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
                          <span className="truncate">{String(deal.ID ?? '')}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        {formatDate(deal.DATE_CREATE)}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={deal.TITLE}>
                          {deal.TITLE}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        <div className="truncate" title={getValue(deal, ['UF_CRM_1584459530383'])}>
                          {getValue(deal, ['UF_CRM_1584459530383'])}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top">
                        <StatusBadge stageId={deal.STAGE_ID} />
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        {formatDate(getValue(deal, ['UF_CRM_1780931799'])) || '—'}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        {formatDate(getValue(deal, ['UF_CRM_1780931836'])) || '—'}
                      </td>

                      <td className="px-4 py-3 align-top text-sm text-foreground">
                        {formatDate(getValue(deal, ['UF_CRM_1780931855'])) || '—'}
                      </td>

                      <td className="px-4 py-3 align-top text-center text-sm text-foreground">
                        {getValue(deal, ['UF_CRM_1780931961']) === 'Да' ? '✅' : '—'}
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={9} className="p-0">
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
                                <DetailCard label="Создана" value={formatDate(deal.DATE_CREATE)} />
                                <DetailCard label="Изменена" value={formatDate(deal.DATE_MODIFY)} />
                                <DetailCard label="Ответственный" value={getValue(deal, ['ASSIGNED_BY_ID'])} />
                                <DetailCard label="Сайт" value={getValue(deal, ['UF_CRM_1584459905775'])} />
                                <DetailCard label="CMS / Интеграция" value={getValue(deal, ['UF_CRM_1584459915897'])} />
                                <DetailCard label="Облачная касса (старая)" value={getValue(deal, ['UF_CRM_1584459948925'])} />
                                <DetailCard label="Дата связи" value={formatDate(getValue(deal, ['UF_CRM_1585653172826']))} />
                                <DetailCard label="Облачная касса тест" value={formatDate(getValue(deal, ['UF_CRM_1780932003']))} />
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
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
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