import type { ComponentType } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string | number;
  children?: NavItem[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
