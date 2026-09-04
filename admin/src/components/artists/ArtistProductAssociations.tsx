import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { ProductPicker } from '../collections/ProductPicker';
import {
  useAttachProductArtist,
  useUpdateProductArtist,
  useDetachProductArtist,
} from '../../hooks/useArtists';
import { ProductArtist, ArtistRole } from '../../lib/api/artists';
import { Package, Star, Trash2, Plus, ExternalLink } from 'lucide-react';

interface ArtistProductAssociationsProps {
  artistId: string;
  artistName: string;
  products?: ProductArtist[];
  onRefetch?: () => void;
  disabled?: boolean;
}

const ROLE_OPTIONS: { value: ArtistRole; label: string }[] = [
  { value: 'ARTIST', label: 'Primary Artist / Painter' },
  { value: 'MAKER', label: 'Master Artisan / Craftsman' },
  { value: 'DESIGNER', label: 'Concept Designer' },
  { value: 'ATTRIBUTED_TO', label: 'Attributed To (School)' },
];

export const ArtistProductAssociations: React.FC<ArtistProductAssociationsProps> = ({
  artistId,
  artistName,
  products = [],
  onRefetch,
  disabled = false,
}) => {
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [itemToDetach, setItemToDetach] = useState<ProductArtist | null>(null);

  const attachMutation = useAttachProductArtist();
  const updateMutation = useUpdateProductArtist();
  const detachMutation = useDetachProductArtist();

  const handleProductsSelected = async (productIds: string[]) => {
    for (const pid of productIds) {
      await attachMutation.mutateAsync({
        productId: pid,
        payload: {
          artistId,
          role: 'ARTIST',
          isPrimary: false,
        },
      });
    }
    setShowProductPicker(false);
    onRefetch?.();
  };

  const handleRoleChange = async (item: ProductArtist, newRole: ArtistRole) => {
    await updateMutation.mutateAsync({
      productId: item.productId,
      artistId: item.artistId,
      currentRole: item.role,
      payload: {
        role: newRole,
        isPrimary: item.isPrimary,
      },
    });
    onRefetch?.();
  };

  const handlePrimaryToggle = async (item: ProductArtist) => {
    await updateMutation.mutateAsync({
      productId: item.productId,
      artistId: item.artistId,
      currentRole: item.role,
      payload: {
        isPrimary: !item.isPrimary,
        role: item.role,
      },
    });
    onRefetch?.();
  };

  const handleConfirmDetach = async () => {
    if (!itemToDetach) return;
    await detachMutation.mutateAsync({
      productId: itemToDetach.productId,
      artistId: itemToDetach.artistId,
      role: itemToDetach.role,
    });
    setItemToDetach(null);
    onRefetch?.();
  };

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
            <Package className="w-4 h-4 text-champagne-600" />
            Associated Artworks & Products ({products.length})
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Catalogue products created by or attributed to {artistName}.
          </p>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowProductPicker(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Attach Products
          </Button>
        )}
      </div>

      {products.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50/50 text-charcoal-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Artwork</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Artist Role</th>
                <th className="py-2.5 px-3">Primary</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {products.map((item) => {
                const prod = item.product;
                return (
                  <tr key={`${item.productId}-${item.artistId}-${item.role}`} className="hover:bg-sand-50/60">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {prod?.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-charcoal-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/products/${item.productId}`}
                            className="font-medium text-charcoal-900 hover:text-champagne-600 truncate block font-serif"
                          >
                            {prod?.name || 'Unknown Product'}
                          </Link>
                          <span className="text-[11px] text-charcoal-500 block">ID: {item.productId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-charcoal-600 font-mono">
                      {prod?.sku || '—'}
                    </td>

                    <td className="py-3 px-3 text-charcoal-800 font-medium">
                      {prod?.price ? `₹${Number(prod.price).toLocaleString('en-IN')}` : '—'}
                    </td>

                    <td className="py-3 px-3">
                      {disabled ? (
                        <Badge variant="secondary" size="sm">
                          {ROLE_OPTIONS.find((r) => r.value === item.role)?.label || item.role}
                        </Badge>
                      ) : (
                        <Select
                          value={item.role}
                          onChange={(e) => handleRoleChange(item, e.target.value as ArtistRole)}
                          options={ROLE_OPTIONS}
                          className="w-44 text-xs"
                        />
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {disabled ? (
                        item.isPrimary ? (
                          <Badge variant="champagne" size="sm">
                            <Star className="w-3 h-3 fill-gold-500 mr-1" />
                            Primary
                          </Badge>
                        ) : (
                          <span className="text-charcoal-400">—</span>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePrimaryToggle(item)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                            item.isPrimary
                              ? 'bg-champagne-50 border-champagne-400 text-champagne-800 font-semibold'
                              : 'bg-white border-sand-300 text-charcoal-500 hover:bg-sand-50'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isPrimary ? 'fill-gold-500 text-gold-600' : ''}`} />
                          {item.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/${item.productId}`}>
                          <button
                            type="button"
                            className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                            title="View Product Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </Link>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => setItemToDetach(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                            title="Detach Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-sand-200 rounded-lg bg-sand-50/50">
          <Package className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
          <p className="text-xs text-charcoal-500 font-sans">No products linked to this artist yet.</p>
        </div>
      )}

      {/* ProductPicker Modal */}
      {showProductPicker && (
        <ProductPicker
          isOpen={showProductPicker}
          onClose={() => setShowProductPicker(false)}
          onSelectProducts={handleProductsSelected}
          alreadyAssignedProductIds={products.map((p) => p.productId)}
          isLoadingAction={attachMutation.isPending}
        />
      )}

      {/* Detach Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToDetach)}
        onClose={() => setItemToDetach(null)}
        onConfirm={handleConfirmDetach}
        title="Unlink Product"
        message={`Are you sure you want to dissociate "${itemToDetach?.product?.name || 'this artwork'}" from ${artistName}? The product entity itself will remain intact.`}
        confirmLabel="Unlink Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={detachMutation.isPending}
      />
    </Card>
  );
};
