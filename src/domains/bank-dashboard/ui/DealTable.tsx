// src/domains/bank-dashboard/ui/DealTable.tsx
'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { B24Deal } from '@/domains/bank-dashboard/model/types';
import { STAGE_MAP, STAGE_COLORS } from '@/domains/bank-dashboard/model/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DealTableProps {
  data: B24Deal[];
  total: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onExport?: () => void;
}

 
export function DealTable({ data, total, page, perPage, hasNext, onPageChange, onExport }: DealTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const columns: ColumnDef<B24Deal, unknown>[] = [
    {
      accessorKey: 'DATE_CREATE',
      header: 'Дата заявки',
      cell: (info) => {
        const date = new Date(info.getValue<string>());
        const daysOnStage = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        let colorClass = 'text-gray-900';
        if (daysOnStage > 7) colorClass = 'text-red-600 font-semibold';
        else if (daysOnStage > 3) colorClass = 'text-yellow-600';
        
        return <span className={colorClass}>{date.toLocaleDateString('ru-RU')}</span>;
      },
    },
    {
      accessorKey: 'TITLE',
      header: 'Клиент',
    },
    {
      accessorKey: 'STAGE_ID',
      header: 'Статус',
      cell: (info) => {
        const stageId = info.getValue<string>();
        const label = STAGE_MAP[stageId] || stageId;
        const color = STAGE_COLORS[stageId] || 'bg-gray-200 text-black';
        
        return (
          <Badge className={color}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'ASSIGNED_BY_ID',
      header: 'Исполнитель',
      cell: (info) => `ID: ${info.getValue<string>()}`,
    },
    {
      accessorKey: 'DATE_MODIFY',
      header: 'Последнее касание',
      cell: (info) => {
        const dateStr = info.getValue<string>();
        const date = new Date(dateStr);
        const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
        let text = '🟢';
        
        if (daysAgo > 3) {
          variant = 'destructive';
          text = '🔴';
        } else if (daysAgo > 1) {
          variant = 'secondary';
          text = '🟡';
        }
        
        return (
          <Badge variant={variant} title={`Последнее изменение: ${date.toLocaleString('ru-RU')}`}>
            {text} {daysAgo === 0 ? 'сегодня' : `${daysAgo} дн.`}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'COMMENTS',
      header: 'Комментарий',
      cell: (info) => info.getValue<string>() || '—',
    },
    {
      accessorKey: 'ID',
      header: 'Контакт разработчика',
      cell: (info) => {
        const dealId = info.getValue<string>();
        return <span className="text-gray-400" title={`ID сделки: ${dealId}`}>—</span>;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / perPage),
  });

  return (
    <div className="space-y-4">
      {/* Шапка с кнопками */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Всего заявок: {total} | Страница {page} из {Math.ceil(total / perPage)}
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              📥 Выгрузить CSV
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const isExpanded = expandedRows.has(row.original.ID);
              
              return (
                <React.Fragment key={row.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleRow(row.original.ID)}
                    title="Нажмите для просмотра деталей"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="bg-gray-50">
                        <div className="p-4 text-sm text-gray-600">
                          <p className="font-medium mb-2">Детали заявки #{row.original.ID}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-gray-500">Дата создания</p>
                              <p>{new Date(row.original.DATE_CREATE).toLocaleString('ru-RU')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Последнее изменение</p>
                              <p>{new Date(row.original.DATE_MODIFY).toLocaleString('ru-RU')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Источник</p>
                              <p>{row.original.SOURCE_DESCRIPTION || '—'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">ID ответственного</p>
                              <p>{row.original.ASSIGNED_BY_ID}</p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Назад
        </Button>
        <span className="text-sm text-gray-500">
          Страница {page} из {Math.ceil(total / perPage)}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
        >
          Вперёд
        </Button>
      </div>
    </div>
  );
}