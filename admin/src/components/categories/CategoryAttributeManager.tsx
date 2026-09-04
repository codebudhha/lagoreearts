import React, { useState, useMemo } from 'react';
import {
  useCategoryAttributesList,
  useAddCategoryAttribute,
  useUpdateCategoryAttribute,
  useRemoveCategoryAttribute,
} from '../../hooks/useCategories';
import { useAttributesList } from '../../hooks/useAttributes';
import { CategoryAttributeBinding } from '../../lib/api/categories';
import { AttributeTypeBadge } from '../attributes/AttributeTypeBadge';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Skeleton } from '../feedback/Skeleton';
import { Plus, Trash2, Sliders } from 'lucide-react';

export interface CategoryAttributeManagerProps {
  categoryId: string;
  readOnly?: boolean;
}

export const CategoryAttributeManager: React.FC<CategoryAttributeManagerProps> = ({
  categoryId,
  readOnly = false,
}) => {
  const { data: bindings = [], isLoading: isLoadingBindings } =
    useCategoryAttributesList(categoryId);

  const { data: allAttributesData } =
    useAttributesList({ limit: 100 });

  const addMutation = useAddCategoryAttribute();
  const updateMutation = useUpdateCategoryAttribute();
  const removeMutation = useRemoveCategoryAttribute();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [addSortOrder, setAddSortOrder] = useState('0');
  const [addIsRequired, setAddIsRequired] = useState(false);
  const [addIsVisible, setAddIsVisible] = useState(true);

  const [removingBinding, setRemovingBinding] =
    useState<CategoryAttributeBinding | null>(null);

  // Filter out attributes that are already assigned
  const assignedAttributeIds = useMemo(() => {
    return new Set(bindings.map((b) => b.attributeId));
  }, [bindings]);

  const availableAttributes = useMemo(() => {
    if (!allAttributesData?.items) return [];
    return allAttributesData.items.filter((a) => !assignedAttributeIds.has(a.id));
  }, [allAttributesData, assignedAttributeIds]);

  const handleOpenAdd = () => {
    setSelectedAttributeId(availableAttributes[0]?.id || '');
    setAddSortOrder(String(bindings.length * 10));
    setAddIsRequired(false);
    setAddIsVisible(true);
    setIsAddOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttributeId) return;

    await addMutation.mutateAsync({
      categoryId,
      payload: {
        attributeId: selectedAttributeId,
        sortOrder: parseInt(addSortOrder, 10) || 0,
        isRequired: addIsRequired,
        isVisible: addIsVisible,
      },
    });

    setIsAddOpen(false);
  };

  const handleToggleRequired = async (binding: CategoryAttributeBinding) => {
    if (readOnly) return;
    await updateMutation.mutateAsync({
      categoryId,
      attributeId: binding.attributeId,
      payload: {
        isRequired: !binding.isRequired,
      },
    });
  };

  const handleToggleVisible = async (binding: CategoryAttributeBinding) => {
    if (readOnly) return;
    await updateMutation.mutateAsync({
      categoryId,
      attributeId: binding.attributeId,
      payload: {
        isVisible: !binding.isVisible,
      },
    });
  };

  const handleUpdateSortOrder = async (
    binding: CategoryAttributeBinding,
    newOrder: number
  ) => {
    if (readOnly) return;
    await updateMutation.mutateAsync({
      categoryId,
      attributeId: binding.attributeId,
      payload: {
        sortOrder: newOrder,
      },
    });
  };

  const handleConfirmRemove = async () => {
    if (!removingBinding) return;
    await removeMutation.mutateAsync({
      categoryId,
      attributeId: removingBinding.attributeId,
    });
    setRemovingBinding(null);
  };

  if (isLoadingBindings) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-serif font-semibold text-charcoal-900">
            Assigned Category Attributes & Filters
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Attributes configured here will be inherited and requested for products belonging to this category.
          </p>
        </div>

        {!readOnly && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            disabled={availableAttributes.length === 0}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assign Attribute
          </Button>
        )}
      </div>

      {bindings.length === 0 ? (
        <div className="p-8 bg-sand-50/50 rounded-lg border border-dashed border-sand-300 text-center">
          <Sliders className="w-8 h-8 mx-auto text-charcoal-400 mb-2 opacity-60" />
          <h4 className="text-sm font-medium text-charcoal-800 font-serif">
            No Attributes Assigned
          </h4>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto font-sans">
            Assign existing global attributes (e.g., Material, Period, Dimensions, Technique) to define custom product specs and storefront facet filters.
          </p>
          {!readOnly && availableAttributes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Assign First Attribute
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-sand-200 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-sand-200 text-left text-sm">
            <thead className="bg-sand-50 text-xs font-semibold text-charcoal-600 uppercase tracking-wider font-sans">
              <tr>
                <th className="py-2.5 px-4">Attribute</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-center">Required on Product</th>
                <th className="py-2.5 px-4 text-center">Storefront Filter</th>
                <th className="py-2.5 px-4">Display Order</th>
                {!readOnly && <th className="py-2.5 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 font-serif">
              {bindings.map((b) => (
                <tr key={b.id || b.attributeId} className="hover:bg-sand-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-charcoal-900">
                      {b.attribute?.name || b.attributeId}
                    </div>
                    {b.attribute?.slug && (
                      <div className="text-xs text-charcoal-400 font-mono">
                        {b.attribute.slug}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {b.attribute?.type && (
                      <AttributeTypeBadge type={b.attribute.type} size="sm" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={b.isRequired}
                        onChange={() => handleToggleRequired(b)}
                        disabled={readOnly || updateMutation.isPending}
                        aria-label="Toggle Required"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={b.isVisible}
                        onChange={() => handleToggleVisible(b)}
                        disabled={readOnly || updateMutation.isPending}
                        aria-label="Toggle Visible in Filters"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      defaultValue={b.sortOrder ?? 0}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val !== b.sortOrder) {
                          handleUpdateSortOrder(b, val);
                        }
                      }}
                      disabled={readOnly}
                      className="w-16 px-2 py-1 text-xs border border-sand-300 rounded font-mono text-center focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </td>
                  {!readOnly && (
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setRemovingBinding(b)}
                        className="p-1.5 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove Attribute Assignment"
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

      {/* Assign Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Assign Attribute to Category"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
              Select Attribute <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedAttributeId}
              onChange={(e) => setSelectedAttributeId(e.target.value)}
              className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
              required
            >
              {availableAttributes.map((attr) => (
                <option key={attr.id} value={attr.id}>
                  {attr.name} ({attr.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
                Display / Filter Sort Order
              </label>
              <input
                type="number"
                value={addSortOrder}
                onChange={(e) => setAddSortOrder(e.target.value)}
                className="w-full text-sm bg-white border border-sand-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gold-500 font-serif"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <Switch
                checked={addIsRequired}
                onChange={(checked) => setAddIsRequired(checked)}
              />
              <span className="text-sm font-serif text-charcoal-800">
                Required attribute for products in this category
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <Switch
                checked={addIsVisible}
                onChange={(checked) => setAddIsVisible(checked)}
              />
              <span className="text-sm font-serif text-charcoal-800">
                Visible as a storefront facet filter
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-sand-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={addMutation.isPending}
            >
              Assign Attribute
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(removingBinding)}
        onClose={() => setRemovingBinding(null)}
        onConfirm={handleConfirmRemove}
        title="Unassign Attribute"
        message={`Are you sure you want to unassign "${removingBinding?.attribute?.name || 'this attribute'}" from this category? Existing product values will remain stored but the attribute will no longer be listed under this category's specifications or dynamic filters.`}
        confirmLabel="Unassign"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
};
