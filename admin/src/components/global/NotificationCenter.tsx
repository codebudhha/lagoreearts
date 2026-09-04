import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'order' | 'review' | 'stock' | 'system';
  link?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // In this phase, backend notifications are not yet implemented.
  // We provide a fully structured UI foundation with empty state ("You're all caught up").
  const [notifications] = useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-charcoal-500 hover:text-charcoal-900 hover:bg-ivory-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-champagne-300"
        aria-label="Notifications"
        title="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-champagne-600 rounded-full ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-ivory-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ivory-100 bg-ivory-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-bold text-charcoal-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-champagne-100 text-champagne-800 font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="text-[11px] font-semibold text-champagne-700 hover:text-champagne-900 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List or Empty State */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-ivory-100 text-charcoal-400 flex items-center justify-center mb-2.5">
                  <BellOff className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-charcoal-900">You're all caught up</h4>
                <p className="text-[11px] text-charcoal-500 mt-1 max-w-xs leading-relaxed">
                  No new operational notifications or alerts at this moment.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'p-3.5 border-b border-ivory-100 hover:bg-ivory-50/60 transition-colors',
                    !n.read && 'bg-champagne-50/30'
                  )}
                >
                  <h5 className="text-xs font-semibold text-charcoal-900">{n.title}</h5>
                  <p className="text-[11px] text-charcoal-600 mt-0.5">{n.message}</p>
                  <span className="text-[10px] text-charcoal-400 mt-1 block">{n.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
