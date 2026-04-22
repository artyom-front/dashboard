'use client';

import { useState, useMemo } from 'react';
import { STAGE_MAP, STAGE_COLORS } from '@/domains/bank-dashboard/model/constants';
import type { B24Deal } from '@/domains/bank-dashboard/model/types';

interface DealTableProps {
  deals: B24Deal[];
}

export function DealTable({ deals }: DealTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');

  // Фильтрация и сортировка
  const filteredDeals = useMemo(() => {
    let result = [...deals];

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.STAGE_ID === statusFilter);
    }

    // Поиск по названию
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.TITLE.toLowerCase().includes(q));
    }

    // Сортировка
    result.sort((a, b) => {
      const dateA = new Date(a.DATE_MODIFY).getTime();
      const dateB = new Date(b.DATE_MODIFY).getTime();
      return sortOrder === 'new' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [deals, statusFilter, search, sortOrder]);

  // Статистика для карточек
  const stats = useMemo(() => {
    const total = deals.length;
    const active = deals.filter((d) => !['C26:WON', 'C26:LOSE'].includes(d.STAGE_ID)).length;
    const won = deals.filter((d) => d.STAGE_ID === 'C26:WON').length;
    const lost = deals.filter((d) => d.STAGE_ID === 'C26:LOSE').length;
    return { total, active, won, lost };
  }, [deals]);

  // Уникальные статусы для фильтра
  const uniqueStatuses = useMemo(() => {
    const map = new Map<string, string>();
    deals.forEach((d) => {
      map.set(d.STAGE_ID, STAGE_MAP[d.STAGE_ID] || d.STAGE_ID);
    });
    return Array.from(map.entries());
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Карточки статистики */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Всего заявок" value={stats.total} color="bg-gray-100" />
        <StatCard label="В работе" value={stats.active} color="bg-blue-50" />
        <StatCard label="Завершено" value={stats.won} color="bg-green-50" />
        <StatCard label="Провалено" value={stats.lost} color="bg-red-50" />
      </div>

      {/* Панель фильтров */}
      <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Поиск по клиенту</label>
          <input
            type="text"
            placeholder="Введите название..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            {uniqueStatuses.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Сортировка</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'new' | 'old')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
          </select>
        </div>

        <button
          onClick={() => { setSearch(''); setStatusFilter('all'); }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
        >
          Сбросить
        </button>
      </div>

      {/* Результат */}
      <p className="text-sm text-gray-500">
        Показано {filteredDeals.length} из {deals.length} заявок
      </p>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-700">
              <th className="px-4 py-3 font-semibold border-b">ID</th>
              <th className="px-4 py-3 font-semibold border-b">Клиент</th>
              <th className="px-4 py-3 font-semibold border-b">Статус</th>
              <th className="px-4 py-3 font-semibold border-b">Создана</th>
              <th className="px-4 py-3 font-semibold border-b">Изменена</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((deal) => (
              <tr key={deal.ID} className="hover:bg-gray-50 border-b last:border-b-0">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{deal.ID}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{deal.TITLE}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[deal.STAGE_ID] || 'bg-gray-100 text-gray-800'}`}>
                    {STAGE_MAP[deal.STAGE_ID] || deal.STAGE_ID}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {new Date(deal.DATE_CREATE).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                  {new Date(deal.DATE_MODIFY).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Ничего не найдено</p>
          <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      )}
    </div>
  );
}

// Вспомогательный компонент карточки
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} p-4 rounded-lg border border-gray-100`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}