import React from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminOrder } from '../../lib/api/orders';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../feedback/Skeleton';
import { EmptyState } from '../feedback/EmptyState';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface RecentOrdersTableProps {
  orders?: AdminOrder[];
  isLoading?: boolean;
}

export const RecentOrdersTable: React.FC<RecentOrdersTableProps> = ({
  orders = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-ivory-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-champagne-50 text-champagne-700">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal-900">Recent Orders</h3>
            <p className="text-xs text-charcoal-500">Latest patron transactions and acquisitions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
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
      ) : orders.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No orders yet"
            description="When patrons place orders for art pieces, they will appear here in real-time."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/60 border-b border-ivory-100 text-charcoal-600 uppercase font-semibold tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-100">
              {orders.map((order) => {
                const customerName =
                  order.customerName ||
                  order.customerEmail ||
                  'Patron Guest';

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-ivory-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-charcoal-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-charcoal-900">{customerName}</span>
                        {order.customerEmail && order.customerName && (
                          <span className="text-[11px] text-charcoal-400 truncate max-w-[150px]">
                            {order.customerEmail}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-charcoal-600 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-serif font-semibold text-charcoal-900 whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={order.paymentStatus || 'PENDING'} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={order.status} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
