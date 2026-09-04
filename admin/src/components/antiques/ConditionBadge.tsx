import React from 'react';
import { Badge } from '../ui/Badge';
import { AntiqueCondition } from '../../lib/api/antiques';

interface ConditionBadgeProps {
  condition?: AntiqueCondition | null;
  className?: string;
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({
  condition,
  className,
}) => {
  if (!condition) {
    return <span className="text-charcoal-400 italic text-xs">—</span>;
  }

  const getVariant = () => {
    switch (condition) {
      case 'EXCELLENT':
        return 'success' as const;
      case 'VERY_GOOD':
      case 'GOOD':
        return 'champagne' as const;
      case 'FAIR':
        return 'warning' as const;
      case 'POOR':
      case 'FOR_RESTORATION':
        return 'danger' as const;
      case 'RESTORED':
        return 'secondary' as const;
      default:
        return 'secondary' as const;
    }
  };

  const formatLabel = (c: AntiqueCondition) => {
    switch (c) {
      case 'EXCELLENT':
        return 'Excellent';
      case 'VERY_GOOD':
        return 'Very Good';
      case 'GOOD':
        return 'Good';
      case 'FAIR':
        return 'Fair';
      case 'POOR':
        return 'Poor';
      case 'RESTORED':
        return 'Restored';
      case 'FOR_RESTORATION':
        return 'For Restoration';
      default:
        return c;
    }
  };

  return (
    <Badge variant={getVariant()} size="sm" className={className}>
      {formatLabel(condition)}
    </Badge>
  );
};
