import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { CategoryStatusBadge } from '../../components/categories/CategoryStatusBadge';
import { HierarchyBreadcrumb } from '../../components/categories/HierarchyBreadcrumb';
import { CategoryAttributeManager } from '../../components/categories/CategoryAttributeManager';
import { FilterPreview } from '../../components/categories/FilterPreview';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import {
  useCategoryDetail,
  useCategoryChildren,
  useCategoryAncestors,
  useDeleteCategory,
} from '../../hooks/useCategories';
import {
  Folder,
  Edit2,
  Trash2,
  Plus,
  Sliders,
  Eye,
  Image as ImageIcon,
  Search,
} from 'lucide-react';

export const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('category.update');
  const canDelete = hasPermission('category.delete');
  const canCreate = hasPermission('category.create');

  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: category,
    isLoading,
    isError,
    error,
    refetch,
  } = useCategoryDetail(id || '');

  const { data: children = [] } = useCategoryChildren(id || '');
  const { data: ancestors = [] } = useCategoryAncestors(id || '');

  const deleteMutation = useDeleteCategory();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/admin/categories');
    } catch {
      // Handled by mutation toast
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !category) {
    return (
      <PageContainer>
        <ErrorState
          title="Category Not Found"
          message={(error as any)?.message || 'The requested category does not exist.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Folder },
    { id: 'attributes', label: 'Attributes & Filters', icon: Sliders },
    { id: 'filter-preview', label: 'Filter Preview', icon: Eye },
    { id: 'media', label: 'Media & Imagery', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Metadata', icon: Search },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Breadcrumb path */}
        <HierarchyBreadcrumb ancestors={ancestors} currentName={category.name} />

        {/* Page Header */}
        <PageHeader
          title={
            <div className="flex items-center space-x-3">
              <span>{category.name}</span>
              <CategoryStatusBadge
                status={category.status}
                isFeatured={category.isFeatured}
                size="md"
              />
            </div>
          }
          description={`Slug: /${category.slug} • Order: ${category.sortOrder ?? 0}`}
        >
          <div className="flex items-center space-x-2">
            {canCreate && (
              <Link to={`/admin/categories/new?parentId=${category.id}`}>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Subcategory</span>
                </Button>
              </Link>
            )}
            {canUpdate && (
              <Link to={`/admin/categories/${category.id}/edit`}>
                <Button variant="primary" size="sm" className="flex items-center space-x-1">
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Category</span>
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Navigation Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Details & Subcategories */}
            <div className="lg:col-span-2 space-y-6">
              {/* Short & Full Description */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Category Description
                </h3>

                {category.shortDescription && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 font-sans">
                      Short Description
                    </span>
                    <p className="text-sm text-charcoal-800 font-serif mt-1">
                      {category.shortDescription}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 font-sans">
                    Full Description
                  </span>
                  <p className="text-sm text-charcoal-700 font-serif mt-1 whitespace-pre-line leading-relaxed">
                    {category.description || 'No detailed description provided.'}
                  </p>
                </div>
              </div>

              {/* Direct Subcategories */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-sand-200 pb-2">
                  <h3 className="text-sm font-serif font-semibold text-charcoal-900">
                    Child Subcategories ({children.length})
                  </h3>
                  {canCreate && (
                    <Link
                      to={`/admin/categories/new?parentId=${category.id}`}
                      className="text-xs text-gold-600 hover:text-gold-700 font-medium inline-flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Child
                    </Link>
                  )}
                </div>

                {children.length === 0 ? (
                  <p className="text-xs text-charcoal-500 font-sans italic py-2">
                    No child categories directly under this category.
                  </p>
                ) : (
                  <div className="divide-y divide-sand-100">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="py-3 flex items-center justify-between hover:bg-sand-50/50 px-2 rounded transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Folder className="w-4 h-4 text-charcoal-400" />
                          <Link
                            to={`/admin/categories/${child.id}`}
                            className="font-medium text-sm text-charcoal-900 hover:text-gold-600 font-serif"
                          >
                            {child.name}
                          </Link>
                          <span className="text-xs text-charcoal-400 font-mono">
                            /{child.slug}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <CategoryStatusBadge
                            status={child.status}
                            isFeatured={child.isFeatured}
                            size="sm"
                          />
                          <Link
                            to={`/admin/categories/${child.id}`}
                            className="p-1 text-charcoal-400 hover:text-charcoal-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Hierarchy & Timestamps */}
            <div className="space-y-6">
              {/* Hierarchy Info */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  Taxonomy Details
                </h3>

                <div className="space-y-3 text-xs font-sans">
                  <div>
                    <span className="text-charcoal-500 font-semibold uppercase">Parent Node:</span>
                    <p className="text-charcoal-900 font-serif text-sm mt-0.5">
                      {category.parent ? (
                        <Link
                          to={`/admin/categories/${category.parent.id}`}
                          className="hover:text-gold-600 underline decoration-sand-300"
                        >
                          {category.parent.name}
                        </Link>
                      ) : (
                        <span className="text-charcoal-400 italic">Top-Level Root</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-charcoal-500 font-semibold uppercase">Sort Order:</span>
                    <p className="text-charcoal-900 font-mono text-sm mt-0.5">
                      {category.sortOrder ?? 0}
                    </p>
                  </div>

                  <div>
                    <span className="text-charcoal-500 font-semibold uppercase">Storefront URL:</span>
                    <p className="text-charcoal-700 font-mono text-xs mt-0.5 truncate">
                      /categories/{category.slug}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Timestamps */}
              <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-3 text-xs text-charcoal-600 font-sans">
                <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                  System Metadata
                </h3>
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="font-mono text-charcoal-800">
                    {category.createdAt ? new Date(category.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated:</span>
                  <span className="font-mono text-charcoal-800">
                    {category.updatedAt ? new Date(category.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Attributes & Filters */}
        {activeTab === 'attributes' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm">
            <CategoryAttributeManager categoryId={category.id} readOnly={!canUpdate} />
          </div>
        )}

        {/* Tab 3: Storefront Filter Preview */}
        {activeTab === 'filter-preview' && (
          <div className="max-w-xl">
            <FilterPreview categorySlug={category.slug} />
          </div>
        )}

        {/* Tab 4: Media & Imagery */}
        {activeTab === 'media' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-6">
            <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
              Category Media
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans block mb-2">
                  Thumbnail Image
                </span>
                {category.image ? (
                  <div className="space-y-2">
                    <img
                      src={category.image}
                      alt={category.imageAlt || category.name}
                      className="w-48 h-48 rounded-lg object-cover border border-sand-200 shadow-xs"
                    />
                    <p className="text-xs text-charcoal-500 font-sans">
                      Alt: {category.imageAlt || '(None)'}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 bg-sand-50 rounded-lg border border-dashed border-sand-200 text-center text-charcoal-400 text-xs">
                    No thumbnail image uploaded.
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans block mb-2">
                  Banner Image
                </span>
                {category.bannerImage ? (
                  <div className="space-y-2">
                    <img
                      src={category.bannerImage}
                      alt={category.bannerImageAlt || category.name}
                      className="w-full h-36 rounded-lg object-cover border border-sand-200 shadow-xs"
                    />
                    <p className="text-xs text-charcoal-500 font-sans">
                      Alt: {category.bannerImageAlt || '(None)'}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 bg-sand-50 rounded-lg border border-dashed border-sand-200 text-center text-charcoal-400 text-xs">
                    No banner image uploaded.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: SEO & Metadata */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4 max-w-3xl font-sans">
            <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
              Search Engine Optimization (SEO)
            </h3>

            <div className="grid grid-cols-1 gap-4 text-xs">
              <div>
                <span className="font-semibold text-charcoal-600 uppercase">Meta Title:</span>
                <p className="text-charcoal-900 font-serif text-sm mt-0.5">
                  {category.metaTitle || `${category.name} | Lagoree Arts`}
                </p>
              </div>

              <div>
                <span className="font-semibold text-charcoal-600 uppercase">Meta Description:</span>
                <p className="text-charcoal-800 font-serif text-sm mt-0.5">
                  {category.metaDescription || category.shortDescription || 'No meta description set.'}
                </p>
              </div>

              {category.canonicalUrl && (
                <div>
                  <span className="font-semibold text-charcoal-600 uppercase">Canonical URL:</span>
                  <p className="text-charcoal-800 font-mono text-xs mt-0.5">
                    {category.canonicalUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${category.name}"? You cannot delete a category that contains active subcategories or assigned products.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
