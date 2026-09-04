import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAVIGATION_CONFIG } from '../../config/navigation';
import { useAuth } from '../../hooks/useAuth';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../utils/cn';
import { formatRoleName } from '../../utils/formatters';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  isMobile = false,
}) => {
  const { admin, hasPermission } = useAuth();

  const filteredSections = NAVIGATION_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-charcoal-900 text-ivory-100 transition-all duration-300 select-none border-r border-charcoal-800 z-30',
        isMobile ? 'w-72' : isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-charcoal-800/80 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-champagne-600 text-ivory-50 flex items-center justify-center font-serif font-bold text-base shadow-sm flex-shrink-0">
            L
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col truncate animate-in fade-in duration-200">
              <span className="font-serif tracking-widest text-xs font-bold text-ivory-50">
                LAGOREE ARTS
              </span>
              <span className="text-[10px] tracking-wider text-champagne-400 font-medium uppercase">
                Admin Console
              </span>
            </div>
          )}
        </div>

        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 text-charcoal-400 hover:text-ivory-50 hover:bg-charcoal-800 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-charcoal-700">
        {filteredSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {(!isCollapsed || isMobile) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-2">
                {section.title}
              </p>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;

              const linkElement = (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={isMobile ? onCloseMobile : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-charcoal-800 text-champagne-300 font-semibold shadow-xs'
                        : 'text-charcoal-300 hover:text-ivory-50 hover:bg-charcoal-800/60',
                      isCollapsed && !isMobile && 'justify-center px-0 py-2.5'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-champagne-500 rounded-r" />
                      )}
                      <Icon
                        className={cn(
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-champagne-400'
                            : 'text-charcoal-400 group-hover:text-ivory-100'
                        )}
                      />
                      {(!isCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {(!isCollapsed || isMobile) && item.badge !== undefined && (
                        <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full bg-champagne-900/60 text-champagne-300 border border-champagne-700/50">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );

              if (isCollapsed && !isMobile) {
                return (
                  <Tooltip key={item.href} content={item.label} position="right">
                    {linkElement}
                  </Tooltip>
                );
              }

              return linkElement;
            })}
          </div>
        ))}
      </div>

      {/* User Footer Summary */}
      {admin && (
        <div className="p-3 border-t border-charcoal-800/80 bg-charcoal-950/40 flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg',
              isCollapsed && !isMobile ? 'justify-center' : ''
            )}
          >
            <div className="w-8 h-8 rounded-full bg-champagne-700/40 border border-champagne-600/50 text-champagne-300 font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
              {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-ivory-50 truncate">
                  {admin.name || 'Admin'}
                </span>
                <span className="text-[10px] text-champagne-400 truncate">
                  {formatRoleName(admin.role?.slug || '')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
