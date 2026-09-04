import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collectionsApi } from '../../lib/api/collections';
import { queryKeys } from '../../lib/api/queryKeys';
import { Layers, X } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface CollectionMultiSelectorProps {
  value: string[];
  onChange: (collectionIds: string[]) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
}

export const CollectionMultiSelector: React.FC<CollectionMultiSelectorProps> = ({
  value = [],
  onChange,
  disabled = false,
  label = 'Assigned Collections',
  error,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.collections.list({ status: 'ACTIVE' }),
    queryFn: () => collectionsApi.list({ status: 'ACTIVE' }),
    staleTime: 1000 * 60 * 5,
  });

  const collections = data?.items || [];

  const toggleCollection = (collectionId: string) => {
    if (disabled) return;
    if (value.includes(collectionId)) {
      onChange(value.filter((id) => id !== collectionId));
    } else {
      onChange([...value, collectionId]);
    }
  };

  const removeCollection = (collectionId: string) => {
    if (disabled) return;
    onChange(value.filter((id) => id !== collectionId));
  };

  const selectedCollections = collections.filter((c) => value.includes(c.id));

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5 font-sans">
          {label}
        </label>
      )}

      {/* Selected tags */}
      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {selectedCollections.map((col) => (
            <span
              key={col.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sand-200 text-charcoal-800 text-xs font-medium border border-sand-300"
            >
              <Layers className="w-3 h-3 text-gold-600" />
              {col.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeCollection(col.id)}
                  aria-label={`Remove ${col.name}`}
                  className="text-charcoal-400 hover:text-rose-600 transition-colors p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Checkbox selector box */}
      <div
        className={`max-h-48 overflow-y-auto rounded-md border p-2.5 bg-white space-y-1.5 ${
          error ? 'border-rose-300' : 'border-sand-300'
        } ${disabled ? 'opacity-60 pointer-events-none bg-sand-50' : ''}`}
      >
        {isLoading ? (
          <p className="text-xs text-charcoal-500 py-2 text-center">Loading collections...</p>
        ) : collections.length === 0 ? (
          <p className="text-xs text-charcoal-500 py-2 text-center">No active collections found.</p>
        ) : (
          collections.map((col) => {
            const isChecked = value.includes(col.id);
            return (
              <label
                key={col.id}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm hover:bg-sand-50 ${
                  isChecked ? 'bg-sand-100 font-medium text-charcoal-900' : 'text-charcoal-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCollection(col.id)}
                  disabled={disabled}
                  className="w-4 h-4 rounded border-sand-300 text-gold-600 focus:ring-gold-500 focus:ring-offset-0"
                />
                <span className="flex-1 truncate">{col.name}</span>
                {col.isFeatured && (
                  <Badge variant="champagne" size="sm">
                    Featured
                  </Badge>
                )}
              </label>
            );
          })
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-sans">{error}</p>}
    </div>
  );
};
