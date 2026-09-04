import React from 'react';
import {
  ShoppingBag,
  Package,
  Users,
  Star,
  TrendingUp,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { StatCard } from '../../components/dashboard/StatCard';
import { RecentOrdersTable } from '../../components/dashboard/RecentOrdersTable';
import { LowStockList } from '../../components/dashboard/LowStockList';
import { RecentCustomersList } from '../../components/dashboard/RecentCustomersList';
import { RecentReviewsList } from '../../components/dashboard/RecentReviewsList';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import {
  useDashboardStats,
  useRecentOrders,
  useRecentCustomers,
  useRecentReviews,
  useLowStockProducts,
} from '../../hooks/useDashboard';

export const DashboardPage: React.FC = () => {
  const { admin, hasPermission } = useAuth();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: recentOrders,
    isLoading: ordersLoading,
  } = useRecentOrders(5);

  const {
    data: recentCustomers,
    isLoading: customersLoading,
  } = useRecentCustomers(5);

  const {
    data: recentReviews,
    isLoading: reviewsLoading,
  } = useRecentReviews(5);

  const {
    data: lowStockProducts,
    isLoading: lowStockLoading,
  } = useLowStockProducts(5);

  const canViewOrders = hasPermission('order.view');
  const canViewProducts = hasPermission('product.view');
  const canViewCustomers = hasPermission('customer.view');
  const canViewReviews = hasPermission('review.view');

  const greetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDateFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <PageContainer
      title="Atelier Dashboard"
      subtitle={`${greetingTime()}, ${admin?.name || 'Administrator'}. Operational overview for ${currentDateFormatted}.`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStats()}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          Refresh Data
        </Button>
      }
    >
      {/* Error Banner */}
      {statsError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Some dashboard statistics could not be loaded. Showing cached data where available.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetchStats()} className="text-xs">
            Retry
          </Button>
        </div>
      )}

      {/* Primary Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Orders Card */}
        {canViewOrders && (
          <StatCard
            title="Total Orders"
            value={stats?.orders?.total ?? 0}
            secondaryInfo={`${stats?.orders?.pending ?? 0} pending fulfillment`}
            icon={ShoppingBag}
            isLoading={statsLoading}
            href="/admin/orders"
            colorVariant="champagne"
            permission="order.view"
          />
        )}

        {/* Products Card */}
        {canViewProducts && (
          <StatCard
            title="Artworks in Catalog"
            value={stats?.products?.total ?? 0}
            secondaryInfo={`${stats?.products?.lowStock ?? 0} low in stock`}
            icon={Package}
            isLoading={statsLoading}
            href="/admin/products"
            colorVariant="emerald"
            permission="product.view"
          />
        )}

        {/* Patrons Card */}
        {canViewCustomers && (
          <StatCard
            title="Registered Patrons"
            value={stats?.customers?.total ?? 0}
            secondaryInfo="Active collector accounts"
            icon={Users}
            isLoading={statsLoading}
            href="/admin/customers"
            colorVariant="indigo"
            permission="customer.view"
          />
        )}

        {/* Reviews Card */}
        {canViewReviews && (
          <StatCard
            title="Reviews & Ratings"
            value={stats?.reviews?.total ?? 0}
            secondaryInfo={`${stats?.reviews?.pending ?? 0} pending review`}
            icon={Star}
            isLoading={statsLoading}
            href="/admin/reviews"
            colorVariant="amber"
            permission="review.view"
          />
        )}

        {/* Revenue Card (Only when permitted, with authoritative note) */}
        {canViewOrders && (
          <StatCard
            title="Gross Revenue"
            value={stats?.revenue?.value ?? '—'}
            secondaryInfo={stats?.revenue?.note ?? 'Calculated at settlement'}
            icon={TrendingUp}
            isLoading={statsLoading}
            colorVariant="charcoal"
            permission="order.view"
          />
        )}
      </div>

      {/* Quick Actions Bar */}
      <QuickActions />

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Orders */}
        {canViewOrders && (
          <RecentOrdersTable
            orders={recentOrders}
            isLoading={ordersLoading}
          />
        )}

        {/* Right: Low Stock / Inventory Alerts */}
        {canViewProducts && (
          <LowStockList
            products={lowStockProducts}
            isLoading={lowStockLoading}
          />
        )}
      </div>

      {/* Customer & Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patrons */}
        {canViewCustomers && (
          <RecentCustomersList
            customers={recentCustomers}
            isLoading={customersLoading}
          />
        )}

        {/* Recent Reviews */}
        {canViewReviews && (
          <RecentReviewsList
            reviews={recentReviews}
            isLoading={reviewsLoading}
          />
        )}
      </div>

      {/* Administrative Activity & Audit */}
      <ActivityFeed />
    </PageContainer>
  );
};
