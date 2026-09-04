import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';
import type { CustomerAddress, CustomerAddressFormData } from '../../lib/api/customers';

const INDIAN_PIN_REGEX = /^[1-9][0-9]{5}$/;

interface AddressEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CustomerAddressFormData) => void | Promise<void>;
  address?: CustomerAddress | null;
  isLoading?: boolean;
}

export const AddressEditorModal: React.FC<AddressEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  address,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerAddressFormData>({
    defaultValues: {
      type: address?.type || 'HOME',
      firstName: address?.firstName || '',
      lastName: address?.lastName || '',
      companyName: address?.companyName || '',
      addressLine1: address?.addressLine1 || '',
      addressLine2: address?.addressLine2 || '',
      landmark: address?.landmark || '',
      city: address?.city || '',
      state: address?.state || '',
      postalCode: address?.postalCode || '',
      country: address?.country || 'INDIA',
      phone: address?.phone || '',
      isDefaultShipping: address?.isDefaultShipping || false,
      isDefaultBilling: address?.isDefaultBilling || false,
    },
  });

  const country = watch('country');

  useEffect(() => {
    if (isOpen) {
      reset({
        type: address?.type || 'HOME',
        firstName: address?.firstName || '',
        lastName: address?.lastName || '',
        companyName: address?.companyName || '',
        addressLine1: address?.addressLine1 || '',
        addressLine2: address?.addressLine2 || '',
        landmark: address?.landmark || '',
        city: address?.city || '',
        state: address?.state || '',
        postalCode: address?.postalCode || '',
        country: address?.country || 'INDIA',
        phone: address?.phone || '',
        isDefaultShipping: address?.isDefaultShipping || false,
        isDefaultBilling: address?.isDefaultBilling || false,
      });
    }
  }, [isOpen, address, reset]);

  const onSubmit = async (data: CustomerAddressFormData) => {
    await onSave(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={address ? 'Edit Address' : 'Add Address'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Address Type"
          {...register('type')}
          options={[
            { value: 'HOME', label: 'Home' },
            { value: 'WORK', label: 'Work' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            {...register('firstName', { required: 'Required' })}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name"
            {...register('lastName', { required: 'Required' })}
            error={errors.lastName?.message}
          />
        </div>

        <Input label="Company Name" {...register('companyName')} />

        <Input
          label="Address Line 1"
          {...register('addressLine1', { required: 'Required' })}
          error={errors.addressLine1?.message}
        />

        <Input label="Address Line 2" {...register('addressLine2')} />
        <Input label="Landmark" {...register('landmark')} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            {...register('city', { required: 'Required' })}
            error={errors.city?.message}
          />
          <Input
            label="State"
            {...register('state', { required: 'Required' })}
            error={errors.state?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Postal Code"
            {...register('postalCode', {
              required: 'Required',
              validate: (v) => {
                if (country === 'INDIA' && !INDIAN_PIN_REGEX.test(v)) {
                  return 'Must be a valid 6-digit Indian PIN code';
                }
                return true;
              },
            })}
            error={errors.postalCode?.message}
          />
          <Input
            label="Country"
            {...register('country')}
          />
        </div>

        <Input
          label="Phone"
          {...register('phone', {
            required: 'Required',
            pattern: {
              value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/,
              message: 'Invalid phone number',
            },
          })}
          error={errors.phone?.message}
        />

        <div className="flex gap-6">
          <Checkbox label="Default Shipping" {...register('isDefaultShipping')} />
          <Checkbox label="Default Billing" {...register('isDefaultBilling')} />
        </div>

        <div className="flex justify-end gap-3 border-t border-ivory-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : address ? 'Save Changes' : 'Add Address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
