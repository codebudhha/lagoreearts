import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Settings, ExternalLink, Search } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { CommandPalette } from '../global/CommandPalette';
import { NotificationCenter } from '../global/NotificationCenter';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { formatRoleName } from '../../utils/formatters';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { admin, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      success('Logged out successfully');
      navigate('/admin/login', { replace: true });
    } catch {
      error('Failed to log out completely. Please refresh.');
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  const profileDropdownItems: DropdownItem[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User className="w-4 h-4" />,
      onClick: () => navigate('/admin/profile'),
    },
    {
      id: 'settings',
      label: 'Store Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => navigate('/admin/settings'),
    },
    {
      id: 'storefront',
      label: 'View Live Store',
      icon: <ExternalLink className="w-4 h-4" />,
      onClick: () => window.open('/', '_blank'),
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
      onClick: () => setIsLogoutModalOpen(true),
    },
  ];

  return (
    <>
      <header className="h-16 bg-white border-b border-ivory-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Left Section: Mobile Menu + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Breadcrumbs />
        </div>

        {/* Center/Right Section: Global Search + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Shortcut Button */}
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-charcoal-400 hover:text-charcoal-700 bg-ivory-50 hover:bg-ivory-100 border border-ivory-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-champagne-300"
            title="Global Command Palette (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="hidden md:inline font-normal">Search command...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-charcoal-500 bg-white border border-ivory-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Notification Center */}
          <NotificationCenter />

          <div className="h-5 w-px bg-ivory-200 mx-1 hidden sm:block" />

          {/* Profile Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-ivory-100 transition-colors focus:outline-none focus:ring-2 focus:ring-champagne-300"
              >
                <div className="w-8 h-8 rounded-full bg-charcoal-900 text-ivory-50 flex items-center justify-center text-xs font-serif font-bold shadow-xs">
                  {admin?.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-charcoal-900 leading-tight">
                    {admin?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-charcoal-500 font-medium leading-tight">
                    {formatRoleName(admin?.role?.slug || '')}
                  </span>
                </div>
              </button>
            }
            items={profileDropdownItems}
            align="right"
          />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Log Out Confirmation"
        message="Are you sure you want to end your administrative session? You will need to sign in again to access the admin portal."
        confirmLabel="Log Out"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </>
  );
};
