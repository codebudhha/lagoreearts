import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Image,
  Star,
  Layers,
  LayoutTemplate,
} from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatRoleName } from '../../utils/formatters';

export const DashboardPage: React.FC = () => {
  const { admin } = useAuth();
  const navigate = useNavigate();

  const metrics = [
    {
      label: 'Gross Sales (MTD)',
      value: formatCurrency(245800),
      change: '+14.2%',
      isPositive: true,
      icon: TrendingUp,
      color: 'text-champagne-700 bg-champagne-50',
    },
    {
      label: 'Total Orders',
      value: '184',
      change: '+8.1%',
      isPositive: true,
      icon: ShoppingBag,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Artisan Works & Antiques',
      value: '432',
      change: '+12 new',
      isPositive: true,
      icon: Package,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      label: 'Active Patrons',
      value: '1,280',
      change: '+5.4%',
      isPositive: true,
      icon: Users,
      color: 'text-indigo-700 bg-indigo-50',
    },
  ];

  const quickLinks = [
    {
      title: 'Products & Artworks',
      desc: 'Curate luxury creations, variants, inventory, and pricing.',
      href: '/admin/products',
      icon: Package,
    },
    {
      title: 'Order Management',
      desc: 'Track luxury customer shipments, fulfillment, and invoices.',
      href: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      title: 'Homepage CMS',
      desc: 'Manage hero slides, editorial banners, and curated grids.',
      href: '/admin/cms',
      icon: LayoutTemplate,
    },
    {
      title: 'Media Asset Library',
      desc: 'Upload high-resolution photography, certificates, and lookbooks.',
      href: '/admin/media',
      icon: Image,
    },
    {
      title: 'Reviews & Ratings',
      desc: 'Moderate collector testimonials and customer feedback.',
      href: '/admin/reviews',
      icon: Star,
    },
    {
      title: 'Categories & Taxonomy',
      desc: 'Structure artisanal hierarchies and dynamic filter facets.',
      href: '/admin/categories',
      icon: Layers,
    },
  ];

  return (
    <PageContainer
      title="Admin Dashboard"
      subtitle={`Welcome back, ${admin?.name || 'Administrator'}. Here is an overview of your store's heritage collection and operations.`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/', '_blank')}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Storefront
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/products')}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Manage Catalogue
          </Button>
        </div>
      }
    >
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <Card key={idx} padding="md" className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <h3 className="text-2xl font-serif font-bold text-charcoal-900 mt-2">
                    {metric.value}
                  </h3>
                </div>
                <div className={`p-2.5 rounded-xl ${metric.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs">
                <span
                  className={`font-semibold ${
                    metric.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-charcoal-400 ml-1.5">vs previous period</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Launch & System Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Functional Modules */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-serif font-bold text-charcoal-900">
            Administrative Consoles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(item.href)}
                  className="group p-5 bg-white rounded-xl border border-ivory-200 hover:border-champagne-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-ivory-100 group-hover:bg-champagne-100 text-charcoal-800 group-hover:text-champagne-800 flex items-center justify-center transition-colors mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-charcoal-900 group-hover:text-champagne-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-xs font-semibold text-charcoal-600 group-hover:text-champagne-700 transition-colors">
                    <span>Access Console</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System & Staff Profile Status */}
        <div className="space-y-4">
          <h2 className="text-base font-serif font-bold text-charcoal-900">
            Operational Overview
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Session Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-ivory-100">
                  <span className="text-charcoal-500 font-medium">Logged in staff:</span>
                  <span className="font-semibold text-charcoal-900">{admin?.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ivory-100">
                  <span className="text-charcoal-500 font-medium">Role:</span>
                  <span className="font-semibold text-charcoal-900">
                    {formatRoleName(admin?.role?.slug || '')}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ivory-100">
                  <span className="text-charcoal-500 font-medium">Environment:</span>
                  <span className="font-mono text-emerald-700 font-semibold">Production Mode</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-charcoal-500 font-medium">Backend API:</span>
                  <span className="font-mono text-charcoal-700">/api/v1 (Operational)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
