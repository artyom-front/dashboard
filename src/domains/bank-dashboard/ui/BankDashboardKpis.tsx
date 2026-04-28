import type { DealDashboardSummary } from '@/domains/bank-dashboard/model/types';
import { CompactKpiCard } from '@/domains/bank-dashboard/ui/CompactKpiCard';

function formatNumber(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value);
}

function KpiSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

export function BankDashboardKpis({
  summary,
  loading,
}: {
  summary: DealDashboardSummary;
  loading?: boolean;
}) {
  const cards = [
    {
      title: 'Всего заявок',
      value: formatNumber(summary.total),
      hint: 'по текущему банку и фильтрам',
      tooltip: 'Все заявки, которые попали в выбранный период и текущий банк.',
      tone: 'red' as const,
    },
    {
      title: 'В работе',
      value: formatNumber(summary.inWorkCount),
      hint: 'активные заявки',
      tooltip: 'Заявки на рабочих стадиях процесса.',
      tone: 'blue' as const,
    },
    {
      title: 'Новых',
      value: formatNumber(summary.newCount),
      hint: 'новые обращения',
      tooltip: 'Заявки, которые недавно попали в систему.',
      tone: 'rose' as const,
    },
    {
      title: 'За сегодня',
      value: formatNumber(summary.todayCount),
      hint: 'создано сегодня',
      tooltip: 'Сколько заявок появилось за текущий день.',
      tone: 'slate' as const,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {loading && summary.total === 0
        ? Array.from({ length: 4 }).map((_, index) => <KpiSkeleton key={index} />)
        : cards.map((card) => (
            <CompactKpiCard
              key={card.title}
              title={card.title}
              value={card.value}
              hint={card.hint}
              tooltip={card.tooltip}
              tone={card.tone}
            />
          ))}
    </section>
  );
}