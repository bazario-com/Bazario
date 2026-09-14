'use client';

import { useState } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  emptyMessage: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  renderDrawer?: (row: T, onClose: () => void) => React.ReactNode;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-line ${className}`} />;
}

const MIDDOT = '\u00b7';
const UP_ARROW = '\u2191';
const DOWN_ARROW = '\u2193';

export function AdminDataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  emptyMessage,
  page,
  pageSize,
  total,
  onPageChange,
  sortBy,
  sortDir,
  onSortChange,
  renderDrawer,
}: AdminDataTableProps<T>) {
  const [activeRow, setActiveRow] = useState<T | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (error) {
    return (
      <div className="rounded-card bg-chili-50 p-4 text-center text-sm text-chili-600">
        <p className="mb-2">Unable to load this data.</p>
        <button
          onClick={onRetry}
          className="rounded-card border border-chili px-4 py-1.5 font-semibold hover:bg-chili hover:text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-card bg-surface p-8 text-center text-sm text-muted shadow-card">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-card bg-surface shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 font-semibold text-ink-700 ${
                      col.sortable && onSortChange ? 'cursor-pointer select-none hover:text-ink-900' : ''
                    }`}
                    onClick={() => col.sortable && onSortChange?.(col.key)}
                  >
                    {col.header}
                    {isSorted && <span className="ml-1 text-xs">{sortDir === 'asc' ? UP_ARROW : DOWN_ARROW}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={`border-b border-line last:border-0 ${
                  renderDrawer ? 'cursor-pointer hover:bg-line/40' : ''
                }`}
                onClick={() => renderDrawer && setActiveRow(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-muted">
          Page {page} of {totalPages} {MIDDOT} {total} total
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-card border border-line px-3 py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {renderDrawer && activeRow && renderDrawer(activeRow, () => setActiveRow(null))}
    </>
  );
}
