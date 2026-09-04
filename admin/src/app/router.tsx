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
import { CollectionListPage } from '../features/collections/CollectionListPage';
import { CollectionCreatePage } from '../features/collections/CollectionCreatePage';
import { CollectionDetailPage } from '../features/collections/CollectionDetailPage';
import { CollectionEditPage } from '../features/collections/CollectionEditPage';
import { MediaLibraryPage } from '../features/media/MediaLibraryPage';
import { MediaOrphansPage } from '../features/media/MediaOrphansPage';
import { ArtistListPage } from '../features/artists/ArtistListPage';
import { ArtistCreatePage } from '../features/artists/ArtistCreatePage';
import { ArtistDetailPage } from '../features/artists/ArtistDetailPage';
import { ArtistEditPage } from '../features/artists/ArtistEditPage';
import { AntiqueListPage } from '../features/antiques/AntiqueListPage';
import { AntiqueDetailPage } from '../features/antiques/AntiqueDetailPage';
import { AntiqueEditPage } from '../features/antiques/AntiqueEditPage';
import { SanskritEditListPage } from '../features/sanskrit/SanskritEditListPage';
import { SanskritEditCreatePage } from '../features/sanskrit/SanskritEditCreatePage';
import { SanskritEditDetailPage } from '../features/sanskrit/SanskritEditDetailPage';
import { SanskritEditEditPage } from '../features/sanskrit/SanskritEditEditPage';
import { HomepageListPage } from '../features/homepage/HomepageListPage';
import { HomepageEditPage } from '../features/homepage/HomepageEditPage';
import { HomepagePreviewPage } from '../features/homepage/HomepagePreviewPage';
import { JournalListPage } from '../features/journal/JournalListPage';
import { JournalCreatePage } from '../features/journal/JournalCreatePage';
import { JournalDetailPage } from '../features/journal/JournalDetailPage';
import { JournalEditPage } from '../features/journal/JournalEditPage';
import { JournalPreviewPage } from '../features/journal/JournalPreviewPage';
import { JournalAuthorsPage } from '../features/journal/JournalAuthorsPage';
import { JournalCategoriesPage } from '../features/journal/JournalCategoriesPage';
import { JournalTagsPage } from '../features/journal/JournalTagsPage';
import { LookbookListPage } from '../features/lookbook/LookbookListPage';
import { LookbookCreatePage } from '../features/lookbook/LookbookCreatePage';
import { LookbookDetailPage } from '../features/lookbook/LookbookDetailPage';
import { LookbookEditPage } from '../features/lookbook/LookbookEditPage';
import { LookbookPreviewPage } from '../features/lookbook/LookbookPreviewPage';
import { NavigationListPage } from '../features/navigation/NavigationListPage';
import { NavigationCreatePage } from '../features/navigation/NavigationCreatePage';
import { NavigationDetailPage } from '../features/navigation/NavigationDetailPage';
import { NavigationEditPage } from '../features/navigation/NavigationEditPage';
import { CustomerListPage } from '../features/customers/CustomerListPage';
import { CustomerDetailPage } from '../features/customers/CustomerDetailPage';
import { CustomerEditPage } from '../features/customers/CustomerEditPage';
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
      // Collections
      {
        path: 'collections',
        element: (
          <ProtectedRoute permission="collections.read">
            <CollectionListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections/new',
        element: (
          <ProtectedRoute permission="collections.create">
            <CollectionCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections/:id',
        element: (
          <ProtectedRoute permission="collections.read">
            <CollectionDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections/:id/edit',
        element: (
          <ProtectedRoute permission="collections.update">
            <CollectionEditPage />
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
      // Antiques & Collectibles
      {
        path: 'antiques',
        element: (
          <ProtectedRoute permission="antiques.read">
            <AntiqueListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'antiques/:id',
        element: (
          <ProtectedRoute permission="antiques.read">
            <AntiqueDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'antiques/:id/edit',
        element: (
          <ProtectedRoute permission="antique.update">
            <AntiqueEditPage />
          </ProtectedRoute>
        ),
      },
      // The Sanskrit Edit
      {
        path: 'sanskrit-edit',
        element: (
          <ProtectedRoute permission="sanskrit.read">
            <SanskritEditListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sanskrit-edit/new',
        element: (
          <ProtectedRoute permission="sanskrit-edit.create">
            <SanskritEditCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sanskrit-edit/:id',
        element: (
          <ProtectedRoute permission="sanskrit.read">
            <SanskritEditDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sanskrit-edit/:id/edit',
        element: (
          <ProtectedRoute permission="sanskrit-edit.update">
            <SanskritEditEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sanskrit',
        element: <Navigate to="/admin/sanskrit-edit" replace />,
      },
      // Artists & Master Makers
      {
        path: 'artists',
        element: (
          <ProtectedRoute permission="artists.read">
            <ArtistListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'artists/new',
        element: (
          <ProtectedRoute permission="artist.create">
            <ArtistCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'artists/:id',
        element: (
          <ProtectedRoute permission="artists.read">
            <ArtistDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'artists/:id/edit',
        element: (
          <ProtectedRoute permission="artist.update">
            <ArtistEditPage />
          </ProtectedRoute>
        ),
      },
      // Content & Editorial — Homepage CMS
      {
        path: 'homepage',
        element: (
          <ProtectedRoute permission="homepage.read">
            <HomepageListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homepage/edit',
        element: (
          <ProtectedRoute permission="homepage.update">
            <HomepageEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homepage/:id/edit',
        element: (
          <ProtectedRoute permission="homepage.update">
            <HomepageEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'homepage/:id/preview',
        element: (
          <ProtectedRoute permission="homepage.read">
            <HomepagePreviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cms',
        element: <Navigate to="/admin/homepage" replace />,
      },

      // Content & Editorial — Journal & Blog
      {
        path: 'journal',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/new',
        element: (
          <ProtectedRoute permission="journal.create">
            <JournalCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/authors',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalAuthorsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/categories',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalCategoriesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/tags',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalTagsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/:id',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/:id/edit',
        element: (
          <ProtectedRoute permission="journal.update">
            <JournalEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'journal/:id/preview',
        element: (
          <ProtectedRoute permission="journal.read">
            <JournalPreviewPage />
          </ProtectedRoute>
        ),
      },
      // Content & Editorial — Lookbook
      {
        path: 'lookbook',
        element: (
          <ProtectedRoute permission="lookbook.read">
            <LookbookListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lookbook/new',
        element: (
          <ProtectedRoute permission="lookbook.create">
            <LookbookCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lookbook/:id',
        element: (
          <ProtectedRoute permission="lookbook.read">
            <LookbookDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lookbook/:id/edit',
        element: (
          <ProtectedRoute permission="lookbook.update">
            <LookbookEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'lookbook/:id/preview',
        element: (
          <ProtectedRoute permission="lookbook.read">
            <LookbookPreviewPage />
          </ProtectedRoute>
        ),
      },
      // Content & Editorial — Navigation Menus
      {
        path: 'navigation',
        element: (
          <ProtectedRoute permission="navigation.read">
            <NavigationListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'navigation/new',
        element: (
          <ProtectedRoute permission="navigation.create">
            <NavigationCreatePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'navigation/:id',
        element: (
          <ProtectedRoute permission="navigation.read">
            <NavigationDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'navigation/:id/edit',
        element: (
          <ProtectedRoute permission="navigation.update">
            <NavigationEditPage />
          </ProtectedRoute>
        ),
      },
      // Media Asset Library & Folders
      {
        path: 'media',
        element: (
          <ProtectedRoute permission="media.read">
            <MediaLibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'media/folders',
        element: (
          <ProtectedRoute permission="media.read">
            <MediaLibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'media/folders/:id',
        element: (
          <ProtectedRoute permission="media.read">
            <MediaLibraryPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'media/orphans',
        element: (
          <ProtectedRoute permission="media.read">
            <MediaOrphansPage />
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
            <CustomerListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <ProtectedRoute permission="customers.read">
            <CustomerDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'customers/:id/edit',
        element: (
          <ProtectedRoute permission="customers.read">
            <CustomerEditPage />
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
