'use client';

import type { DashboardFilters } from '@/domains/bank-dashboard/model/filter';
import type { StageStat } from '@/domains/bank-dashboard/model/types';
import { CompactFilterBar } from '@/domains/bank-dashboard/ui/CompactFilterBar';

type DealFiltersProps = {
  filters: DashboardFilters;
  onFilterChange: (patch: Partial<DashboardFilters>) => void;
  stageOptions?: StageStat[];
  bankOptions?: string[];
  defaultBank?: string;
  workingStageId?: string;
  onExport?: () => void;
  loading?: boolean;
};

export function DealFilters({
  filters,
  onFilterChange,
  stageOptions = [],
  bankOptions = [],
  defaultBank = '',
  workingStageId,
  onExport = () => undefined,
  loading = false,
}: DealFiltersProps) {
  return (
    <CompactFilterBar
      filters={filters}
      onChange={onFilterChange}
      stageOptions={stageOptions}
      bankOptions={bankOptions}
      defaultBank={defaultBank}
      workingStageId={workingStageId}
      onExport={onExport}
      loading={loading}
    />
  );
}