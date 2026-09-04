import React from 'react';
import { AlertTriangle, ArrowUpRight, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminProduct } from '../../lib/api/products';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../feedback/Skeleton';

export interface LowStockListProps {
  products?: AdminProduct[];
  isLoading?: boolean;
}

export const LowStockList: React.FC<LowStockListProps> = ({
  products = [],
  isLoading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-ivory-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ivory-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal-900">Inventory Alerts</h3>
            <p className="text-xs text-charcoal-500">Masterworks nearing depletion</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal-600 hover:text-champagne-700 transition-colors"
        >
          <span>Manage Stock</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <PackageCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-charcoal-800">All inventory levels optimal</p>
          <p className="text-[11px] text-charcoal-400 mt-0.5">No products currently below their threshold.</p>
        </div>
      ) : (
        <div className="divide-y divide-ivory-100">
          {products.map((product) => {
            const isOutOfStock = product.stockQuantity === 0;

            return (
              <div
                key={product.id}
                className="p-4 flex items-center justify-between hover:bg-ivory-50/40 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="text-xs font-semibold text-charcoal-900 truncate">
                    {product.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-charcoal-500 font-mono">
                    <span>SKU: {product.sku}</span>
                    <span>•</span>
                    <span>Threshold: {product.lowStockThreshold || 5}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="block text-xs font-bold text-charcoal-900">
                      {product.stockQuantity} in stock
                    </span>
                  </div>
                  <Badge variant={isOutOfStock ? 'danger' : 'warning'} size="sm">
                    {isOutOfStock ? 'Out of stock' : 'Low stock'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
