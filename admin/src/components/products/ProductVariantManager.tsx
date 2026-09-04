import React, { useState } from 'react';
import {
  useProductOptions,
  useCreateProductOption,
  useDeleteProductOption,
  useCreateProductOptionValue,
  useDeleteProductOptionValue,
  useProductVariantsList,
  useCreateProductVariant,
  useUpdateProductVariant,
  useUpdateProductVariantStatus,
  useDeleteProductVariant,
} from '../../hooks/useProductVariants';
import { ProductVariantItem } from '../../lib/api/variants';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Sparkles,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';

export interface ProductVariantManagerProps {
  productId: string;
  basePrice: number;
  baseSku: string;
  disabled?: boolean;
}

export const ProductVariantManager: React.FC<ProductVariantManagerProps> = ({
  productId,
  basePrice,
  baseSku,
  disabled = false,
}) => {
  const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValuesStr, setNewOptionValuesStr] = useState('');

  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false);
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState<string>('');
  const [newVariantStock, setNewVariantStock] = useState<string>('10');
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});

  const [editingVariant, setEditingVariant] = useState<ProductVariantItem | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<string | null>(null);
  const [optionToDelete, setOptionToDelete] = useState<string | null>(null);

  // Queries
  const { data: options = [], isLoading: isLoadingOptions } = useProductOptions(productId);
  const { data: variants = [], isLoading: isLoadingVariants } = useProductVariantsList(productId);

  // Mutations
  const createOptionMutation = useCreateProductOption();
  const deleteOptionMutation = useDeleteProductOption();
  const createValueMutation = useCreateProductOptionValue();
  const deleteValueMutation = useDeleteProductOptionValue();

  const createVariantMutation = useCreateProductVariant();
  const updateVariantMutation = useUpdateProductVariant();
  const updateStatusMutation = useUpdateProductVariantStatus();
  const deleteVariantMutation = useDeleteProductVariant();

  // Handle Add Option with values
  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;

    const opt = await createOptionMutation.mutateAsync({
      productId,
      payload: { name: newOptionName.trim() },
    });

    const values = newOptionValuesStr
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    for (const val of values) {
      await createValueMutation.mutateAsync({
        productId,
        optionId: opt.id,
        payload: { name: val },
      });
    }

    setNewOptionName('');
    setNewOptionValuesStr('');
    setIsAddOptionModalOpen(false);
  };

  // Quick inline add value
  const handleAddValueInline = async (optionId: string, valName: string) => {
    if (!valName.trim()) return;
    await createValueMutation.mutateAsync({
      productId,
      optionId,
      payload: { name: valName.trim() },
    });
  };

  // Handle Create Variant
  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const valueIds = Object.values(selectedOptionValues).filter(Boolean);
    if (valueIds.length === 0) return;

    await createVariantMutation.mutateAsync({
      productId,
      payload: {
        sku: newVariantSku.trim() || `${baseSku}-${Date.now().toString().slice(-4)}`,
        price: newVariantPrice ? Number(newVariantPrice) : undefined,
        stockQuantity: Number(newVariantStock) || 0,
        optionValueIds: valueIds,
      },
    });

    setNewVariantSku('');
    setNewVariantPrice('');
    setNewVariantStock('10');
    setSelectedOptionValues({});
    setIsAddVariantModalOpen(false);
  };

  // Handle Update Variant
  const handleSaveEditVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;

    await updateVariantMutation.mutateAsync({
      productId,
      variantId: editingVariant.id,
      payload: {
        sku: editingVariant.sku,
        price: editingVariant.price !== null && editingVariant.price !== undefined ? Number(editingVariant.price) : null,
        stockQuantity: Number(editingVariant.stockQuantity) || 0,
        lowStockThreshold: editingVariant.lowStockThreshold ? Number(editingVariant.lowStockThreshold) : null,
      },
    });

    setEditingVariant(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Product Options Section */}
      <div className="bg-white rounded-lg border border-sand-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-charcoal-900 font-sans flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gold-600" />
              Variant Options (Attributes)
            </h4>
            <p className="text-xs text-charcoal-500 font-sans">
              Define the dimensions along which this product varies (e.g. Framing, Size).
            </p>
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddOptionModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Option
            </Button>
          )}
        </div>

        {isLoadingOptions ? (
          <p className="text-xs text-charcoal-500 py-2">Loading options...</p>
        ) : options.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-sand-300 rounded-md bg-sand-50/50">
            <p className="text-xs text-charcoal-600">No options defined yet. Add an option (e.g., Size, Framing) to create variants.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {options.map((opt) => (
              <div
                key={opt.id}
                className="p-3 bg-sand-50 rounded-md border border-sand-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 font-sans">
                    {opt.name}:
                  </span>
                  <div className="inline-flex flex-wrap gap-1.5 ml-2 mt-1 md:mt-0">
                    {(opt.values || []).map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-sand-300 text-xs font-serif text-charcoal-800"
                      >
                        {v.name}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteValueMutation.mutateAsync({
                                productId,
                                optionId: opt.id,
                                valueId: v.id,
                              })
                            }
                            aria-label={`Remove value ${v.name}`}
                            className="text-charcoal-400 hover:text-rose-600 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {!disabled && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const val = prompt(`Add value to ${opt.name}:`);
                        if (val) handleAddValueInline(opt.id, val);
                      }}
                      className="text-xs text-gold-700 hover:text-gold-900 font-medium underline"
                    >
                      + Add Value
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionToDelete(opt.id)}
                      aria-label={`Delete option ${opt.name}`}
                      className="p-1 text-charcoal-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Variant Matrix Section */}
      <div className="bg-white rounded-lg border border-sand-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-charcoal-900 font-sans flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-600" />
              Variant Matrix ({variants.length})
            </h4>
            <p className="text-xs text-charcoal-500 font-sans">
              Manage SKU, pricing overrides, and inventory levels for each combination.
            </p>
          </div>
          {!disabled && options.length > 0 && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setNewVariantSku(`${baseSku}-${variants.length + 1}`);
                setNewVariantPrice(String(basePrice));
                setIsAddVariantModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Variant
            </Button>
          )}
        </div>

        {isLoadingVariants ? (
          <p className="text-xs text-charcoal-500 py-2">Loading variants...</p>
        ) : variants.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-sand-300 rounded-md bg-sand-50/50">
            <AlertTriangle className="mx-auto w-8 h-8 text-gold-500 mb-2 opacity-60" />
            <p className="text-sm font-medium text-charcoal-700">No variants generated</p>
            <p className="text-xs text-charcoal-500 mt-1">
              Add at least one option and click "Add Variant" to create variants.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-serif">
              <thead>
                <tr className="border-b border-sand-200 text-xs font-semibold uppercase tracking-wider text-charcoal-600 bg-sand-50/50">
                  <th className="py-2.5 px-3">Variant</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Status</th>
                  {!disabled && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {variants.map((v) => {
                  const comboText = (v.optionValues || [])
                    .map((ov) => ov.valueName || ov.optionName || '—')
                    .join(' / ');

                  return (
                    <tr key={v.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3 px-3 font-medium text-charcoal-900">
                        {comboText || 'Default Variant'}
                      </td>
                      <td className="py-3 px-3 text-xs font-mono text-charcoal-600">{v.sku}</td>
                      <td className="py-3 px-3">
                        {v.price !== null && v.price !== undefined ? (
                          <span className="font-semibold text-charcoal-900">
                            ₹{Number(v.price).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-charcoal-400 text-xs italic">
                            Default (₹{basePrice.toLocaleString('en-IN')})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            v.stockQuantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : v.stockQuantity <= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.stockQuantity} in stock
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={v.status} size="sm" />
                      </td>
                      {!disabled && (
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutateAsync({
                                productId,
                                variantId: v.id,
                                status: v.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            aria-label="Toggle status"
                            className="p-1 text-charcoal-500 hover:text-charcoal-800 rounded hover:bg-sand-200"
                            title={v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingVariant(v)}
                            aria-label="Edit variant"
                            className="p-1 text-charcoal-500 hover:text-gold-700 rounded hover:bg-sand-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVariantToDelete(v.id)}
                            aria-label="Delete variant"
                            className="p-1 text-charcoal-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Option */}
      <Modal
        isOpen={isAddOptionModalOpen}
        onClose={() => setIsAddOptionModalOpen(false)}
        size="md"
        title="Add Variant Option"
      >
        <form onSubmit={handleCreateOption} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
              Option Name
            </label>
            <input
              type="text"
              required
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="e.g. Size, Frame Material, Canvas Finish"
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
              Values (comma-separated)
            </label>
            <input
              type="text"
              value={newOptionValuesStr}
              onChange={(e) => setNewOptionValuesStr(e.target.value)}
              placeholder="e.g. 18x24 in, 24x36 in, 36x48 in"
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOptionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createOptionMutation.isPending}>
              Create Option
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Variant */}
      <Modal
        isOpen={isAddVariantModalOpen}
        onClose={() => setIsAddVariantModalOpen(false)}
        size="md"
        title="Create Product Variant"
      >
        <form onSubmit={handleCreateVariant} className="space-y-4">
          {options.map((opt) => (
            <div key={opt.id}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                {opt.name} *
              </label>
              <select
                required
                value={selectedOptionValues[opt.id] || ''}
                onChange={(e) =>
                  setSelectedOptionValues({
                    ...selectedOptionValues,
                    [opt.id]: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
              >
                <option value="">Select {opt.name}...</option>
                {(opt.values || []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
              Variant SKU *
            </label>
            <input
              type="text"
              required
              value={newVariantSku}
              onChange={(e) => setNewVariantSku(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-mono focus:border-gold-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                step="any"
                value={newVariantPrice}
                onChange={(e) => setNewVariantPrice(e.target.value)}
                placeholder={String(basePrice)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={newVariantStock}
                onChange={(e) => setNewVariantStock(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddVariantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={createVariantMutation.isPending}>
              Create Variant
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Variant */}
      {editingVariant && (
        <Modal
          isOpen={Boolean(editingVariant)}
          onClose={() => setEditingVariant(null)}
          size="md"
          title="Edit Variant Details"
        >
          <form onSubmit={handleSaveEditVariant} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                Variant SKU *
              </label>
              <input
                type="text"
                required
                value={editingVariant.sku}
                onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-mono focus:border-gold-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingVariant.price ?? ''}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      price: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder={`Base (₹${basePrice})`}
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingVariant.stockQuantity}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      stockQuantity: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingVariant(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={updateVariantMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmations */}
      <ConfirmDialog
        isOpen={Boolean(variantToDelete)}
        onClose={() => setVariantToDelete(null)}
        onConfirm={() => {
          if (variantToDelete) {
            deleteVariantMutation.mutate({ productId, variantId: variantToDelete });
            setVariantToDelete(null);
          }
        }}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmLabel="Delete Variant"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={Boolean(optionToDelete)}
        onClose={() => setOptionToDelete(null)}
        onConfirm={() => {
          if (optionToDelete) {
            deleteOptionMutation.mutate({ productId, optionId: optionToDelete });
            setOptionToDelete(null);
          }
        }}
        title="Delete Option"
        message="Deleting this option will remove it from all associated product variants. Continue?"
        confirmLabel="Delete Option"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
