import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'line' | 'pill';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'line',
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto scrollbar-none',
        variant === 'line' ? 'border-b border-ivory-200' : 'bg-ivory-100/70 p-1 rounded-xl',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs font-semibold transition-all duration-150',
              variant === 'line' && [
                'border-b-2 -mb-px',
                isActive
                  ? 'border-charcoal-900 text-charcoal-900 font-semibold'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800 hover:border-ivory-300',
              ],
              variant === 'pill' && [
                'rounded-lg',
                isActive
                  ? 'bg-white text-charcoal-900 shadow-sm font-semibold'
                  : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/50',
              ],
              tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            <span>{tab.label}</span>
            {tab.badge && <span>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
