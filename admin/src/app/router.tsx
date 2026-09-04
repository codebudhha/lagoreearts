import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { ProfilePage } from '../features/auth/ProfilePage';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { ProductListPage } from '../features/products/ProductListPage';
import { ProductCreatePage } from '../features/products/ProductCreatePage';
import { ProductDetailPage } from '../features/products/ProductDetailPage';
import { ProductEditPage } from '../features/products/ProductEditPage';
import { ProductPreviewPage } from '../features/products/ProductPreviewPage';
import { CategoryListPage } from '../features/categories/CategoryListPage';
import { CategoryCreatePage } from '../features/categories/CategoryCreatePage';
import { CategoryDetailPage } from '../features/categories/CategoryDetailPage';
import { CategoryEditPage } from '../features/categories/CategoryEditPage';
import { AttributeListPage } from '../features/attributes/AttributeListPage';
import { AttributeCreatePage } from '../features/attributes/AttributeCreatePage';
import { AttributeDetailPage } from '../features/attributes/AttributeDetailPage';
import { AttributeEditPage } from '../features/attributes/AttributeEditPage';
import { ModulePlaceholder } from '../components/layout/ModulePlaceholder';

export const router = createBrowserRouter([
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      // Catalogue & Heritage
      {
        path: 'products',
        element: (
          <ProtectedRoute permission="products.read">
            <ProductListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/new',
        element: (
          <ProtectedRoute permission="product.create">
            <ProductCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/:id',
        element: (
          <ProtectedRoute permission="products.read">
            <ProductDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/:id/edit',
        element: (
          <ProtectedRoute permission="products.read">
            <ProductEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'products/:id/preview',
        element: (
          <ProtectedRoute permission="products.read">
            <ProductPreviewPage />
          </ProtectedRoute>
        ),
      },
      // Categories
      {
        path: 'categories',
        element: (
          <ProtectedRoute permission="categories.read">
            <CategoryListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories/new',
        element: (
          <ProtectedRoute permission="category.create">
            <CategoryCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories/:id',
        element: (
          <ProtectedRoute permission="categories.read">
            <CategoryDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'categories/:id/edit',
        element: (
          <ProtectedRoute permission="category.update">
            <CategoryEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections',
        element: (
          <ProtectedRoute permission="collections.read">
            <ModulePlaceholder
              title="Curated Collections"
              subtitle="Assemble seasonal edits and thematic art groupings."
              moduleName="Collections"
              permissionRequired="collections.read"
            />
          </ProtectedRoute>
        ),
      },
      // Attributes & Dynamic Filters
      {
        path: 'attributes',
        element: (
          <ProtectedRoute permission="attributes.read">
            <AttributeListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attributes/new',
        element: (
          <ProtectedRoute permission="attribute.create">
            <AttributeCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attributes/:id',
        element: (
          <ProtectedRoute permission="attributes.read">
            <AttributeDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attributes/:id/edit',
        element: (
          <ProtectedRoute permission="attribute.update">
            <AttributeEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'antiques',
        element: (
          <ProtectedRoute permission="antiques.read">
            <ModulePlaceholder
              title="Antiques & Collectibles"
              subtitle="Curate historical antiquities, provenance, and certificates."
              moduleName="Antiques"
              permissionRequired="antiques.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sanskrit',
        element: (
          <ProtectedRoute permission="sanskrit.read">
            <ModulePlaceholder
              title="The Sanskrit Edit"
              subtitle="Curate Sanskrit calligraphy, sacred verses, and Vedic art editions."
              moduleName="The Sanskrit Edit"
              permissionRequired="sanskrit.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'artists',
        element: (
          <ProtectedRoute permission="artists.read">
            <ModulePlaceholder
              title="Artists & Master Makers"
              subtitle="Manage artisan profiles, biographies, and portfolios."
              moduleName="Artists & Makers"
              permissionRequired="artists.read"
            />
          </ProtectedRoute>
        ),
      },
      // Content & Editorial
      {
        path: 'cms',
        element: (
          <ProtectedRoute permission="cms.read">
            <ModulePlaceholder
              title="Homepage CMS"
              subtitle="Control hero slides, promo blocks, and editorial showcases."
              moduleName="Homepage CMS"
              permissionRequired="cms.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal',
        element: (
          <ProtectedRoute permission="journal.read">
            <ModulePlaceholder
              title="Journal & Stories"
              subtitle="Publish heritage articles, art history essays, and cultural narratives."
              moduleName="Journal / Blog"
              permissionRequired="journal.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lookbook',
        element: (
          <ProtectedRoute permission="lookbook.read">
            <ModulePlaceholder
              title="Lookbook"
              subtitle="Design lifestyle lookbooks and shoppable editorial scenes."
              moduleName="Lookbook"
              permissionRequired="lookbook.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'navigation',
        element: (
          <ProtectedRoute permission="navigation.read">
            <ModulePlaceholder
              title="Navigation & Menus"
              subtitle="Structure storefront mega-menus and footer links."
              moduleName="Navigation"
              permissionRequired="navigation.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'media',
        element: (
          <ProtectedRoute permission="media.read">
            <ModulePlaceholder
              title="Media Asset Library"
              subtitle="Central storage for high-resolution images, videos, and documents."
              moduleName="Media Library"
              permissionRequired="media.read"
            />
          </ProtectedRoute>
        ),
      },
      // Sales & Operations
      {
        path: 'orders',
        element: (
          <ProtectedRoute permission="orders.read">
            <ModulePlaceholder
              title="Orders & Invoices"
              subtitle="Track collector orders, payment status, and order fulfillment."
              moduleName="Orders"
              permissionRequired="orders.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'shipping',
        element: (
          <ProtectedRoute permission="shipping.read">
            <ModulePlaceholder
              title="Shipping & Delivery"
              subtitle="Manage white-glove art delivery, tracking numbers, and couriers."
              moduleName="Shipping"
              permissionRequired="shipping.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers',
        element: (
          <ProtectedRoute permission="customers.read">
            <ModulePlaceholder
              title="Patrons & Customers"
              subtitle="View customer profiles, purchase histories, and contact info."
              moduleName="Customers"
              permissionRequired="customers.read"
            />
          </ProtectedRoute>
        ),
      },
      // Merchandising & Feedback
      {
        path: 'cross-sell',
        element: (
          <ProtectedRoute permission="cross_sell.read">
            <ModulePlaceholder
              title="Cross-sell & Upsell Recommendations"
              subtitle="Curate complementary art pairings and cart upsell rules."
              moduleName="Cross-sell & Upsell"
              permissionRequired="cross_sell.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reviews',
        element: (
          <ProtectedRoute permission="reviews.read">
            <ModulePlaceholder
              title="Reviews & Ratings"
              subtitle="Moderate customer reviews and verified buyer feedback."
              moduleName="Reviews & Ratings"
              permissionRequired="reviews.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'seo',
        element: (
          <ProtectedRoute permission="seo.read">
            <ModulePlaceholder
              title="SEO & Meta Tags"
              subtitle="Configure structured data, Open Graph tags, and sitemaps."
              moduleName="SEO"
              permissionRequired="seo.read"
            />
          </ProtectedRoute>
        ),
      },
      // Administration & Settings
      {
        path: 'users',
        element: (
          <ProtectedRoute permission="users.read">
            <ModulePlaceholder
              title="Admin Users"
              subtitle="Manage staff accounts, assign roles, and revoke access."
              moduleName="Admin Users"
              permissionRequired="users.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute permission="roles.read">
            <ModulePlaceholder
              title="Roles & Permissions"
              subtitle="Configure granular role-based access control matrix."
              moduleName="Roles & Permissions"
              permissionRequired="roles.read"
            />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute permission="settings.read">
            <ModulePlaceholder
              title="Store Settings"
              subtitle="Configure currency, tax, notification, and brand preferences."
              moduleName="Store Settings"
              permissionRequired="settings.read"
            />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);
