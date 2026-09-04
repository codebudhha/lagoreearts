import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { FilterBar, FilterSelectConfig } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { AttributeTypeBadge } from '../../components/attributes/AttributeTypeBadge';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Skeleton } from '../../components/feedback/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import {
  useAttributesList,
  useDeleteAttribute,
} from '../../hooks/useAttributes';
import { AdminAttribute } from '../../lib/api/attributes';
import {
  Plus,
  Sliders,
  Eye,
  Edit2,
  Trash2,
  Lock,
  Tag,
} from 'lucide-react';

export const AttributeListPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission('attribute.create');
  const canUpdate = hasPermission('attribute.update');
  const canDelete = hasPermission('attribute.delete');

  // Query & Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterableFilter, setFilterableFilter] = useState('');
  const [systemFilter, setSystemFilter] = useState('');

  // Delete modal state
  const [attributeToDelete, setAttributeToDelete] = useState<AdminAttribute | null>(
    null
  );

  const { data, isLoading, isError, error, refetch } = useAttributesList({
    page,
    limit,
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    filterable: filterableFilter === 'filterable' ? true : undefined,
    system:
      systemFilter === 'system'
        ? true
        : systemFilter === 'custom'
        ? false
        : undefined,
  });

  const deleteMutation = useDeleteAttribute();

  const handleDelete = async () => {
    if (!attributeToDelete) return;
    try {
      await deleteMutation.mutateAsync(attributeToDelete.id);
      setAttributeToDelete(null);
    } catch {
      // Handled by mutation toast
    }
  };

  const filterSelects: FilterSelectConfig[] = [
    {
      key: 'type',
      label: 'Type',
      value: typeFilter,
      options: [
        { label: 'All Types', value: '' },
        { label: 'Text', value: 'TEXT' },
        { label: 'Select', value: 'SELECT' },
        { label: 'Multi-Select', value: 'MULTI_SELECT' },
        { label: 'Boolean', value: 'BOOLEAN' },
        { label: 'Number', value: 'NUMBER' },
        { label: 'Range', value: 'RANGE' },
      ],
      onChange: (val) => {
        setTypeFilter(val);
        setPage(1);
      },
    },
    {
      key: 'filterable',
      label: 'Storefront Facet',
      value: filterableFilter,
      options: [
        { label: 'All Attributes', value: '' },
        { label: 'Filterable Only', value: 'filterable' },
      ],
      onChange: (val) => {
        setFilterableFilter(val);
        setPage(1);
      },
    },
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
      onChange: (val) => {
        setStatusFilter(val);
        setPage(1);
      },
    },
    {
      key: 'origin',
      label: 'Origin',
      value: systemFilter,
      options: [
        { label: 'All Attributes', value: '' },
        { label: 'System Default', value: 'system' },
        { label: 'Custom User-Created', value: 'custom' },
      ],
      onChange: (val) => {
        setSystemFilter(val);
        setPage(1);
      },
    },
  ];

  const handleResetFilters = () => {
    setSearchInput('');
    setTypeFilter('');
    setStatusFilter('');
    setFilterableFilter('');
    setSystemFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchInput || typeFilter || statusFilter || filterableFilter || systemFilter
  );

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <PageContainer>
      <PageHeader
        title="Attributes & Specifications"
        description="Manage product specifications, dynamic facets, and filter dimensions."
      >
        {canCreate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/attributes/new')}
            className="flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>Add Attribute</span>
          </Button>
        )}
      </PageHeader>

      <FilterBar
        searchPlaceholder="Search attributes by name, slug..."
        searchValue={searchInput}
        onSearchChange={(val) => {
          setSearchInput(val);
          setPage(1);
        }}
        selectFilters={filterSelects}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {isLoading ? (
        <div className="space-y-3 bg-white p-6 rounded-lg border border-sand-200">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load attributes"
          message={(error as any)?.message || 'Could not fetch attributes list.'}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Sliders className="w-10 h-10 text-charcoal-400" />}
          title="No Attributes Found"
          description={
            hasActiveFilters
              ? 'No attributes match your filter criteria. Try clearing search filters.'
              : 'Create specifications like Material, Dimensions, Medium, and Frame Type to enrich your catalog.'
          }
          actionLabel={canCreate && !hasActiveFilters ? 'Add First Attribute' : undefined}
          onAction={canCreate && !hasActiveFilters ? () => navigate('/admin/attributes/new') : undefined}
        />
      ) : (
        <div className="bg-white rounded-lg border border-sand-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sand-200 text-left text-sm">
              <thead className="bg-sand-50 text-xs font-semibold text-charcoal-600 uppercase tracking-wider font-sans">
                <tr>
                  <th className="py-3 px-4">Attribute Name</th>
                  <th className="py-3 px-4">Slug / Code</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Storefront Filter</th>
                  <th className="py-3 px-4 text-center">Required</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 font-serif">
                {items.map((attr) => (
                  <tr key={attr.id} className="hover:bg-sand-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {attr.isSystem ? (
                          <span title="System Protected Attribute">
                            <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          </span>
                        ) : (
                          <Tag className="w-3.5 h-3.5 text-charcoal-400 flex-shrink-0" />
                        )}
                        <Link
                          to={`/admin/attributes/${attr.id}`}
                          className="font-medium text-charcoal-900 hover:text-gold-700 transition-colors"
                        >
                          {attr.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-500">
                      {attr.slug}
                    </td>
                    <td className="py-3 px-4">
                      <AttributeTypeBadge type={attr.type} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {attr.isFilterable ? (
                        <Badge variant="champagne" size="sm">
                          Filterable
                        </Badge>
                      ) : (
                        <span className="text-xs text-charcoal-400 font-sans">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {attr.isRequired ? (
                        <Badge variant="warning" size="sm">
                          Required
                        </Badge>
                      ) : (
                        <span className="text-xs text-charcoal-400 font-sans">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={attr.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-charcoal-600">
                      {attr.sortOrder ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link
                        to={`/admin/attributes/${attr.id}`}
                        className="inline-flex p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canUpdate && (
                        <Link
                          to={`/admin/attributes/${attr.id}/edit`}
                          className="inline-flex p-1.5 text-charcoal-500 hover:text-gold-600 hover:bg-sand-100 rounded transition-colors"
                          title="Edit Attribute"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setAttributeToDelete(attr)}
                          disabled={attr.isSystem}
                          className={`inline-flex p-1.5 rounded transition-colors ${
                            attr.isSystem
                              ? 'text-sand-300 cursor-not-allowed'
                              : 'text-charcoal-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={
                            attr.isSystem
                              ? 'System attributes cannot be deleted'
                              : 'Delete Attribute'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="p-4 border-t border-sand-200">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(attributeToDelete)}
        onClose={() => setAttributeToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Attribute"
        message={`Are you sure you want to delete attribute "${attributeToDelete?.name}"? Make sure it is not assigned to categories, option values, or active product records.`}
        confirmLabel="Delete Attribute"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
