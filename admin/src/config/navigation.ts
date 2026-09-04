import {
  LayoutDashboard,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Hourglass,
  BookOpen,
  Palette,
  LayoutTemplate,
  FileText,
  Camera,
  Menu,
  Image,
  ShoppingBag,
  Truck,
  Users,
  Repeat,
  Star,
  Search,
  UserCheck,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { NavSection } from '../types/navigation';

export const NAVIGATION_CONFIG: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'Catalogue & Heritage',
    items: [
      {
        label: 'Products',
        href: '/admin/products',
        icon: Package,
        permission: 'products.read',
      },
      {
        label: 'Categories',
        href: '/admin/categories',
        icon: Layers,
        permission: 'categories.read',
      },
      {
        label: 'Collections',
        href: '/admin/collections',
        icon: Sparkles,
        permission: 'collections.read',
      },
      {
        label: 'Attributes & Filters',
        href: '/admin/attributes',
        icon: Sliders,
        permission: 'attributes.read',
      },
      {
        label: 'Antiques & Collectibles',
        href: '/admin/antiques',
        icon: Hourglass,
        permission: 'antiques.read',
      },
      {
        label: 'The Sanskrit Edit',
        href: '/admin/sanskrit',
        icon: BookOpen,
        permission: 'sanskrit.read',
      },
      {
        label: 'Artists & Makers',
        href: '/admin/artists',
        icon: Palette,
        permission: 'artists.read',
      },
    ],
  },
  {
    title: 'Content & Editorial',
    items: [
      {
        label: 'Homepage CMS',
        href: '/admin/cms',
        icon: LayoutTemplate,
        permission: 'cms.read',
      },
      {
        label: 'Journal & Stories',
        href: '/admin/journal',
        icon: FileText,
        permission: 'journal.read',
      },
      {
        label: 'Lookbook',
        href: '/admin/lookbook',
        icon: Camera,
        permission: 'lookbook.read',
      },
      {
        label: 'Navigation Menus',
        href: '/admin/navigation',
        icon: Menu,
        permission: 'navigation.read',
      },
      {
        label: 'Media Library',
        href: '/admin/media',
        icon: Image,
        permission: 'media.read',
      },
    ],
  },
  {
    title: 'Sales & Operations',
    items: [
      {
        label: 'Orders',
        href: '/admin/orders',
        icon: ShoppingBag,
        permission: 'orders.read',
      },
      {
        label: 'Shipping & Delivery',
        href: '/admin/shipping',
        icon: Truck,
        permission: 'shipping.read',
      },
      {
        label: 'Customers',
        href: '/admin/customers',
        icon: Users,
        permission: 'customers.read',
      },
    ],
  },
  {
    title: 'Merchandising & Feedback',
    items: [
      {
        label: 'Cross-sell & Upsell',
        href: '/admin/cross-sell',
        icon: Repeat,
        permission: 'cross_sell.read',
      },
      {
        label: 'Reviews & Ratings',
        href: '/admin/reviews',
        icon: Star,
        permission: 'reviews.read',
      },
      {
        label: 'SEO & Meta Tags',
        href: '/admin/seo',
        icon: Search,
        permission: 'seo.read',
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Admin Users',
        href: '/admin/users',
        icon: UserCheck,
        permission: 'users.read',
      },
      {
        label: 'Roles & Permissions',
        href: '/admin/roles',
        icon: ShieldCheck,
        permission: 'roles.read',
      },
      {
        label: 'Store Settings',
        href: '/admin/settings',
        icon: Settings,
        permission: 'settings.read',
      },
    ],
  },
];
