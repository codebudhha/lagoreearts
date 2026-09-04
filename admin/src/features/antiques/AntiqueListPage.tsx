import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { AuthenticityBadge } from '../../components/antiques/AuthenticityBadge';
import { ConditionBadge } from '../../components/antiques/ConditionBadge';
import { useAntiquesList, useDeleteAntiqueProfile } from '../../hooks/useAntiques';
import { useAuth } from '../../hooks/useAuth';
import { AntiqueProductListItem } from '../../lib/api/antiques';
import {
  Eye,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';

export const AntiqueListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('antique.update');
  const canDelete = hasPermission('antique.delete');

  const [search, setSearch] = useState('');
  const [authenticityFilter, setAuthenticityFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [itemToDelete, setItemToDelete] = useState<AntiqueProductListItem | null>(null);

  const { data, isLoading, isError, error, refetch } = useAntiquesList({
    page,
    limit,
    search: search || undefined,
    authenticityStatus: authenticityFilter !== 'ALL' ? authenticityFilter : undefined,
    condition: conditionFilter !== 'ALL' ? conditionFilter : undefined,
  });

  const deleteMutation = useDeleteAntiqueProfile();

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete.id);
    setItemToDelete(null);
  };

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <PageContainer>
      <PageHeader
        title="Antiques & Rare Collectibles"
        description="Curate historical antiquities, certificates of authenticity, provenance narratives, and physical specifications."
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Antiques & Collectibles' },
        ]}
      >
        <Link to="/admin/products">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Package className="w-4 h-4" />}
          >
            Browse Products to Tag
          </Button>
        </Link>
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
            placeholder="Search by artwork name, era, origin..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={authenticityFilter}
            onChange={(e) => {
              setAuthenticityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Authenticity' },
              { value: 'VERIFIED', label: 'Verified Only' },
              { value: 'UNVERIFIED', label: 'Unverified Only' },
            ]}
            className="w-40"
          />

          <Select
            value={conditionFilter}
            onChange={(e) => {
              setConditionFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Conditions' },
              { value: 'EXCELLENT', label: 'Excellent' },
              { value: 'VERY_GOOD', label: 'Very Good' },
              { value: 'GOOD', label: 'Good' },
              { value: 'RESTORED', label: 'Restored' },
            ]}
            className="w-40"
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
          title="Failed to Load Antiques"
          message={(error as any)?.message || 'Could not fetch antiques catalogue.'}
          onRetry={() => refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No Antique Profiles Found"
          description={
            search || authenticityFilter !== 'ALL'
              ? 'No antiques match your active search or filter criteria.'
              : 'No products currently have an antique profile attached. You can designate any product as an antique via its product detail page.'
          }
          actionLabel="View Products"
          onAction={() => navigate('/admin/products')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-charcoal-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Art antiquity / Product</th>
                  <th className="py-3 px-4">Era & Lineage</th>
                  <th className="py-3 px-4">Authenticity</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">One-of-a-Kind</th>
                  <th className="py-3 px-4">Valuation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {items.map((prod) => {
                  const ap = prod.antiqueProfile;
                  return (
                    <tr key={prod.id} className="hover:bg-sand-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-sand-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-sand-300">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-charcoal-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/antiques/${prod.id}`}
                              className="font-semibold text-charcoal-900 hover:text-champagne-600 font-serif text-sm truncate block"
                            >
                              {prod.name}
                            </Link>
                            <span className="text-[11px] text-charcoal-500 block font-mono">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-700">
                        {ap?.era || ap?.origin ? (
                          <div>
                            <span className="font-medium text-charcoal-900 font-serif block">{ap.era || '—'}</span>
                            <span className="text-[11px] text-charcoal-500 block">{ap.origin || ap.countryOfOrigin || ''}</span>
                          </div>
                        ) : (
                          <span className="text-charcoal-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {ap ? (
                          <AuthenticityBadge
                            status={ap.authenticityStatus}
                            isCertified={ap.isCertified}
                          />
                        ) : (
                          <span className="text-charcoal-400 italic">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <ConditionBadge condition={ap?.condition} />
                      </td>

                      <td className="py-3.5 px-4">
                        {ap?.isOneOfAKind ? (
                          <Badge variant="champagne" size="sm">
                            Unique 1-of-1
                          </Badge>
                        ) : (
                          <Badge variant="secondary" size="sm">
                            Numbered Edition
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-charcoal-900 font-medium font-serif text-sm">
                        ₹{Number(prod.price).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/admin/antiques/${prod.id}`}>
                            <button
                              type="button"
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                              title="View Antique Specifications"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {canUpdate && (
                            <Link to={`/admin/antiques/${prod.id}/edit`}>
                              <button
                                type="button"
                                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded hover:bg-sand-200"
                                title="Edit Specifications"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </Link>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setItemToDelete(prod)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                              title="Remove Antique Profile"
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
          {totalPages > 1 && (
            <div className="p-4 border-t border-sand-200 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
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
        title="Remove Antique Profile"
        message={`Are you sure you want to remove the antique profile from "${itemToDelete?.name}"? The underlying catalog product will not be affected.`}
        confirmLabel="Remove Profile"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
