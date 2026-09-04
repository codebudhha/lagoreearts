import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Skeleton } from '../../components/feedback/Skeleton';
import { FolderTree } from '../../components/media/FolderTree';
import { FolderModal } from '../../components/media/FolderModal';
import { MediaGrid } from '../../components/media/MediaGrid';
import { MediaTable } from '../../components/media/MediaTable';
import { MediaDetailDrawer } from '../../components/media/MediaDetailDrawer';
import { MediaMoveModal } from '../../components/media/MediaMoveModal';
import { MediaUploader } from '../../components/media/MediaUploader';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  useMediaFolders,
  useMediaFolderDetail,
  useCreateMediaFolder,
  useUpdateMediaFolder,
  useDeleteMediaFolder,
  useMediaList,
  useUpdateMediaAsset,
  useDeleteMediaAsset,
  useMoveMediaAssets,
} from '../../hooks/useMedia';
import {
  MediaFolder,
  MediaAsset,
  CreateFolderPayload,
  UpdateFolderPayload,
} from '../../lib/api/media';
import {
  LayoutGrid,
  List as ListIcon,
  UploadCloud,
  FolderPlus,
  Layers,
  Search,
  FolderInput,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export const MediaLibraryPage: React.FC = () => {
  const { id: routeFolderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { success, error } = useToast();

  const canCreate = hasPermission('media.create') || hasPermission('media-folder.create');
  const canUpdate = hasPermission('media.update') || hasPermission('media-folder.update');
  const canDelete = hasPermission('media.delete') || hasPermission('media-folder.delete');

  // Selected folder (from route or local state)
  const activeFolderId = routeFolderId || null;

  // View mode: 'grid' | 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search & Filter State
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [mimeFilter, setMimeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fileSize' | 'filename'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(24);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal / Drawer States
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [folderModalState, setFolderModalState] = useState<{
    isOpen: boolean;
    folderToEdit?: MediaFolder | null;
    parentFolderId?: string | null;
  }>({ isOpen: false });

  const [inspectingAsset, setInspectingAsset] = useState<MediaAsset | null>(null);
  const [assetsToMove, setAssetsToMove] = useState<MediaAsset[]>([]);
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<MediaFolder | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Queries
  const { data: folders = [], refetch: refetchFolders } = useMediaFolders();
  const { data: currentFolder } = useMediaFolderDetail(activeFolderId || '', Boolean(activeFolderId));

  const {
    data: mediaData,
    isLoading: isLoadingMedia,
    isError: isErrorMedia,
    error: mediaError,
    refetch: refetchMedia,
  } = useMediaList({
    page,
    limit,
    search: debouncedSearch || undefined,
    folderId: activeFolderId || undefined,
    mimeType: mimeFilter || undefined,
    sortBy,
    sortOrder,
  });

  // Mutations
  const createFolderMutation = useCreateMediaFolder();
  const updateFolderMutation = useUpdateMediaFolder();
  const deleteFolderMutation = useDeleteMediaFolder();
  const updateAssetMutation = useUpdateMediaAsset();
  const deleteAssetMutation = useDeleteMediaAsset();
  const moveAssetsMutation = useMoveMediaAssets();

  const assets = mediaData?.media || [];
  const total = mediaData?.total || 0;
  const totalPages = mediaData?.totalPages || 1;

  // Folder navigation
  const handleSelectFolder = (folderId: string | null) => {
    setSelectedIds(new Set());
    setPage(1);
    if (folderId) {
      navigate(`/admin/media/folders/${folderId}`);
    } else {
      navigate('/admin/media');
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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

  // Folder modal submit
  const handleFolderSubmit = async (payload: CreateFolderPayload | UpdateFolderPayload) => {
    if (folderModalState.folderToEdit) {
      await updateFolderMutation.mutateAsync({
        id: folderModalState.folderToEdit.id,
        payload,
      });
    } else {
      await createFolderMutation.mutateAsync(payload as CreateFolderPayload);
    }
    setFolderModalState({ isOpen: false });
  };

  // Delete folder with safe 409 handling
  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolderMutation.mutateAsync(folderToDelete.id);
      setFolderToDelete(null);
      if (activeFolderId === folderToDelete.id) {
        navigate('/admin/media');
      }
    } catch {
      // Handled by toast / 409
    }
  };

  // Single asset delete
  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      await deleteAssetMutation.mutateAsync(assetToDelete.id);
      setAssetToDelete(null);
      if (inspectingAsset?.id === assetToDelete.id) {
        setInspectingAsset(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(assetToDelete.id);
        return next;
      });
    } catch {
      // Handled by toast
    }
  };

  // Bulk delete
  const handleConfirmBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await deleteAssetMutation.mutateAsync(id);
      }
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      success(`Deleted ${ids.length} media asset${ids.length > 1 ? 's' : ''}.`);
    } catch (err: any) {
      error(err?.message || 'Some media assets could not be deleted because they may be in use.');
      setIsBulkDeleting(false);
    }
  };

  // Move assets
  const handleConfirmMove = async (destinationFolderId: string | null) => {
    const assetIds = assetsToMove.map((a) => a.id);
    await moveAssetsMutation.mutateAsync({ assetIds, folderId: destinationFolderId });
    setAssetsToMove([]);
    setSelectedIds(new Set());
  };

  // Copy URL helper
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      success('CDN link copied to clipboard.', { title: 'URL Copied' });
    } catch {
      // Fallback
    }
  };

  return (
    <PageContainer>
      <div className="space-y-4 font-sans">
        {/* Main Header */}
        <PageHeader
          title="Media Library"
          description="Centralized high-resolution artwork imagery, lookbooks, and media assets."
          breadcrumbs={[
            { label: 'Media Library', path: '/admin/media' },
            ...(currentFolder ? [{ label: currentFolder.name }] : []),
          ]}
        >
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFolderModalState({
                    isOpen: true,
                    parentFolderId: activeFolderId,
                  })
                }
                leftIcon={<FolderPlus className="w-4 h-4 text-gold-600" />}
              >
                New Folder
              </Button>
            )}

            {canCreate && (
              <Button
                type="button"
                variant="primary"
                onClick={() => setIsUploaderOpen(true)}
                leftIcon={<UploadCloud className="w-4 h-4" />}
              >
                Upload Media
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Workspace Layout: Left Sidebar + Main Asset View */}
        <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[680px]">
          {/* Left Folder Hierarchy Tree */}
          <FolderTree
            folders={folders}
            selectedFolderId={activeFolderId}
            onSelectFolder={handleSelectFolder}
            onSelectOrphans={() => navigate('/admin/media/orphans')}
            onCreateFolder={(parentId) =>
              setFolderModalState({ isOpen: true, parentFolderId: parentId })
            }
            onRenameFolder={(folder) =>
              setFolderModalState({ isOpen: true, folderToEdit: folder })
            }
            onDeleteFolder={(folder) => setFolderToDelete(folder)}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            totalAssets={total}
          />

          {/* Right Main Asset Viewport */}
          <div className="flex-1 flex flex-col min-w-0 bg-sand-50/20">
            {/* Top Toolbar (Search, Filter, Sort, View Mode) */}
            <div className="p-3 border-b border-sand-200 bg-white flex flex-wrap items-center justify-between gap-3">
              {/* Left: Search input */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search assets by title or filename..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-sand-50/50"
                />
              </div>

              {/* Right: Format filter, Sort selector, View toggle */}
              <div className="flex items-center gap-2">
                {/* Format Filter */}
                <select
                  value={mimeFilter}
                  onChange={(e) => {
                    setMimeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-sand-50 border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="">All Formats</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                  <option value="image/avif">AVIF</option>
                </select>

                {/* Sort dropdown */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split('-');
                    setSortBy(s as any);
                    setSortOrder(o as any);
                    setPage(1);
                  }}
                  className="px-2.5 py-1.5 text-xs bg-sand-50 border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="fileSize-desc">Largest Size</option>
                  <option value="fileSize-asc">Smallest Size</option>
                  <option value="filename-asc">Filename (A-Z)</option>
                </select>

                {/* Grid / List View Switcher */}
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

            {/* Breadcrumb & Context Indicator Bar */}
            <div className="px-4 py-2 bg-sand-50/70 border-b border-sand-200 flex items-center justify-between text-xs text-charcoal-600">
              <div className="flex items-center gap-1.5 font-medium">
                <button
                  type="button"
                  onClick={() => handleSelectFolder(null)}
                  className="hover:text-gold-700 transition-colors flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5 text-gold-600" />
                  All Media
                </button>
                {currentFolder && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
                    <span className="text-charcoal-900 font-semibold">{currentFolder.name}</span>
                  </>
                )}
              </div>

              <div className="text-[11px] font-mono text-charcoal-500">
                {total} asset{total !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Bulk Selection Action Bar (Appears when items are selected) */}
            {selectedIds.size > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between animate-in fade-in text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-medium">
                  <span className="w-2 h-2 rounded-full bg-gold-600" />
                  <span>
                    {selectedIds.size} asset{selectedIds.size > 1 ? 's' : ''} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-charcoal-500 hover:text-charcoal-800 underline ml-2"
                  >
                    Clear selection
                  </button>
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
                      Move ({selectedIds.size})
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

            {/* Main Content Area */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              {isLoadingMedia ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                  ))}
                </div>
              ) : isErrorMedia ? (
                <ErrorState
                  title="Failed to load media assets"
                  message={mediaError instanceof Error ? mediaError.message : 'Error loading media assets.'}
                  onRetry={refetchMedia}
                />
              ) : assets.length === 0 ? (
                <EmptyState
                  title={searchInput || mimeFilter ? 'No matching media assets' : 'Folder is empty'}
                  description={
                    searchInput || mimeFilter
                      ? 'No assets match your search or format filters. Try adjusting your filters.'
                      : 'Upload high-resolution photography, scans, and artworks to this folder.'
                  }
                  actionLabel={canCreate ? 'Upload Media' : undefined}
                  onAction={canCreate ? () => setIsUploaderOpen(true) : undefined}
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
                <div className="mt-6 pt-4 border-t border-sand-200">
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
        </div>
      </div>

      {/* Modals & Drawers */}
      {/* 1. Uploader Modal */}
      <MediaUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        currentFolderId={activeFolderId}
        folders={folders}
        onUploadComplete={() => {
          setIsUploaderOpen(false);
          refetchMedia();
          refetchFolders();
        }}
      />

      {/* 2. Folder Modal (Create / Rename) */}
      <FolderModal
        isOpen={folderModalState.isOpen}
        onClose={() => setFolderModalState({ isOpen: false })}
        folderToEdit={folderModalState.folderToEdit}
        parentFolderId={folderModalState.parentFolderId}
        folders={folders}
        onSubmit={handleFolderSubmit}
        isLoading={createFolderMutation.isPending || updateFolderMutation.isPending}
      />

      {/* 3. Detail Inspection Drawer */}
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

      {/* 4. Move Modal */}
      <MediaMoveModal
        isOpen={assetsToMove.length > 0}
        onClose={() => setAssetsToMove([])}
        assetsToMove={assetsToMove}
        folders={folders}
        onConfirmMove={handleConfirmMove}
        isLoading={moveAssetsMutation.isPending}
      />

      {/* 5. Single Asset Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(assetToDelete)}
        title={`Delete Media "${assetToDelete?.title || assetToDelete?.originalFilename}"?`}
        message="Are you sure you want to permanently delete this media asset? Note: If this asset is attached to any products or collections, deletion will be blocked by safety rules."
        confirmLabel="Delete Asset"
        variant="danger"
        isLoading={deleteAssetMutation.isPending}
        onConfirm={handleConfirmDeleteAsset}
        onClose={() => setAssetToDelete(null)}
      />

      {/* 6. Bulk Asset Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleting}
        title={`Delete ${selectedIds.size} Media Assets?`}
        message={`Are you sure you want to permanently delete ${selectedIds.size} media assets? Assets attached to active catalogue products or collections will be preserved.`}
        confirmLabel="Delete Assets"
        variant="danger"
        isLoading={deleteAssetMutation.isPending}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleting(false)}
      />

      {/* 7. Folder Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(folderToDelete)}
        title={`Delete Folder "${folderToDelete?.name}"?`}
        message="Are you sure you want to delete this folder? Note: Folders containing subfolders or media assets cannot be deleted until emptied."
        confirmLabel="Delete Folder"
        variant="danger"
        isLoading={deleteFolderMutation.isPending}
        onConfirm={handleConfirmDeleteFolder}
        onClose={() => setFolderToDelete(null)}
      />
    </PageContainer>
  );
};
