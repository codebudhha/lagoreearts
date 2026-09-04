import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Sparkles,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Image,
  Star,
  FileText,
  Camera,
  Settings,
  ShieldCheck,
  PlusCircle,
  Truck,
  Sliders,
  Hourglass,
  BookOpen,
  Palette,
  LayoutTemplate,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../utils/cn';

export interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'Catalogue';
  href: string;
  permission?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

export const COMMAND_ITEMS: CommandItem[] = [
  // Navigation
  { id: 'nav-dashboard', title: 'Dashboard', category: 'Navigation', href: '/admin/dashboard', icon: Sparkles },
  { id: 'nav-products', title: 'Products & Artworks', category: 'Navigation', href: '/admin/products', permission: 'product.view', icon: Package },
  { id: 'nav-categories', title: 'Categories', category: 'Navigation', href: '/admin/categories', permission: 'category.view', icon: Layers },
  { id: 'nav-collections', title: 'Curated Collections', category: 'Navigation', href: '/admin/collections', permission: 'collection.view', icon: Sparkles },
  { id: 'nav-attributes', title: 'Attributes & Filters', category: 'Navigation', href: '/admin/attributes', permission: 'attribute.view', icon: Sliders },
  { id: 'nav-antiques', title: 'Antiques & Collectibles', category: 'Navigation', href: '/admin/antiques', permission: 'antique.view', icon: Hourglass },
  { id: 'nav-sanskrit', title: 'The Sanskrit Edit', category: 'Navigation', href: '/admin/sanskrit', permission: 'sanskrit-edit.view', icon: BookOpen },
  { id: 'nav-artists', title: 'Artists & Makers', category: 'Navigation', href: '/admin/artists', permission: 'artist.view', icon: Palette },
  { id: 'nav-cms', title: 'Homepage CMS', category: 'Navigation', href: '/admin/cms', permission: 'cms.view', icon: LayoutTemplate },
  { id: 'nav-journal', title: 'Journal & Stories', category: 'Navigation', href: '/admin/journal', permission: 'journal.view', icon: FileText },
  { id: 'nav-lookbook', title: 'Lookbook', category: 'Navigation', href: '/admin/lookbook', permission: 'lookbook.view', icon: Camera },
  { id: 'nav-navigation', title: 'Navigation Menus', category: 'Navigation', href: '/admin/navigation', permission: 'navigation.view', icon: Menu },
  { id: 'nav-media', title: 'Media Library', category: 'Navigation', href: '/admin/media', permission: 'media.view', icon: Image },
  { id: 'nav-orders', title: 'Orders & Shipments', category: 'Navigation', href: '/admin/orders', permission: 'order.view', icon: ShoppingBag },
  { id: 'nav-shipping', title: 'Shipping & Delivery', category: 'Navigation', href: '/admin/shipping', permission: 'shipping.view', icon: Truck },
  { id: 'nav-customers', title: 'Patrons & Customers', category: 'Navigation', href: '/admin/customers', permission: 'customer.view', icon: Users },
  { id: 'nav-reviews', title: 'Reviews & Ratings', category: 'Navigation', href: '/admin/reviews', permission: 'review.view', icon: Star },
  { id: 'nav-roles', title: 'Roles & Permissions', category: 'Navigation', href: '/admin/roles', permission: 'roles.read', icon: ShieldCheck },
  { id: 'nav-settings', title: 'Store Settings', category: 'Navigation', href: '/admin/settings', permission: 'settings.read', icon: Settings },

  // Actions
  { id: 'act-add-product', title: 'Add New Artwork', category: 'Actions', href: '/admin/products', permission: 'product.create', icon: PlusCircle },
  { id: 'act-add-category', title: 'Add New Category', category: 'Actions', href: '/admin/categories', permission: 'category.create', icon: PlusCircle },
  { id: 'act-new-collection', title: 'Curate New Collection', category: 'Actions', href: '/admin/collections', permission: 'collection.create', icon: PlusCircle },
  { id: 'act-upload-media', title: 'Upload Media Asset', category: 'Actions', href: '/admin/media', permission: 'media.create', icon: PlusCircle },
  { id: 'act-new-journal', title: 'Write Journal Post', category: 'Actions', href: '/admin/journal', permission: 'journal.create', icon: PlusCircle },
  { id: 'act-new-lookbook', title: 'Create Lookbook', category: 'Actions', href: '/admin/lookbook', permission: 'lookbook.create', icon: PlusCircle },
];

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items by permissions and search query
  const filteredItems = useMemo(() => {
    return COMMAND_ITEMS.filter((item) => {
      // Check permission
      if (item.permission && !hasPermission(item.permission)) {
        return false;
      }
      if (!debouncedSearch.trim()) return true;

      const q = debouncedSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [debouncedSearch, hasPermission]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          onClose(); // Inverted if caller opens it
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? (filteredItems.length ? filteredItems.length - 1 : 0) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].href);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-ivory-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-ivory-200 bg-ivory-50/50">
          <Search className="w-5 h-5 text-charcoal-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, modules, and quick actions... (Ctrl + K)"
            className="w-full bg-transparent text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-charcoal-400 bg-white border border-ivory-200 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-ivory-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-500">
              No matching commands or actions found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    navigate(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-charcoal-900 text-ivory-50'
                      : 'text-charcoal-800 hover:bg-ivory-100'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        'w-4 h-4 flex-shrink-0',
                        isSelected ? 'text-champagne-300' : 'text-charcoal-400'
                      )}
                    />
                    <span className="text-xs font-semibold truncate">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase px-2 py-0.5 rounded-md border',
                        isSelected
                          ? 'border-charcoal-700 bg-charcoal-800 text-champagne-300'
                          : 'border-ivory-200 bg-ivory-50 text-charcoal-500'
                      )}
                    >
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-champagne-300 ml-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-ivory-50/80 border-t border-ivory-100 flex items-center justify-between text-[11px] text-charcoal-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-serif italic text-champagne-700">Lagoree Arts Admin</span>
        </div>
      </div>
    </div>
  );
};
