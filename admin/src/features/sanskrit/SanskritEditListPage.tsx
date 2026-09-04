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
import { SanskritPublishingBadge } from '../../components/sanskrit/SanskritPublishingBadge';
import {
  useSanskritEditList,
  useDeleteSanskritEditProfile,
} from '../../hooks/useSanskritEdit';
import { useAuth } from '../../hooks/useAuth';
import { SanskritEditProfile } from '../../lib/api/sanskritEdit';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';

export const SanskritEditListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('sanskrit-edit.create');
  const canUpdate = hasPermission('sanskrit-edit.update');
  const canDelete = hasPermission('sanskrit-edit.delete');

  const [search, setSearch] = useState('');
  const [publishedFilter, setPublishedFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [itemToDelete, setItemToDelete] = useState<SanskritEditProfile | null>(null);

  const { data, isLoading, isError, error, refetch } = useSanskritEditList({
    page,
    limit,
    search: search || undefined,
    isPublished: publishedFilter === 'ALL' ? undefined : publishedFilter === 'true',
    isFeatured: featuredFilter === 'ALL' ? undefined : featuredFilter === 'true',
  });

  const deleteMutation = useDeleteSanskritEditProfile();

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.productId);
    setItemToDelete(null);
  };

  const items = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  return (
    <PageContainer>
      <PageHeader
        title="The Sanskrit Edit"
        description="Curate sacred Sanskrit verses, Devanagari calligraphy, IAST transliterations, translations, and philosophical contexts."
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'The Sanskrit Edit' },
        ]}
      >
        {canCreate && (
          <Link to="/admin/sanskrit-edit/new">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Sanskrit Entry
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-sand-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[240px] max-w-md">
          <SearchInput
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search verses, titles, scriptures, themes..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={publishedFilter}
            onChange={(e) => {
              setPublishedFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'true', label: 'Published Only' },
              { value: 'false', label: 'Drafts Only' },
            ]}
            className="w-36"
          />

          <Select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Curation' },
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
          title="Failed to Load Sanskrit Edit Entries"
          message={(error as any)?.message || 'Could not fetch Sanskrit Edit catalogue.'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No Sanskrit Edit Profiles Found"
          description={
            search || publishedFilter !== 'ALL' || featuredFilter !== 'ALL'
              ? 'No entries match your search or filter criteria.'
              : 'No Sanskrit Edit entries have been created yet.'
          }
          actionLabel={canCreate ? 'Create First Entry' : undefined}
          onAction={canCreate ? () => navigate('/admin/sanskrit-edit/new') : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-charcoal-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Sanskrit Shloka / Verse</th>
                  <th className="py-3 px-4">Artwork Product</th>
                  <th className="py-3 px-4">Scripture & Theme</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Publishing Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {items.map((item) => {
                  const prod = item.product;
                  return (
                    <tr key={item.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="min-w-0 space-y-0.5">
                          <Link
                            to={`/admin/sanskrit-edit/${item.productId}`}
                            className="font-semibold text-charcoal-900 hover:text-champagne-600 font-serif text-sm truncate block"
                          >
                            {item.sanskritTitle || 'Untitled Sanskrit Verse'}
                          </Link>
                          {item.devanagariText && (
                            <span className="text-xs font-serif text-charcoal-700 font-semibold block truncate bg-sand-50 px-2 py-0.5 rounded border border-sand-200/60">
                              {item.devanagariText}
                            </span>
                          )}
                          {item.transliteration && (
                            <span className="text-[11px] text-charcoal-500 italic block truncate font-serif">
                              {item.transliteration}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {prod ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-charcoal-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/products/${prod.id}`}
                                className="font-medium text-charcoal-900 hover:text-champagne-600 truncate block font-serif"
                              >
                                {prod.name}
                              </Link>
                              <span className="text-[11px] text-charcoal-500 block font-mono">
                                {prod.sku}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-charcoal-400 italic">ID: {item.productId}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-700">
                        {item.source || item.theme ? (
                          <div>
                            <span className="font-medium text-charcoal-900 font-serif block">{item.source || '—'}</span>
                            <span className="text-[11px] text-charcoal-500 block">{item.theme || ''}</span>
                          </div>
                        ) : (
                          <span className="text-charcoal-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-charcoal-600">
                        {item.displayOrder}
                      </td>

                      <td className="py-3.5 px-4">
                        <SanskritPublishingBadge
                          isPublished={item.isPublished}
                          isFeatured={item.isFeatured}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/sanskrit-edit/${item.productId}`}>
                            <button
                              type="button"
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                              title="View Sanskrit Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {canUpdate && (
                            <Link to={`/admin/sanskrit-edit/${item.productId}/edit`}>
                              <button
                                type="button"
                                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                                title="Edit Entry"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                              title="Remove Entry"
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
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Sanskrit Edit Entry"
        message={`Are you sure you want to remove the Sanskrit Edit profile for "${itemToDelete?.sanskritTitle || 'this product'}"?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
