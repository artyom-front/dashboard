// src/domains/bank-dashboard/lib/exportToCsv.ts
import { B24Deal } from '@/domains/bank-dashboard/model/types';
import { STAGE_MAP } from '@/domains/bank-dashboard/model/constants';

export function exportToCsv(deals: B24Deal[], filename: string = 'deals.csv') {
  const headers = [
    'ID',
    'Клиент',
    'Статус',
    'Дата создания',
    'Дата изменения',
    'Исполнитель',
    'Комментарий',
    'Источник',
  ];

  const rows = deals.map((deal) => [
    deal.ID,
    deal.TITLE,
    STAGE_MAP[deal.STAGE_ID] || deal.STAGE_ID,
    new Date(deal.DATE_CREATE).toLocaleDateString('ru-RU'),
    new Date(deal.DATE_MODIFY).toLocaleDateString('ru-RU'),
    deal.ASSIGNED_BY_ID,
    deal.COMMENTS || '',
    deal.SOURCE_DESCRIPTION || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}