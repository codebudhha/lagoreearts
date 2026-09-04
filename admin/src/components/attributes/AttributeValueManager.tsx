import React, { useState } from 'react';
import {
  AdminAttribute,
  AttributeValue,
  CreateAttributeValuePayload,
  UpdateAttributeValuePayload,
} from '../../lib/api/attributes';
import {
  useAttributeValuesList,
  useCreateAttributeValue,
  useUpdateAttributeValue,
  useDeleteAttributeValue,
} from '../../hooks/useAttributes';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { StatusBadge } from '../ui/StatusBadge';
import { Skeleton } from '../feedback/Skeleton';
import { Plus, Edit2, Trash2, ListOrdered, Tag } from 'lucide-react';

export interface AttributeValueManagerProps {
  attribute: AdminAttribute;
  readOnly?: boolean;
}

export const AttributeValueManager: React.FC<AttributeValueManagerProps> = ({
  attribute,
  readOnly = false,
}) => {
  const isValueBased = attribute.type === 'SELECT' || attribute.type === 'MULTI_SELECT';

  const { data: valuesData, isLoading } = useAttributeValuesList(
    attribute.id,
    undefined,
    isValueBased
  );

  const createMutation = useCreateAttributeValue();
  const updateMutation = useUpdateAttributeValue();
  const deleteMutation = useDeleteAttributeValue();

  // Modal / Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [deletingValue, setDeletingValue] = useState<AttributeValue | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const openCreateModal = () => {
    setFormName('');
    setFormSlug('');
    setFormSortOrder(String((valuesData?.length || 0) * 10));
    setFormStatus('ACTIVE');
    setIsCreateOpen(true);
  };

  const openEditModal = (val: AttributeValue) => {
    setEditingValue(val);
    setFormName(val.name);
    setFormSlug(val.slug || '');
    setFormSortOrder(String(val.sortOrder ?? 0));
    setFormStatus(val.status || 'ACTIVE');
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: CreateAttributeValuePayload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      sortOrder: parseInt(formSortOrder, 10) || 0,
      status: formStatus,
    };

    await createMutation.mutateAsync({
      attributeId: attribute.id,
      payload,
    });
    setIsCreateOpen(false);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingValue || !formName.trim()) return;

    const payload: UpdateAttributeValuePayload = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      sortOrder: parseInt(formSortOrder, 10) || 0,
      status: formStatus,
    };

    await updateMutation.mutateAsync({
      attributeId: attribute.id,
      valueId: editingValue.id,
      payload,
    });
    setEditingValue(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingValue) return;
    await deleteMutation.mutateAsync({
      attributeId: attribute.id,
      valueId: deletingValue.id,
    });
    setDeletingValue(null);
  };

  if (!isValueBased) {
    return (
      <div className="p-8 bg-sand-50/60 rounded-lg border border-sand-200 text-center">
        <Tag className="w-8 h-8 mx-auto text-charcoal-400 mb-2" />
        <h4 className="text-sm font-semibold text-charcoal-800 font-serif">
          Values Not Required for {attribute.type}
        </h4>
        <p className="text-xs text-charcoal-500 mt-1 max-w-md mx-auto font-sans">
          This attribute accepts direct input on products ({attribute.type.toLowerCase()}). Pre-configured option values are only used for <strong>SELECT</strong> and <strong>MULTI_SELECT</strong> attributes.
        </p>
      </div>
    );
  }

  const items = valuesData || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-serif font-semibold text-charcoal-900">
            Attribute Option Values
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Defined choices available for selection on products.
          </p>
        </div>

        {!readOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Value
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 bg-sand-50/50 rounded-lg border border-dashed border-sand-300 text-center">
          <ListOrdered className="w-8 h-8 mx-auto text-charcoal-400 mb-2 opacity-60" />
          <h4 className="text-sm font-medium text-charcoal-800 font-serif">
            No Option Values Configured
          </h4>
          <p className="text-xs text-charcoal-500 mt-1 font-sans">
            Add selectable values (e.g. "Bronze", "Brass", "Teak Wood", "Canvas") for products to choose from.
          </p>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add First Value
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-sand-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-sand-200 text-left text-sm">
            <thead className="bg-sand-50 text-xs font-semibold text-charcoal-600 uppercase tracking-wider font-sans">
              <tr>
                <th className="py-2.5 px-4">Value Name</th>
                <th className="py-2.5 px-4">Slug / Code</th>
                <th className="py-2.5 px-4">Order</th>
                <th className="py-2.5 px-4">Status</th>
                {!readOnly && <th className="py-2.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 font-serif">
              {items.map((val) => (
                <tr key={val.id} className="hover:bg-sand-50/60 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-charcoal-900">
                    {val.name}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-mono text-charcoal-500">
                    {val.slug}
                  </td>
                  <td className="py-2.5 px-4 text-xs font-mono text-charcoal-600">
                    {val.sortOrder ?? 0}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={val.status} size="sm" />
                  </td>
                  {!readOnly && (
                    <td className="py-2.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(val)}
                        className="p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                        title="Edit Value"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingValue(val)}
                        className="p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Value"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Option Value"
        size="md"
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          <Input
            label="Value Name"
            placeholder="e.g. Pure Teak Wood"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (!formSlug) {
                setFormSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                );
              }
            }}
            required
            autoFocus
          />

          <Input
            label="Slug / Identifier (Optional)"
            placeholder="e.g. pure-teak-wood"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            helperText="Leave empty to automatically generate from name"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-sand-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Add Value
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={Boolean(editingValue)}
        onClose={() => setEditingValue(null)}
        title="Edit Option Value"
        size="md"
      >
        <form onSubmit={handleSaveUpdate} className="space-y-4">
          <Input
            label="Value Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Slug / Identifier"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Sort Order"
              type="number"
              value={formSortOrder}
              onChange={(e) => setFormSortOrder(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-sand-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingValue(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingValue)}
        onClose={() => setDeletingValue(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Option Value"
        message={`Are you sure you want to delete "${deletingValue?.name}"? Any products assigned this value may lose this choice.`}
        confirmLabel="Delete Value"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
