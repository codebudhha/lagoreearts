/**
 * Centralized Query Keys for TanStack Query
 * Enables predictable query invalidation and optimistic updates across modules.
 */

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentOrders: ['dashboard', 'recent-orders'] as const,
    recentCustomers: ['dashboard', 'recent-customers'] as const,
    recentReviews: ['dashboard', 'recent-reviews'] as const,
    lowStock: ['dashboard', 'low-stock'] as const,
    activity: ['dashboard', 'activity'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: (params?: Record<string, any>) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, any>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    lowStock: () => ['products', 'low-stock'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params?: Record<string, any>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    list: (params?: Record<string, any>) => ['reviews', 'list', params] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: (params?: Record<string, any>) => ['categories', 'list', params] as const,
  },
  collections: {
    all: ['collections'] as const,
    list: (params?: Record<string, any>) => ['collections', 'list', params] as const,
  },
};
