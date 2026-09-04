import React, { useState } from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ProductStatusControlProps {
  status: ProductStatus;
  onChange: (nextStatus: ProductStatus) => void | Promise<void>;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const ProductStatusControl: React.FC<ProductStatusControlProps> = ({
  status,
  onChange,
  disabled = false,
  size = 'md',
}) => {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('product.update');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isControlDisabled = disabled || !canUpdate || isUpdating;

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as ProductStatus;
    if (nextStatus === status) return;

    if (nextStatus === 'ARCHIVED') {
      setShowArchiveModal(true);
      return;
    }

    try {
      setIsUpdating(true);
      await onChange(nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmArchive = async () => {
    try {
      setIsUpdating(true);
      await onChange('ARCHIVED');
      setShowArchiveModal(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <StatusBadge status={status} />
      {canUpdate && (
        <select
          value={status}
          onChange={handleSelectChange}
          disabled={isControlDisabled}
          aria-label="Change product status"
          className={`rounded-md border border-sand-300 bg-white font-serif text-charcoal-800 shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100 disabled:cursor-not-allowed ${
            size === 'sm' ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-sm'
          }`}
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active (Live)</option>
          <option value="INACTIVE">Inactive (Hidden)</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      )}

      <ConfirmDialog
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleConfirmArchive}
        title="Archive Product"
        message="Archiving this product will hide it from the storefront catalog and disable purchases. Existing orders will retain historical line item references. Are you sure you want to archive this product?"
        confirmLabel="Archive Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isUpdating}
      />
    </div>
  );
};
