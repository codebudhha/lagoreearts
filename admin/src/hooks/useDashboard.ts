import { useQuery } from '@tanstack/react-query';
import { ordersApi, AdminOrder } from '../lib/api/orders';
import { productsApi, AdminProduct } from '../lib/api/products';
import { customersApi, AdminCustomer } from '../lib/api/customers';
import { reviewsApi, AdminReview } from '../lib/api/reviews';
import { queryKeys } from '../lib/api/queryKeys';
import { useAuth } from './useAuth';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    hasPermission: boolean;
  };
  products: {
    total: number;
    active: number;
    draft: number;
    lowStock: number;
    outOfStock: number;
    hasPermission: boolean;
  };
  customers: {
    total: number;
    hasPermission: boolean;
  };
  reviews: {
    total: number;
    pending: number;
    hasPermission: boolean;
  };
  revenue: {
    value: string;
    hasAuthoritativeSource: boolean;
    note: string;
  };
}

export function useDashboardStats() {
  const { hasPermission } = useAuth();

  const canViewOrders = hasPermission('order.view');
  const canViewProducts = hasPermission('product.view');
  const canViewCustomers = hasPermission('customer.view');
  const canViewReviews = hasPermission('review.view');

  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: async (): Promise<DashboardStats> => {
      const stats: DashboardStats = {
        orders: { total: 0, pending: 0, hasPermission: canViewOrders },
        products: { total: 0, active: 0, draft: 0, lowStock: 0, outOfStock: 0, hasPermission: canViewProducts },
        customers: { total: 0, hasPermission: canViewCustomers },
        reviews: { total: 0, pending: 0, hasPermission: canViewReviews },
        revenue: {
          value: '—',
          hasAuthoritativeSource: false,
          note: 'Calculated at settlement',
        },
      };

      const promises: Promise<void>[] = [];

      if (canViewOrders) {
        promises.push(
          (async () => {
            try {
              const res = await ordersApi.list({ limit: 50 });
              stats.orders.total = res.total;
              // Compute pending orders from authoritative orders
              const pendingOrders = res.orders.filter((o) => o.status === 'PENDING');
              stats.orders.pending = pendingOrders.length;
            } catch (err) {
              console.warn('Dashboard orders stats fetch error:', err);
            }
          })()
        );
      }

      if (canViewProducts) {
        promises.push(
          (async () => {
            try {
              const res = await productsApi.list({ limit: 50 });
              stats.products.total = res.total;

              let active = 0;
              let draft = 0;
              let lowStock = 0;
              let outOfStock = 0;

              res.products.forEach((p) => {
                if (p.status === 'ACTIVE') active++;
                if (p.status === 'DRAFT') draft++;

                if (p.inventoryTracking !== false) {
                  if (p.stockQuantity === 0) {
                    outOfStock++;
                    lowStock++;
                  } else if (p.stockQuantity <= (p.lowStockThreshold || 5)) {
                    lowStock++;
                  }
                }
              });

              stats.products.active = active;
              stats.products.draft = draft;
              stats.products.lowStock = lowStock;
              stats.products.outOfStock = outOfStock;
            } catch (err) {
              console.warn('Dashboard products stats fetch error:', err);
            }
          })()
        );
      }

      if (canViewCustomers) {
        promises.push(
          (async () => {
            try {
              const res = await customersApi.list({ limit: 1 });
              stats.customers.total = res.total;
            } catch (err) {
              console.warn('Dashboard customers stats fetch error:', err);
            }
          })()
        );
      }

      if (canViewReviews) {
        promises.push(
          (async () => {
            try {
              const [allReviews, pendingReviews] = await Promise.all([
                reviewsApi.list({ limit: 1 }),
                reviewsApi.list({ limit: 1, status: 'PENDING' }),
              ]);
              stats.reviews.total = allReviews.total;
              stats.reviews.pending = pendingReviews.total;
            } catch (err) {
              console.warn('Dashboard reviews stats fetch error:', err);
            }
          })()
        );
      }

      await Promise.all(promises);
      return stats;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 2,
  });
}

export function useRecentOrders(limit: number = 5) {
  const { hasPermission } = useAuth();
  const enabled = hasPermission('order.view');

  return useQuery({
    queryKey: queryKeys.dashboard.recentOrders,
    queryFn: async (): Promise<AdminOrder[]> => {
      const res = await ordersApi.list({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
      return res.orders;
    },
    enabled,
    staleTime: 1000 * 30, // 30s
    refetchInterval: 1000 * 45, // 45s auto-refresh
  });
}

export function useRecentCustomers(limit: number = 5) {
  const { hasPermission } = useAuth();
  const enabled = hasPermission('customer.view');

  return useQuery({
    queryKey: queryKeys.dashboard.recentCustomers,
    queryFn: async (): Promise<AdminCustomer[]> => {
      const res = await customersApi.list({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
      return res.customers;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRecentReviews(limit: number = 5) {
  const { hasPermission } = useAuth();
  const enabled = hasPermission('review.view');

  return useQuery({
    queryKey: queryKeys.dashboard.recentReviews,
    queryFn: async (): Promise<AdminReview[]> => {
      const res = await reviewsApi.list({ limit });
      return res.reviews;
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useLowStockProducts(limit: number = 5) {
  const { hasPermission } = useAuth();
  const enabled = hasPermission('product.view');

  return useQuery({
    queryKey: queryKeys.dashboard.lowStock,
    queryFn: async (): Promise<AdminProduct[]> => {
      const res = await productsApi.list({ limit: 50 });
      // Filter out products with low inventory
      return res.products
        .filter(
          (p) =>
            p.inventoryTracking !== false &&
            p.stockQuantity <= (p.lowStockThreshold || 5)
        )
        .slice(0, limit);
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
