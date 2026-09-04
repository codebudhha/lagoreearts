import React from 'react';
import { Construction } from 'lucide-react';
import { PageContainer } from './PageContainer';
import { Card } from '../ui/Card';

export interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  permissionRequired?: string;
  moduleName: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  subtitle,
  permissionRequired,
  moduleName,
}) => {
  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      breadcrumbs={[
        { label: 'Admin', path: '/admin/dashboard' },
        { label: title },
      ]}
    >
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="w-14 h-14 rounded-2xl bg-champagne-50 text-champagne-700 flex items-center justify-center mb-4 border border-champagne-200 shadow-xs">
          <Construction className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-serif font-bold text-charcoal-900">
          {moduleName} Console
        </h3>
        <p className="text-xs text-charcoal-500 max-w-md mt-1.5 mb-4 leading-relaxed">
          The administrative interface for {moduleName.toLowerCase()} is scheduled for implementation in Phase 2. Foundation, shell navigation, and role security are fully operational.
        </p>
        {permissionRequired && (
          <div className="text-[11px] font-mono text-charcoal-500 bg-ivory-100 px-3 py-1 rounded-md border border-ivory-200">
            Guarded by permission: <span className="font-semibold text-charcoal-800">{permissionRequired}</span>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};
