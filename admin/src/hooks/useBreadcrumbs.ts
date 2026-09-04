import { useLocation } from 'react-router-dom';
import { BreadcrumbItem } from '../types/navigation';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  collections: 'Collections',
  attributes: 'Attributes',
  antiques: 'Antiques & Collectibles',
  sanskrit: 'The Sanskrit Edit',
  artists: 'Artists & Makers',
  cms: 'Homepage CMS',
  journal: 'Journal & Stories',
  lookbook: 'Lookbook',
  navigation: 'Navigation & Menus',
  media: 'Media Library',
  orders: 'Orders',
  shipping: 'Shipping & Delivery',
  customers: 'Customers',
  reviews: 'Reviews & Ratings',
  cross_sell: 'Cross-sell & Upsell',
  seo: 'SEO & Meta Tags',
  users: 'Admin Users',
  roles: 'Roles & Permissions',
  settings: 'Store Settings',
  profile: 'My Profile',
  new: 'Create New',
  edit: 'Edit',
};

export function useBreadcrumbs(customLabels?: Record<string, string>): BreadcrumbItem[] {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  // If path is /admin or /admin/dashboard
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';

  pathnames.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;

    let label = customLabels?.[segment] || ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    // Skip the root 'admin' if we want cleaner breadcrumbs starting at Dashboard or section, but keeping Admin as root is good
    breadcrumbs.push({
      label,
      path: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
}
