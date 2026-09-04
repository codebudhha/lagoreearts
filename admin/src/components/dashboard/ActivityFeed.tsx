import React from 'react';
import { History, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ActivityFeed: React.FC = () => {
  const { hasPermission } = useAuth();
  const canViewAudit = hasPermission('audit.view');

  if (!canViewAudit) return null;

  return (
    <div className="bg-white rounded-xl border border-ivory-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
      <div className="flex items-center justify-between pb-4 border-b border-ivory-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-charcoal-100 text-charcoal-800">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-charcoal-900">Administrative Log</h3>
            <p className="text-xs text-charcoal-500">Recent system operations and governance audit</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Active</span>
        </div>
      </div>

      <div className="py-8 text-center">
        <p className="text-xs text-charcoal-500 italic">
          Activity history will appear here as administrative actions occur.
        </p>
        <p className="text-[11px] text-charcoal-400 mt-1">
          Full audit inspection console will be expanded in System Administration.
        </p>
      </div>
    </div>
  );
};
