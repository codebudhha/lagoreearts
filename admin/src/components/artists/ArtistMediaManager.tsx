import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Spinner } from '../feedback/Spinner';
import { MediaPicker } from '../media/MediaPicker';
import {
  useArtistMedia,
  useAttachArtistMedia,
  useSetPrimaryArtistMedia,
  useDetachArtistMedia,
} from '../../hooks/useArtists';
import { ArtistMediaRole } from '../../lib/api/artists';
import {
  User,
  Image as ImageIcon,
  Star,
  Trash2,
  Plus,
  Share2,
} from 'lucide-react';

interface ArtistMediaManagerProps {
  artistId: string;
  disabled?: boolean;
}

export const ArtistMediaManager: React.FC<ArtistMediaManagerProps> = ({
  artistId,
  disabled = false,
}) => {
  const { data: mediaList, isLoading } = useArtistMedia(artistId);
  const attachMutation = useAttachArtistMedia();
  const setPrimaryMutation = useSetPrimaryArtistMedia();
  const detachMutation = useDetachArtistMedia();

  const [activePickerRole, setActivePickerRole] = useState<ArtistMediaRole | null>(null);
  const [mediaToDetach, setMediaToDetach] = useState<{ mediaId: string; role: string } | null>(null);

  const profileMedia = (mediaList || []).filter((m) => m.role === 'PROFILE');
  const galleryMedia = (mediaList || []).filter((m) => m.role === 'GALLERY');
  const ogMedia = (mediaList || []).filter((m) => m.role === 'OG');

  const handleMediaSelected = async (selected: any) => {
    if (!activePickerRole || !selected) return;
    const items = Array.isArray(selected) ? selected : [selected];
    if (items.length === 0) return;

    for (const item of items) {
      await attachMutation.mutateAsync({
        artistId,
        payload: {
          mediaId: item.id,
          role: activePickerRole,
          isPrimary: activePickerRole === 'PROFILE' && profileMedia.length === 0,
        },
      });
    }
    setActivePickerRole(null);
  };

  const handleConfirmDetach = async () => {
    if (!mediaToDetach) return;
    await detachMutation.mutateAsync({
      artistId,
      mediaId: mediaToDetach.mediaId,
      role: mediaToDetach.role,
    });
    setMediaToDetach(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Profile Avatar & Portrait Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
              <User className="w-4 h-4 text-champagne-600" />
              Profile Portrait & Avatar
            </h3>
            <p className="text-xs text-charcoal-500 font-sans">
              Headshot, artisan portrait, or atelier insignia.
            </p>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivePickerRole('PROFILE')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Profile Image
            </Button>
          )}
        </div>

        {profileMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {profileMedia.map((item) => {
              const url = item.media?.publicUrl || (item as any).url;
              return (
                <div
                  key={item.mediaId}
                  className={`group relative rounded-lg overflow-hidden border ${
                    item.isPrimary ? 'border-champagne-500 ring-2 ring-champagne-400' : 'border-sand-200'
                  } bg-sand-100 aspect-square flex items-center justify-center`}
                >
                  <img
                    src={url}
                    alt={item.media?.altText || 'Profile'}
                    className="w-full h-full object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {item.isPrimary && (
                      <Badge variant="champagne" size="sm">
                        <Star className="w-3 h-3 fill-gold-500 mr-1" />
                        Primary
                      </Badge>
                    )}
                  </div>

                  {/* Actions Overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-charcoal-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      {!item.isPrimary && (
                        <button
                          type="button"
                          onClick={() =>
                            setPrimaryMutation.mutate({
                              artistId,
                              mediaId: item.mediaId,
                              role: 'PROFILE',
                            })
                          }
                          className="p-1.5 bg-white text-charcoal-900 hover:text-champagne-600 rounded shadow text-xs font-semibold"
                          title="Set as primary portrait"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setMediaToDetach({ mediaId: item.mediaId, role: 'PROFILE' })
                        }
                        className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded shadow"
                        title="Detach image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg bg-sand-50/50">
            <User className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
            <p className="text-xs text-charcoal-500 font-sans">No profile portrait attached yet.</p>
          </div>
        )}
      </Card>

      {/* 2. Portfolio & Artwork Gallery Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-champagne-600" />
              Artisan Portfolio & Atelier Gallery ({galleryMedia.length})
            </h3>
            <p className="text-xs text-charcoal-500 font-sans">
              Masterwork archival photos, workshop snapshots, and historical documentation.
            </p>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivePickerRole('GALLERY')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Gallery Media
            </Button>
          )}
        </div>

        {galleryMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {galleryMedia.map((item) => {
              const url = item.media?.publicUrl || (item as any).url;
              return (
                <div
                  key={item.mediaId}
                  className="group relative rounded-lg overflow-hidden border border-sand-200 bg-sand-100 aspect-square flex items-center justify-center"
                >
                  <img
                    src={url}
                    alt={item.media?.altText || 'Gallery Item'}
                    className="w-full h-full object-cover"
                  />

                  {/* Actions Overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-charcoal-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMediaToDetach({ mediaId: item.mediaId, role: 'GALLERY' })
                        }
                        className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded shadow"
                        title="Detach gallery image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg bg-sand-50/50">
            <ImageIcon className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
            <p className="text-xs text-charcoal-500 font-sans">No portfolio gallery images attached yet.</p>
          </div>
        )}
      </Card>

      {/* 3. OpenGraph / Social Media Card Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
              <Share2 className="w-4 h-4 text-champagne-600" />
              Social Sharing Image (OG Card)
            </h3>
            <p className="text-xs text-charcoal-500 font-sans">
              1200x630 banner optimized for Twitter and Facebook shares.
            </p>
          </div>

          {!disabled && ogMedia.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActivePickerRole('OG')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Select OG Image
            </Button>
          )}
        </div>

        {ogMedia.length > 0 ? (
          <div className="max-w-md">
            {ogMedia.map((item) => {
              const url = item.media?.publicUrl || (item as any).url;
              return (
                <div
                  key={item.mediaId}
                  className="group relative rounded-lg overflow-hidden border border-sand-200 bg-sand-100 aspect-[1.91/1] flex items-center justify-center"
                >
                  <img
                    src={url}
                    alt={item.media?.altText || 'OG Image'}
                    className="w-full h-full object-cover"
                  />

                  {/* Actions Overlay */}
                  {!disabled && (
                    <div className="absolute inset-0 bg-charcoal-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMediaToDetach({ mediaId: item.mediaId, role: 'OG' })
                        }
                        className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded shadow"
                        title="Detach OG image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg bg-sand-50/50">
            <Share2 className="w-8 h-8 mx-auto text-charcoal-300 mb-2" />
            <p className="text-xs text-charcoal-500 font-sans">No dedicated social card selected. Falls back to profile portrait.</p>
          </div>
        )}
      </Card>

      {/* Universal MediaPicker Modal */}
      {activePickerRole && (
        <MediaPicker
          isOpen={Boolean(activePickerRole)}
          onClose={() => setActivePickerRole(null)}
          onSelect={handleMediaSelected}
          mode={activePickerRole === 'GALLERY' ? 'multiple' : 'single'}
          title={`Select Media for ${activePickerRole}`}
        />
      )}

      {/* Detach Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(mediaToDetach)}
        onClose={() => setMediaToDetach(null)}
        onConfirm={handleConfirmDetach}
        title="Detach Media Asset"
        message="Are you sure you want to detach this media asset from the artist profile?"
        confirmLabel="Detach Media"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={detachMutation.isPending}
      />
    </div>
  );
};
