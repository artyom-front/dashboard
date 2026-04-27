'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STAGE_MAP } from '@/domains/bank-dashboard/model/constants';
import { useRef } from 'react';

interface DealFiltersProps {
  onFilterChange: (filters: {
    search: string;
    stageId: string;
    dateFrom: string;
    dateTo: string;
    sortOrder: 'DESC' | 'ASC';
  }) => void;
}

export function DealFilters({ onFilterChange }: DealFiltersProps) {
  const [search, setSearch] = useState('');
  const [stageId, setStageId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Debounce для поиска по тексту
 const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyFilters = useCallback((patch?: Partial<typeof filters>) => {
    const filters = {
      search,
      stageId,
      dateFrom,
      dateTo,
      sortOrder,
      ...patch,
    };
    onFilterChange(filters);
  }, [search, stageId, dateFrom, dateTo, sortOrder, onFilterChange]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      applyFilters({ search: value });
    }, 400);
  };

  const handleStageChange = (value: string) => {
    setStageId(value);
    applyFilters({ stageId: value });
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    applyFilters({ dateFrom: value });
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    applyFilters({ dateTo: value });
  };

  const handleSortChange = (value: 'DESC' | 'ASC') => {
    setSortOrder(value);
    applyFilters({ sortOrder: value });
  };

  const reset = () => {
    setSearch('');
    setStageId('');
    setDateFrom('');
    setDateTo('');
    setSortOrder('DESC');
    onFilterChange({ search: '', stageId: '', dateFrom: '', dateTo: '', sortOrder: 'DESC' });
  };

  const hasActiveFilters = search || stageId || dateFrom || dateTo || sortOrder !== 'DESC';

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2">
        <Input
          placeholder="Поиск: ФИО, организация, телефон..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
        {hasActiveFilters && (
          <Button variant="ghost" onClick={reset}>
            Сбросить
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={stageId} onValueChange={handleStageChange}>
          <SelectTrigger className="w-55">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STAGE_MAP).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="w-37.5 cursor-pointer relative">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="w-full cursor-pointer"
          />
        </label>
        <span className="text-gray-400">—</span>
        <label className="w-37.5 cursor-pointer relative">
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="w-full cursor-pointer"
          />
        </label>

        <Select value={sortOrder} onValueChange={(v) => handleSortChange(v as 'DESC' | 'ASC')}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">Сначала новые</SelectItem>
            <SelectItem value="ASC">Сначала старые</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && <Badge variant="secondary">Поиск: {search}</Badge>}
          {stageId && <Badge variant="secondary">{STAGE_MAP[stageId]}</Badge>}
          {dateFrom && <Badge variant="secondary">с {dateFrom}</Badge>}
          {dateTo && <Badge variant="secondary">до {dateTo}</Badge>}
          {sortOrder === 'ASC' && <Badge variant="secondary">Старые сначала</Badge>}
        </div>
      )}
    </div>
  );
}