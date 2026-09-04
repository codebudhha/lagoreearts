import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './Table';
import { Pagination } from './Pagination';
import { SearchInput } from './SearchInput';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Search
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  // Actions slot
  actions?: React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  error = null,
  onRetry,
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  actions,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('bg-white rounded-xl border border-ivory-200 shadow-sm overflow-hidden', className)}>
      {/* Table Toolbar */}
      {(searchable || actions) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-ivory-100 bg-ivory-50/30">
          {searchable && onSearchChange && (
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchValue}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
                size="sm"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2.5 ml-auto">{actions}</div>}
        </div>
      )}

      {/* Table Content */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-8">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : data.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={keyExtractor(item, index)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.className
                    )}
                  >
                    {col.render ? col.render(item, index) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Table Pagination */}
      {!isLoading && !error && data.length > 0 && totalPages && totalPages > 1 && onPageChange && currentPage && (
        <div className="px-4 border-t border-ivory-100 bg-ivory-50/20">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            pageSize={pageSize}
          />
        </div>
      )}
    </div>
  );
}
