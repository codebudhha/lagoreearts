import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ArtistStatusBadge } from '../../components/artists/ArtistStatusBadge';
import { useArtists, useDeleteArtist } from '../../hooks/useArtists';
import { useAuth } from '../../hooks/useAuth';
import { Artist, ArtistStatus } from '../../lib/api/artists';
import { Plus, Eye, Edit2, Trash2, Package } from 'lucide-react';

export const ArtistListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('artist.create');
  const canUpdate = hasPermission('artist.update');
  const canDelete = hasPermission('artist.delete');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isFeaturedFilter, setIsFeaturedFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);

  // Query
  const { data, isLoading, isError, error, refetch } = useArtists({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'ALL' ? (statusFilter as ArtistStatus) : undefined,
    isFeatured: isFeaturedFilter === 'ALL' ? undefined : isFeaturedFilter === 'true',
  });

  const deleteMutation = useDeleteArtist();

  const handleConfirmDelete = async () => {
    if (!artistToDelete) return;
    await deleteMutation.mutateAsync(artistToDelete.id);
    setArtistToDelete(null);
  };

  const artists = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="Artists & Master Makers"
        description="Curate master artisans, traditional lineages, biographies, and catalog attributions."
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Artists & Makers' },
        ]}
      >
        {canCreate && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/admin/artists/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Artist Profile
          </Button>
        )}
      </PageHeader>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px] max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search artists by name, tradition, origin..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'INACTIVE', label: 'Inactive Only' },
            ]}
            className="w-36"
          />

          <Select
            value={isFeaturedFilter}
            onChange={(e) => {
              setIsFeaturedFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Showcase' },
              { value: 'true', label: 'Featured Only' },
              { value: 'false', label: 'Standard Only' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Artists"
          message={(error as any)?.message || 'Could not fetch artists catalogue.'}
          onRetry={() => refetch()}
        />
      ) : artists.length === 0 ? (
        <EmptyState
          title="No Artists Found"
          description={
            search || statusFilter !== 'ALL' || isFeaturedFilter !== 'ALL'
              ? 'No artists match your active search or filter criteria.'
              : 'No artisan profiles have been created yet.'
          }
          actionLabel={canCreate ? 'Create First Artist' : undefined}
          onAction={canCreate ? () => navigate('/admin/artists/new') : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-charcoal-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Artisan / Maker</th>
                  <th className="py-3 px-4">Tradition & Lineage</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Associated Artworks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {artists.map((artist) => {
                  const profileImg =
                    artist.media?.find((m) => m.role === 'PROFILE' && m.isPrimary)?.media?.publicUrl ||
                    artist.media?.find((m) => m.role === 'PROFILE')?.media?.publicUrl ||
                    artist.ogImage;

                  return (
                    <tr key={artist.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-serif font-bold text-sm text-charcoal-700 border border-sand-300">
                            {profileImg ? (
                              <img src={profileImg} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              artist.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/artists/${artist.id}`}
                              className="font-semibold text-charcoal-900 hover:text-champagne-600 font-serif text-sm truncate block"
                            >
                              {artist.name}
                            </Link>
                            <span className="text-[11px] text-charcoal-500 block truncate">
                              /{artist.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-700">
                        {artist.tradition || artist.origin ? (
                          <div>
                            <span className="font-medium text-charcoal-900 block">{artist.tradition || '—'}</span>
                            <span className="text-[11px] text-charcoal-500 block">{artist.origin || artist.nationality || ''}</span>
                          </div>
                        ) : (
                          <span className="text-charcoal-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-700">
                        {artist.specialization || artist.medium || <span className="text-charcoal-400 italic">—</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-medium text-charcoal-700">
                          <Package className="w-3.5 h-3.5 text-champagne-600" />
                          {artist._count?.products ?? (artist.products?.length || 0)} Artworks
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <ArtistStatusBadge
                          status={artist.status}
                          isFeatured={artist.isFeatured}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/artists/${artist.id}`}>
                            <button
                              type="button"
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {canUpdate && (
                            <Link to={`/admin/artists/${artist.id}/edit`}>
                              <button
                                type="button"
                                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                                title="Edit Artist"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setArtistToDelete(artist)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                              title="Delete Artist"
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-sand-200 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(artistToDelete)}
        onClose={() => setArtistToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Artist Profile"
        message={`Are you sure you want to delete "${artistToDelete?.name}"? If this artist is associated with catalog products, deletion will be blocked.`}
        confirmLabel="Delete Artist"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
