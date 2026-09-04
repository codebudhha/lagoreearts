import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Drawer } from '../ui/Drawer';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const AdminLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    'lagoree_admin_sidebar_collapsed',
    false
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-ivory-50/50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0 sticky top-0 h-screen">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        position="left"
        size="sm"
        className="p-0 border-r-0"
      >
        <Sidebar
          isCollapsed={false}
          onToggleCollapse={() => {}}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          isMobile
        />
      </Drawer>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
