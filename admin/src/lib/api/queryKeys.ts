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
    lists: () => ['orders', 'list'] as const,
    list: (params?: Record<string, any>) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
  },
  products: {
    all: ['products'] as const,
    lists: () => ['products', 'list'] as const,
    list: (params?: Record<string, any>) => ['products', 'list', params] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    lowStock: () => ['products', 'low-stock'] as const,
    attributes: (id: string) => ['products', 'attributes', id] as const,
    collections: (id: string) => ['products', 'collections', id] as const,
    media: (id: string) => ['products', 'media', id] as const,
    options: (id: string) => ['products', 'options', id] as const,
    variants: (id: string) => ['products', 'variants', id] as const,
    seo: (id: string) => ['products', 'seo', id] as const,
  },
  customers: {
    all: ['customers'] as const,
    lists: () => ['customers', 'list'] as const,
    list: (params?: Record<string, any>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    lists: () => ['reviews', 'list'] as const,
    list: (params?: Record<string, any>) => ['reviews', 'list', params] as const,
    detail: (id: string) => ['reviews', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    tree: ['categories', 'tree'] as const,
    lists: () => ['categories', 'list'] as const,
    list: (params?: Record<string, any>) => ['categories', 'list', params] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
    children: (id: string) => ['categories', 'children', id] as const,
    ancestors: (id: string) => ['categories', 'ancestors', id] as const,
    attributes: (categoryId: string) => ['categories', 'attributes', categoryId] as const,
    filters: (slug: string) => ['categories', 'filters', slug] as const,
  },
  collections: {
    all: ['collections'] as const,
    lists: () => ['collections', 'list'] as const,
    list: (params?: Record<string, any>) => ['collections', 'list', params] as const,
    detail: (id: string) => ['collections', 'detail', id] as const,
  },
  attributes: {
    all: ['attributes'] as const,
    lists: () => ['attributes', 'list'] as const,
    list: (params?: Record<string, any>) => ['attributes', 'list', params] as const,
    detail: (id: string) => ['attributes', 'detail', id] as const,
    values: (attributeId: string) => ['attributes', 'values', attributeId] as const,
  },
  media: {
    all: ['media'] as const,
    lists: () => ['media', 'list'] as const,
    list: (params?: Record<string, any>) => ['media', 'list', params] as const,
    folders: ['media', 'folders'] as const,
    detail: (id: string) => ['media', 'detail', id] as const,
  },
  seo: {
    all: ['seo'] as const,
    detail: (entityType: string, entityId: string) => ['seo', entityType, entityId] as const,
    settings: ['seo', 'settings'] as const,
  },
};
