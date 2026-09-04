import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../lib/api/categories';
import { attributesApi, AdminAttribute } from '../../lib/api/attributes';
import { queryKeys } from '../../lib/api/queryKeys';
import { ProductAttributeAssignment } from '../../lib/api/products';
import { Sparkles, HelpCircle } from 'lucide-react';

export interface ProductAttributeEditorProps {
  categoryId?: string;
  value: ProductAttributeAssignment[];
  onChange: (attributes: ProductAttributeAssignment[]) => void;
  disabled?: boolean;
}

export const ProductAttributeEditor: React.FC<ProductAttributeEditorProps> = ({
  categoryId,
  value = [],
  onChange,
  disabled = false,
}) => {
  // Query 1: Category-bound attributes
  const { data: categoryAttributes = [], isLoading: isLoadingCatAttrs } = useQuery({
    queryKey: queryKeys.categories.attributes(categoryId || ''),
    queryFn: () => categoriesApi.getCategoryAttributes(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 1000 * 60 * 5,
  });

  // Query 2: All global attributes as fallback
  const { data: globalAttributes = [], isLoading: isLoadingGlobalAttrs } = useQuery({
    queryKey: queryKeys.attributes.list(),
    queryFn: attributesApi.list,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = categoryId ? isLoadingCatAttrs : isLoadingGlobalAttrs;

  // Derive attribute list to show
  const attributesToShow: Array<{
    id: string;
    name: string;
    slug: string;
    type: 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'NUMBER' | 'RANGE';
    description?: string | null;
    isRequired?: boolean;
    values?: Array<{ id: string; name: string; slug: string }>;
  }> = React.useMemo(() => {
    if (categoryId && categoryAttributes.length > 0) {
      return categoryAttributes.map((ca) => ({
        id: ca.attribute.id,
        name: ca.attribute.name,
        slug: ca.attribute.slug,
        type: ca.attribute.type,
        description: ca.attribute.description,
        isRequired: ca.isRequired,
        values: ca.attribute.values || [],
      }));
    }
    return globalAttributes.map((ga: AdminAttribute) => ({
      id: ga.id,
      name: ga.name,
      slug: ga.slug,
      type: ga.type,
      description: ga.description,
      isRequired: false,
      values: ga.values || [],
    }));
  }, [categoryId, categoryAttributes, globalAttributes]);

  const getAssignment = (attributeId: string): ProductAttributeAssignment => {
    return (
      value.find((a) => a.attributeId === attributeId) || {
        attributeId,
      }
    );
  };

  const updateAssignment = (attributeId: string, updates: Partial<ProductAttributeAssignment>) => {
    if (disabled) return;
    const existingIndex = value.findIndex((a) => a.attributeId === attributeId);
    let nextValue: ProductAttributeAssignment[];

    if (existingIndex >= 0) {
      nextValue = [...value];
      nextValue[existingIndex] = {
        ...nextValue[existingIndex],
        ...updates,
      };
    } else {
      nextValue = [
        ...value,
        {
          attributeId,
          ...updates,
        },
      ];
    }
    onChange(nextValue);
  };

  if (isLoading) {
    return (
      <div className="py-6 text-center text-sm text-charcoal-500 font-sans">
        Loading dynamic attributes...
      </div>
    );
  }

  if (attributesToShow.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-sand-300 p-6 text-center">
        <Sparkles className="mx-auto w-8 h-8 text-gold-500 mb-2 opacity-60" />
        <p className="text-sm font-medium text-charcoal-700">No dynamic attributes configured</p>
        <p className="text-xs text-charcoal-500 mt-1">
          {categoryId
            ? 'This category has no bound attributes. You can configure attributes in Categories.'
            : 'Select a category above to load category-specific attributes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attributesToShow.map((attr) => {
          const assignment = getAssignment(attr.id);

          return (
            <div
              key={attr.id}
              className="p-3.5 rounded-lg border border-sand-200 bg-sand-50/50 hover:bg-sand-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-800 font-sans">
                  {attr.name} {attr.isRequired && <span className="text-rose-500">*</span>}
                </label>
                {attr.description && (
                  <span title={attr.description} className="text-charcoal-400 hover:text-charcoal-600 cursor-help">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Render input based on attribute type */}
              {attr.type === 'SELECT' && (
                <select
                  value={assignment.valueId || ''}
                  onChange={(e) => updateAssignment(attr.id, { valueId: e.target.value || null })}
                  disabled={disabled}
                  aria-label={attr.name}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                >
                  <option value="">Select {attr.name}...</option>
                  {(attr.values || []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}

              {attr.type === 'MULTI_SELECT' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(attr.values || []).map((v) => {
                    const currentIds = assignment.valueIds || [];
                    const isSelected = currentIds.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const nextIds = isSelected
                            ? currentIds.filter((id) => id !== v.id)
                            : [...currentIds, v.id];
                          updateAssignment(attr.id, { valueIds: nextIds });
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          isSelected
                            ? 'bg-charcoal-900 text-gold-400 border-charcoal-900 font-medium'
                            : 'bg-white text-charcoal-700 border-sand-300 hover:border-sand-400'
                        } disabled:opacity-50`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                  {(attr.values || []).length === 0 && (
                    <span className="text-xs text-charcoal-400 italic">No predefined values</span>
                  )}
                </div>
              )}

              {attr.type === 'BOOLEAN' && (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(assignment.booleanValue)}
                    onChange={(e) => updateAssignment(attr.id, { booleanValue: e.target.checked })}
                    disabled={disabled}
                    className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                  />
                  <span className="text-sm font-serif text-charcoal-800">
                    {assignment.booleanValue ? 'Yes / Enabled' : 'No / Disabled'}
                  </span>
                </label>
              )}

              {attr.type === 'NUMBER' && (
                <input
                  type="number"
                  step="any"
                  value={assignment.numberValue ?? ''}
                  onChange={(e) =>
                    updateAssignment(attr.id, {
                      numberValue: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder={`Enter ${attr.name}...`}
                  disabled={disabled}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                />
              )}

              {(attr.type === 'TEXT' || attr.type === 'RANGE') && (
                <input
                  type="text"
                  value={assignment.textValue || ''}
                  onChange={(e) => updateAssignment(attr.id, { textValue: e.target.value })}
                  placeholder={`Enter ${attr.name}...`}
                  disabled={disabled}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
