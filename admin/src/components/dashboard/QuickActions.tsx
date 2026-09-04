import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  PackagePlus,
  FolderPlus,
  Sparkles,
  ImagePlus,
  FilePlus2,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export interface QuickActionItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  permission: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'add-product',
    title: 'Add Artwork',
    desc: 'Create masterwork listing with variants & pricing',
    href: '/admin/products',
    permission: 'product.create',
    icon: PackagePlus,
  },
  {
    id: 'add-category',
    title: 'Add Category',
    desc: 'Structure taxonomy & filter facets',
    href: '/admin/categories',
    permission: 'category.create',
    icon: FolderPlus,
  },
  {
    id: 'create-collection',
    title: 'Curate Collection',
    desc: 'Assemble seasonal edits & themes',
    href: '/admin/collections',
    permission: 'collection.create',
    icon: Sparkles,
  },
  {
    id: 'upload-media',
    title: 'Upload Media',
    desc: 'High-res photography & authenticity docs',
    href: '/admin/media',
    permission: 'media.create',
    icon: ImagePlus,
  },
  {
    id: 'new-journal',
    title: 'Write Journal Post',
    desc: 'Publish heritage essays & art stories',
    href: '/admin/journal',
    permission: 'journal.create',
    icon: FilePlus2,
  },
  {
    id: 'new-lookbook',
    title: 'Create Lookbook',
    desc: 'Curate editorial lifestyle scenes',
    href: '/admin/lookbook',
    permission: 'lookbook.create',
    icon: Camera,
  },
];

export const QuickActions: React.FC = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const permittedActions = QUICK_ACTIONS.filter((action) =>
    hasPermission(action.permission)
  );

  if (permittedActions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-champagne-700" />
        <h3 className="text-sm font-serif font-bold text-charcoal-900">Quick Actions</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {permittedActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => navigate(action.href)}
              className="group p-4 bg-white rounded-xl border border-ivory-200/80 hover:border-champagne-400 hover:shadow-md transition-all duration-200 text-left flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-lg bg-champagne-50 group-hover:bg-champagne-100 text-champagne-700 transition-colors flex-shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-charcoal-900 group-hover:text-champagne-700 transition-colors">
                  {action.title}
                </h4>
                <p className="text-[11px] text-charcoal-500 mt-0.5 leading-snug line-clamp-1">
                  {action.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
