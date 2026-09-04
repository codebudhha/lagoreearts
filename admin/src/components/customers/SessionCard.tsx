import React from 'react';
import { Monitor, Smartphone, Globe, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { CustomerSession } from '../../lib/api/customers';

interface SessionCardProps {
  session: CustomerSession;
  onRevoke?: (session: CustomerSession) => void;
  canRevoke?: boolean;
}

function parseUserAgent(ua: string | null | undefined): { icon: React.ReactNode; label: string } {
  if (!ua) return { icon: <Globe className="h-4 w-4" />, label: 'Unknown Device' };
  const lower = ua.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(lower)) {
    return { icon: <Smartphone className="h-4 w-4" />, label: 'Mobile Device' };
  }
  return { icon: <Monitor className="h-4 w-4" />, label: 'Desktop Browser' };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onRevoke,
  canRevoke = true,
}) => {
  const { icon, label } = parseUserAgent(session.userAgent);

  return (
    <div className="flex items-center justify-between rounded-lg border border-ivory-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ivory-100 text-charcoal-500">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-charcoal-900">{label}</p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-charcoal-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last used {formatRelativeTime(session.lastUsedAt)}
            </span>
            {session.ipAddress && <span>{session.ipAddress}</span>}
          </div>
          {!session.isActive && (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" />
              {session.revokedAt ? 'Revoked' : 'Expired'}
            </div>
          )}
        </div>
      </div>

      {canRevoke && session.isActive && onRevoke && (
        <Button variant="outline" size="sm" onClick={() => onRevoke(session)}>
          Revoke
        </Button>
      )}
    </div>
  );
};
