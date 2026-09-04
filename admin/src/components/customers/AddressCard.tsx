import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import type { CustomerAddress } from '../../lib/api/customers';

interface AddressCardProps {
  address: CustomerAddress;
  onEdit?: (address: CustomerAddress) => void;
  onDelete?: (address: CustomerAddress) => void;
  onSetDefaultShipping?: (address: CustomerAddress) => void;
  onSetDefaultBilling?: (address: CustomerAddress) => void;
  canEdit?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetDefaultShipping,
  onSetDefaultBilling,
  canEdit = true,
}) => {
  return (
    <div className="rounded-lg border border-ivory-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-charcoal-400" />
          <span className="text-sm font-medium text-charcoal-900">{address.type}</span>
          {address.isDefaultShipping && (
            <span className="inline-flex items-center gap-1 rounded-full bg-champagne-50 px-2 py-0.5 text-xs font-medium text-champagne-700 ring-1 ring-inset ring-champagne-600/20">
              <Star className="h-3 w-3" />
              Shipping
            </span>
          )}
          {address.isDefaultBilling && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sand-50 px-2 py-0.5 text-xs font-medium text-sand-700 ring-1 ring-inset ring-sand-600/20">
              <Star className="h-3 w-3" />
              Billing
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 text-sm text-charcoal-600">
        <p className="font-medium text-charcoal-900">
          {address.firstName} {address.lastName}
        </p>
        {address.companyName && <p>{address.companyName}</p>}
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        {address.landmark && <p>Landmark: {address.landmark}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
        <p>Phone: {address.phone}</p>
      </div>

      {canEdit && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ivory-100 pt-3">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(address)}>
              Edit
            </Button>
          )}
          {!address.isDefaultShipping && onSetDefaultShipping && (
            <Button variant="outline" size="sm" onClick={() => onSetDefaultShipping(address)}>
              Set Default Shipping
            </Button>
          )}
          {!address.isDefaultBilling && onSetDefaultBilling && (
            <Button variant="outline" size="sm" onClick={() => onSetDefaultBilling(address)}>
              Set Default Billing
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(address)} className="text-red-600 hover:text-red-700">
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
