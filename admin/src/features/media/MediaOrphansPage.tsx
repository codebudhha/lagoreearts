import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Skeleton } from '../../components/feedback/Skeleton';
import { MediaGrid } from '../../components/media/MediaGrid';
import { MediaTable } from '../../components/media/MediaTable';
import { MediaDetailDrawer } from '../../components/media/MediaDetailDrawer';
import { MediaMoveModal } from '../../components/media/MediaMoveModal';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  useOrphanMediaList,
  useMediaFolders,
  useUpdateMediaAsset,
  useDeleteMediaAsset,
  useMoveMediaAssets,
} from '../../hooks/useMedia';
import { MediaAsset } from '../../lib/api/media';
import {
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  Search,
  FolderInput,
  Trash2,
} from 'lucide-react';

export const MediaOrphansPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { success, error } = useToast();

  const canUpdate = hasPermission('media.update');
  const canDelete = hasPermission('media.delete');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectingAsset, setInspectingAsset] = useState<MediaAsset | null>(null);
  const [assetsToMove, setAssetsToMove] = useState<MediaAsset[]>([]);
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Queries
  const { data: folders = [] } = useMediaFolders();
  const {
    data: orphanData,
    isLoading,
    isError,
    error: orphanError,
    refetch,
  } = useOrphanMediaList({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const updateAssetMutation = useUpdateMediaAsset();
  const deleteAssetMutation = useDeleteMediaAsset();
  const moveAssetsMutation = useMoveMediaAssets();

  const assets = orphanData?.media || [];
  const total = orphanData?.total || 0;
  const totalPages = orphanData?.totalPages || 1;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (assets.every((a) => selectedIds.has(a.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map((a) => a.id)));
    }
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAssetMutation.mutateAsync(assetToDelete.id);
      setAssetToDelete(null);
      if (inspectingAsset?.id === assetToDelete.id) setInspectingAsset(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(assetToDelete.id);
        return next;
      });
    } catch {
      // Handled by toast
    }
  };

  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await deleteAssetMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      success(`Deleted ${ids.length} unattached assets.`);
    } catch (err: any) {
      error(err?.message || 'Failed to delete some unattached assets.');
      setIsBulkDeleting(false);
    }
  };

  const handleConfirmMove = async (destinationFolderId: string | null) => {
    const assetIds = assetsToMove.map((a) => a.id);
    await moveAssetsMutation.mutateAsync({ assetIds, folderId: destinationFolderId });
    setAssetsToMove([]);
    setSelectedIds(new Set());
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      success('CDN link copied to clipboard.');
    } catch {
      // Fallback
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4 font-sans">
        <PageHeader
          title="Orphaned & Unattached Media"
          description="Assets stored in your library that are not currently linked to any product, category, or collection."
          breadcrumbs={[
            { label: 'Media Library', path: '/admin/media' },
            { label: 'Orphaned Assets' },
          ]}
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/media')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Library
          </Button>
        </PageHeader>

        {/* Toolbar */}
        <div className="p-4 bg-white rounded-xl border border-sand-300 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                placeholder="Search unattached media..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-sand-100 p-0.5 rounded-lg border border-sand-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${
                    viewMode === 'grid' ? 'bg-white text-charcoal-900 shadow-xs' : 'text-charcoal-500'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${
                    viewMode === 'list' ? 'bg-white text-charcoal-900 shadow-xs' : 'text-charcoal-500'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center justify-between text-xs">
              <div className="text-amber-900 font-medium">
                {selectedIds.size} orphaned asset{selectedIds.size > 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                {canUpdate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
                      setAssetsToMove(selectedAssets);
                    }}
                    leftIcon={<FolderInput className="w-3.5 h-3.5" />}
                  >
                    Move to Folder ({selectedIds.size})
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsBulkDeleting(true)}
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete ({selectedIds.size})
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Asset View */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to load orphaned media"
              message={orphanError instanceof Error ? orphanError.message : 'Error loading media.'}
              onRetry={refetch}
            />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No orphaned media assets"
              description="All media assets in your library are organized or attached to catalog curations."
            />
          ) : viewMode === 'grid' ? (
            <MediaGrid
              assets={assets}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onOpenDetail={(asset) => setInspectingAsset(asset)}
              onMoveAsset={(asset) => setAssetsToMove([asset])}
              onDeleteAsset={(asset) => setAssetToDelete(asset)}
              onCopyUrl={handleCopyUrl}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          ) : (
            <MediaTable
              assets={assets}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onOpenDetail={(asset) => setInspectingAsset(asset)}
              onMoveAsset={(asset) => setAssetsToMove([asset])}
              onDeleteAsset={(asset) => setAssetToDelete(asset)}
              onCopyUrl={handleCopyUrl}
              canUpdate={canUpdate}
              canDelete={canDelete}
            />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-sand-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      <MediaDetailDrawer
        isOpen={Boolean(inspectingAsset)}
        onClose={() => setInspectingAsset(null)}
        asset={inspectingAsset}
        onUpdateMetadata={async (id, payload) => {
          const updated = await updateAssetMutation.mutateAsync({ id, payload });
          setInspectingAsset(updated);
        }}
        onMoveAsset={(asset) => setAssetsToMove([asset])}
        onDeleteAsset={(asset) => setAssetToDelete(asset)}
        canUpdate={canUpdate}
        canDelete={canDelete}
        isUpdating={updateAssetMutation.isPending}
      />

      {/* Move Modal */}
      <MediaMoveModal
        isOpen={assetsToMove.length > 0}
        onClose={() => setAssetsToMove([])}
        assetsToMove={assetsToMove}
        folders={folders}
        onConfirmMove={handleConfirmMove}
        isLoading={moveAssetsMutation.isPending}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(assetToDelete)}
        title={`Delete Media "${assetToDelete?.title || assetToDelete?.originalFilename}"?`}
        message="Are you sure you want to permanently delete this unattached asset?"
        confirmLabel="Delete Asset"
        variant="danger"
        isLoading={deleteAssetMutation.isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setAssetToDelete(null)}
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleting}
        title={`Delete ${selectedIds.size} Media Assets?`}
        message={`Are you sure you want to permanently delete ${selectedIds.size} unattached media assets?`}
        confirmLabel="Delete Assets"
        variant="danger"
        isLoading={deleteAssetMutation.isPending}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleting(false)}
      />
    </PageContainer>
  );
};
