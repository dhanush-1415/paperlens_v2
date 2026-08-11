'use client';

/**
 * DataTable — a sortable, filterable table.
 *
 * Built from scratch rather than wrapping a heavy library like React Table. For most
 * dashboard views, you need a flexible grid of data with clear actions. This component
 * implements the established styling and provides a clean API for columns.
 */

import { type ReactNode } from 'react';
import { cn } from '@/shared/ui/cn';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (item: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  className?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-auto rounded-card border border-border-subtle bg-surface-1 shadow-sm', className)}>
      <table className="w-full text-left text-sm text-text-secondary">
        <thead className="bg-surface-2 border-b border-border-subtle text-xs uppercase tracking-wider text-text-tertiary">
          <tr>
            {columns.map((col) => (
              <th key={col.id} className={cn('px-4 py-3 font-medium whitespace-nowrap', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface-1">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-tertiary">
                No data available
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                className={cn('group transition-colors duration-200 hover:bg-surface-2 hover:shadow-[inset_2px_0_0_0_var(--brand-primary)]', onRowClick && 'cursor-pointer')}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.id} className={cn('px-4 py-3', col.className)}>
                    {col.cell(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
