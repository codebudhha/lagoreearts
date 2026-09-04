import React from 'react';
import { Badge } from '../ui/Badge';
import { AntiqueAuthenticityStatus } from '../../lib/api/antiques';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface AuthenticityBadgeProps {
  status: AntiqueAuthenticityStatus;
  isCertified?: boolean;
  className?: string;
}

export const AuthenticityBadge: React.FC<AuthenticityBadgeProps> = ({
  status,
  isCertified = false,
  className,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          variant: 'success' as const,
          label: 'Verified Authentic',
          icon: ShieldCheck,
        };
      case 'UNVERIFIED':
        return {
          variant: 'warning' as const,
          label: 'Unverified',
          icon: ShieldAlert,
        };
      case 'UNKNOWN':
      default:
        return {
          variant: 'secondary' as const,
          label: 'Unknown',
          icon: Shield,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      <Badge variant={config.variant} size="sm">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>

      {isCertified && (
        <Badge variant="champagne" size="sm">
          Certified
        </Badge>
      )}
    </div>
  );
};
