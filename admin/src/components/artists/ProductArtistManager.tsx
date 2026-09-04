import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Spinner } from '../feedback/Spinner';
import {
  useProductArtists,
  useArtists,
  useAttachProductArtist,
  useUpdateProductArtist,
  useDetachProductArtist,
} from '../../hooks/useArtists';
import { ProductArtist, ArtistRole } from '../../lib/api/artists';
import { Palette, Star, Trash2, Plus, ExternalLink, User } from 'lucide-react';

interface ProductArtistManagerProps {
  productId: string;
  disabled?: boolean;
}

const ROLE_OPTIONS: { value: ArtistRole; label: string }[] = [
  { value: 'ARTIST', label: 'Primary Artist / Painter' },
  { value: 'MAKER', label: 'Master Artisan / Craftsman' },
  { value: 'DESIGNER', label: 'Concept Designer' },
  { value: 'ATTRIBUTED_TO', label: 'Attributed To (School)' },
];

export const ProductArtistManager: React.FC<ProductArtistManagerProps> = ({
  productId,
  disabled = false,
}) => {
  const { data: productArtists, isLoading } = useProductArtists(productId);
  const { data: allArtistsData } = useArtists({ limit: 100 });

  const attachMutation = useAttachProductArtist();
  const updateMutation = useUpdateProductArtist();
  const detachMutation = useDetachProductArtist();

  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ArtistRole>('ARTIST');
  const [isPrimarySelected, setIsPrimarySelected] = useState(false);
  const [artistToDetach, setArtistToDetach] = useState<ProductArtist | null>(null);

  const existingArtistIds = (productArtists || []).map((pa) => pa.artistId);
  const availableArtists = (allArtistsData?.data || []).filter(
    (a) => !existingArtistIds.includes(a.id)
  );

  const handleAttach = async () => {
    if (!selectedArtistId) return;

    await attachMutation.mutateAsync({
      productId,
      payload: {
        artistId: selectedArtistId,
        role: selectedRole,
        isPrimary: isPrimarySelected || (productArtists || []).length === 0,
      },
    });

    setShowAttachModal(false);
    setSelectedArtistId('');
    setSelectedRole('ARTIST');
    setIsPrimarySelected(false);
  };

  const handleRoleChange = async (item: ProductArtist, newRole: ArtistRole) => {
    await updateMutation.mutateAsync({
      productId,
      artistId: item.artistId,
      currentRole: item.role,
      payload: {
        role: newRole,
        isPrimary: item.isPrimary,
      },
    });
  };

  const handleSetPrimary = async (item: ProductArtist) => {
    await updateMutation.mutateAsync({
      productId,
      artistId: item.artistId,
      currentRole: item.role,
      payload: {
        isPrimary: true,
        role: item.role,
      },
    });
  };

  const handleConfirmDetach = async () => {
    if (!artistToDetach) return;
    await detachMutation.mutateAsync({
      productId,
      artistId: artistToDetach.artistId,
      role: artistToDetach.role,
    });
    setArtistToDetach(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
            <Palette className="w-4 h-4 text-champagne-600" />
            Artists & Master Makers ({productArtists?.length || 0})
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Connect artisans, makers, and lineages to this artwork.
          </p>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAttachModal(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Assign Artist
          </Button>
        )}
      </div>

      {(productArtists || []).length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50/50 text-charcoal-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Artist / Maker</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Primary</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {(productArtists || []).map((item) => {
                const artist = item.artist;
                return (
                  <tr key={`${item.productId}-${item.artistId}-${item.role}`} className="hover:bg-sand-50/60">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-serif font-bold text-xs text-charcoal-600">
                          {artist?.name ? artist.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/admin/artists/${item.artistId}`}
                            className="font-medium text-charcoal-900 hover:text-champagne-600 truncate block font-serif"
                          >
                            {artist?.name || 'Artist Profile'}
                          </Link>
                          {artist?.tradition && (
                            <span className="text-[11px] text-charcoal-500 block">{artist.tradition}</span>
                          )}
                        </div>
                      </div>
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
                      {item.isPrimary ? (
                        <Badge variant="champagne" size="sm">
                          <Star className="w-3 h-3 fill-gold-500 mr-1" />
                          Primary Artist
                        </Badge>
                      ) : disabled ? (
                        <span className="text-charcoal-400">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(item)}
                          className="px-2 py-1 bg-white border border-sand-300 text-charcoal-500 hover:bg-sand-50 rounded text-xs"
                        >
                          Make Primary
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/artists/${item.artistId}`}>
                          <button
                            type="button"
                            className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                            title="View Artist Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </Link>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => setArtistToDetach(item)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                            title="Unlink Artist"
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
          <Palette className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
          <p className="text-xs text-charcoal-500 font-sans">No artist linked to this product yet.</p>
        </div>
      )}

      {/* Attach Modal */}
      {showAttachModal && (
        <Modal
          isOpen={showAttachModal}
          onClose={() => setShowAttachModal(false)}
          title="Assign Artist / Maker"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Select Artist <span className="text-rose-600">*</span>
              </label>
              {availableArtists.length > 0 ? (
                <Select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  options={[
                    { value: '', label: '— Choose an artist —' },
                    ...availableArtists.map((a) => ({
                      value: a.id,
                      label: `${a.name}${a.tradition ? ` (${a.tradition})` : ''}`,
                    })),
                  ]}
                />
              ) : (
                <p className="text-xs text-charcoal-500 italic p-2 bg-sand-50 rounded">
                  All registered artists are already attached or no artists exist.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Role in Creation
              </label>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as ArtistRole)}
                options={ROLE_OPTIONS}
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-charcoal-700">
                <input
                  type="checkbox"
                  checked={isPrimarySelected}
                  onChange={(e) => setIsPrimarySelected(e.target.checked)}
                  className="rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                />
                <span>Set as primary artist for this product</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAttachModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAttach}
                disabled={!selectedArtistId || attachMutation.isPending}
                isLoading={attachMutation.isPending}
              >
                Link Artist
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detach Dialog */}
      <ConfirmDialog
        isOpen={Boolean(artistToDetach)}
        onClose={() => setArtistToDetach(null)}
        onConfirm={handleConfirmDetach}
        title="Unlink Artist"
        message={`Are you sure you want to unlink "${artistToDetach?.artist?.name || 'this artist'}" from this product?`}
        confirmLabel="Unlink"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={detachMutation.isPending}
      />
    </div>
  );
};
