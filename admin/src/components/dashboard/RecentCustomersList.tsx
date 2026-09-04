import React from 'react';
import { Users, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminCustomer } from '../../lib/api/customers';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../feedback/Skeleton';
import { formatDate } from '../../utils/formatters';

export interface RecentCustomersListProps {
  customers?: AdminCustomer[];
  isLoading?: boolean;
}

export const RecentCustomersList: React.FC<RecentCustomersListProps> = ({
  customers = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-ivory-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal-900">Recent Patrons</h3>
            <p className="text-xs text-charcoal-500">Newly registered collectors and clients</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-600 hover:text-champagne-700 transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center text-xs text-charcoal-500">
          No registered patrons found yet.
        </div>
      ) : (
        <div className="divide-y divide-ivory-100">
          {customers.map((cust) => {
            const fullName =
              cust.name ||
              (cust.firstName
                ? `${cust.firstName} ${cust.lastName || ''}`.trim()
                : 'Art Patron');

            return (
              <div
                key={cust.id}
                className="p-4 flex items-center justify-between hover:bg-ivory-50/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-ivory-100 text-charcoal-700 font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-charcoal-900 truncate">
                      {fullName}
                    </h4>
                    <p className="text-[11px] text-charcoal-400 truncate">{cust.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-right">
                  <span className="text-[11px] text-charcoal-500 hidden sm:inline">
                    {formatDate(cust.createdAt)}
                  </span>
                  <StatusBadge status={cust.status || 'ACTIVE'} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
