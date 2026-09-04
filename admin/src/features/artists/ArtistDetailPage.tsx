import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { ArtistStatusBadge } from '../../components/artists/ArtistStatusBadge';
import { ArtistMediaManager } from '../../components/artists/ArtistMediaManager';
import { ArtistProductAssociations } from '../../components/artists/ArtistProductAssociations';
import { useArtistDetail, useDeleteArtist } from '../../hooks/useArtists';
import { useAuth } from '../../hooks/useAuth';
import {
  User,
  Image as ImageIcon,
  Package,
  Globe,
  Edit2,
  Trash2,
  Calendar,
  MapPin,
} from 'lucide-react';

export const ArtistDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('artist.update');
  const canDelete = hasPermission('artist.delete');

  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'products' | 'seo'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: artist, isLoading, isError, error, refetch } = useArtistDetail(id);
  const deleteMutation = useDeleteArtist();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate('/admin/artists');
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !artist) {
    return (
      <PageContainer>
        <ErrorState
          title="Artist Not Found"
          message={(error as any)?.message || 'Could not retrieve artist profile.'}
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const profileImage =
    artist.media?.find((m) => m.role === 'PROFILE' && m.isPrimary)?.media?.publicUrl ||
    artist.media?.find((m) => m.role === 'PROFILE')?.media?.publicUrl ||
    artist.ogImage;

  return (
    <PageContainer>
      <PageHeader
        title={artist.name}
        description={`Slug: /${artist.slug} • Tradition: ${artist.tradition || 'Heritage Artisan'}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Artists & Makers', path: '/admin/artists' },
          { label: artist.name },
        ]}
      >
        <div className="flex items-center gap-2">
          {canUpdate && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/admin/artists/${artist.id}/edit`)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Artist
            </Button>
          )}

          {canDelete && (
            <Button
              variant="danger"
              size="md"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Top Banner Quick Info */}
      <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ArtistStatusBadge
            status={artist.status}
            isFeatured={artist.isFeatured}
          />
          {artist.origin && (
            <Badge variant="secondary" size="sm">
              <MapPin className="w-3 h-3 mr-1 text-champagne-600" />
              {artist.origin}
            </Badge>
          )}
          {(artist.birthYear || artist.deathYear) && (
            <Badge variant="secondary" size="sm">
              <Calendar className="w-3 h-3 mr-1 text-champagne-600" />
              {artist.birthYear || '—'} – {artist.deathYear || 'Present'}
            </Badge>
          )}
        </div>

        <div className="text-xs font-sans text-charcoal-500">
          <span>Created: {new Date(artist.createdAt).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>Updated: {new Date(artist.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-sand-300 gap-6 mt-6 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'overview'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <User className="w-4 h-4" />
          Overview & Biography
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'media'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Media & Portfolio ({artist.media?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'products'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Package className="w-4 h-4" />
          Associated Artworks ({artist.products?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'seo'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Biographical Narrative
              </h3>

              {artist.shortBio && (
                <p className="text-sm font-serif italic text-charcoal-800 bg-sand-50 p-4 rounded-lg border border-sand-200">
                  "{artist.shortBio}"
                </p>
              )}

              <div className="text-sm font-serif text-charcoal-800 leading-relaxed whitespace-pre-line">
                {artist.biography || (
                  <span className="text-charcoal-400 italic">No extended biography provided.</span>
                )}
              </div>
            </Card>

            {/* Lineage & Craft Details */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
                Artisan Practice & Heritage Lineage
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Tradition / School</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.tradition || '—'}
                  </span>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Primary Medium</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.medium || '—'}
                  </span>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Specialization</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.specialization || '—'}
                  </span>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Origin / Atelier</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.origin || '—'}
                  </span>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Nationality</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.nationality || '—'}
                  </span>
                </div>

                <div className="bg-sand-50 p-3.5 rounded-lg border border-sand-200">
                  <span className="text-charcoal-500 block uppercase">Signature / Seal</span>
                  <span className="font-semibold text-charcoal-900 font-serif text-sm mt-0.5 block">
                    {artist.signature || '—'}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans mb-3">
                Master Artisan Portrait
              </h3>
              <div className="aspect-square bg-sand-100 rounded-lg overflow-hidden border border-sand-200 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-charcoal-300" />
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Media */}
      {activeTab === 'media' && (
        <ArtistMediaManager artistId={artist.id} disabled={!canUpdate} />
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <ArtistProductAssociations
          artistId={artist.id}
          artistName={artist.name}
          products={artist.products || []}
          onRefetch={() => refetch()}
          disabled={!canUpdate}
        />
      )}

      {/* Tab: SEO */}
      {activeTab === 'seo' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Search Engine Preview
          </h3>

          <div className="bg-sand-50 p-4 rounded-xl border border-sand-200 space-y-1.5 max-w-2xl">
            <span className="text-xs text-emerald-700 block font-mono">
              https://lagoreearts.com/artists/{artist.slug}
            </span>
            <h4 className="text-base font-medium text-blue-800 hover:underline cursor-pointer font-serif">
              {artist.metaTitle || `${artist.name} — Master Artisan | Lagoree Arts`}
            </h4>
            <p className="text-xs text-charcoal-600 line-clamp-2">
              {artist.metaDescription || artist.shortBio || 'Discover masterworks by this heritage artisan at Lagoree Arts.'}
            </p>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Artist Profile"
        message={`Are you sure you want to delete "${artist.name}"? If this artist is associated with catalog products, deletion will be blocked.`}
        confirmLabel="Delete Artist"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
