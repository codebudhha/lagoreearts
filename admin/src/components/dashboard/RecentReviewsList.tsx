import React from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminReview } from '../../lib/api/reviews';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../feedback/Skeleton';
import { formatDate } from '../../utils/formatters';

export interface RecentReviewsListProps {
  reviews?: AdminReview[];
  isLoading?: boolean;
}

export const RecentReviewsList: React.FC<RecentReviewsListProps> = ({
  reviews = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-ivory-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <Star className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal-900">Patron Testimonials</h3>
            <p className="text-xs text-charcoal-500">Recent collector reviews and ratings</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/reviews')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-600 hover:text-champagne-700 transition-colors"
        >
          <span>Moderate All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center text-xs text-charcoal-500">
          No reviews submitted yet.
        </div>
      ) : (
        <div className="divide-y divide-ivory-100">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-ivory-50/40 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-ivory-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-charcoal-700">
                    {rev.customerName || 'Verified Collector'}
                  </span>
                  <span className="text-[10px] text-charcoal-400">•</span>
                  <span className="text-[10px] text-charcoal-400">{formatDate(rev.createdAt)}</span>
                </div>
                <p className="text-xs text-charcoal-800 line-clamp-1 italic">
                  "{rev.title || rev.comment}"
                </p>
                {rev.productTitle && (
                  <p className="text-[11px] text-charcoal-500 mt-0.5 truncate">
                    On <span className="font-semibold text-charcoal-700">{rev.productTitle}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                <StatusBadge status={rev.status || 'PENDING'} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
