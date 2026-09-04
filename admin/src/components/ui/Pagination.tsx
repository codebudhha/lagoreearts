import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}) => {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 py-1 text-xs text-charcoal-400 select-none"
          >
            ...
          </span>
        );
      }

      const isCurrent = page === currentPage;
      return (
        <button
          key={`page-${page}`}
          type="button"
          onClick={() => onPageChange(Number(page))}
          className={cn(
            'min-w-[32px] h-8 px-2.5 text-xs font-semibold rounded-lg transition-colors',
            isCurrent
              ? 'bg-charcoal-900 text-ivory-50 shadow-sm'
              : 'text-charcoal-700 hover:bg-ivory-100 hover:text-charcoal-900'
          )}
        >
          {page}
        </button>
      );
    });
  };

  const startItem = (currentPage - 1) * (pageSize || 10) + 1;
  const endItem = Math.min(currentPage * (pageSize || 10), totalItems || 0);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3',
        className
      )}
    >
      {totalItems !== undefined && (
        <div className="text-xs text-charcoal-500">
          Showing <span className="font-semibold text-charcoal-900">{startItem}</span> to{' '}
          <span className="font-semibold text-charcoal-900">{endItem}</span> of{' '}
          <span className="font-semibold text-charcoal-900">{totalItems}</span> results
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">{renderPageNumbers()}</div>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
