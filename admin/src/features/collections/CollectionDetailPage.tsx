import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { CollectionStatusBadge } from '../../components/collections/CollectionStatusBadge';
import { CollectionTypeBadge } from '../../components/collections/CollectionTypeBadge';
import { CollectionProductManager } from '../../components/collections/CollectionProductManager';
import { CollectionMediaManager } from '../../components/collections/CollectionMediaManager';
import { CollectionPreview } from '../../components/collections/CollectionPreview';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import {
  useCollectionDetail,
  useCollectionProducts,
  useDeleteCollection,
} from '../../hooks/useCollections';
import {
  Layers,
  Edit2,
  Trash2,
  Package,
  Image as ImageIcon,
  Search,
  Eye,
  Sparkles,
  Lock,
  Globe,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('collections.update') || hasPermission('collection.update');
  const canDelete = hasPermission('collections.delete') || hasPermission('collection.delete');

  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: collection,
    isLoading,
    isError,
    error,
    refetch,
  } = useCollectionDetail(id || '');

  const { data: productsData } = useCollectionProducts(id || '', { limit: 12 }, Boolean(id));

  const deleteMutation = useDeleteCollection();

  const handleDelete = async () => {
    if (!id || !collection || collection.type === 'SYSTEM') return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/admin/collections');
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

  if (isError || !collection) {
    return (
      <PageContainer>
        <ErrorState
          title="Collection Not Found"
          message={(error as any)?.message || 'The requested collection does not exist.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const isSystem = collection.type === 'SYSTEM';

  const tabs = [
    { id: 'overview', label: 'Overview & Narrative', icon: Layers },
    {
      id: 'products',
      label: `Assigned Artworks (${productsData?.total ?? collection.productCount ?? 0})`,
      icon: Package,
    },
    { id: 'media', label: 'Imagery & Lookbook', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Metadata', icon: Search },
    { id: 'preview', label: 'Storefront Preview', icon: Eye },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={collection.name}
          description={`/${collection.slug}`}
          breadcrumbs={[
            { label: 'Collections', path: '/admin/collections' },
            { label: collection.name },
          ]}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/collections')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            {canUpdate && (
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/collections/${collection.id}/edit`)}
                leftIcon={<Edit2 className="w-4 h-4" />}
              >
                Edit Collection
              </Button>
            )}

            {canDelete && !isSystem && (
              <Button
                variant="danger"
                onClick={() => setIsDeleteDialogOpen(true)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            )}
          </div>
        </PageHeader>

        {/* System Collection Banner Alert */}
        {isSystem && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">System Collection Protected</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                This is a core system-level collection. It cannot be deleted and core structural properties are protected to ensure storefront stability.
              </p>
            </div>
          </div>
        )}

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-sand-300 shadow-xs font-sans">
            <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider block">
              Publication Status
            </span>
            <div className="mt-1 flex items-center gap-2">
              <CollectionStatusBadge
                status={collection.status}
                isFeatured={collection.isFeatured}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-sand-300 shadow-xs font-sans">
            <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider block">
              Collection Type
            </span>
            <div className="mt-1">
              <CollectionTypeBadge type={collection.type} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-sand-300 shadow-xs font-sans">
            <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider block">
              Curated Artworks
            </span>
            <div className="mt-1 font-mono text-lg font-bold text-charcoal-900">
              {productsData?.total ?? collection.productCount ?? 0}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-sand-300 shadow-xs font-sans">
            <span className="text-xs font-medium text-charcoal-500 uppercase tracking-wider block">
              Sort Position
            </span>
            <div className="mt-1 font-mono text-lg font-bold text-charcoal-900">
              #{collection.sortOrder ?? 0}
            </div>
          </div>
        </div>

        {/* Main Tabs Card */}
        <div className="bg-white rounded-xl border border-sand-300 shadow-xs overflow-hidden">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="p-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 max-w-4xl font-sans">
                {/* Visual Banner Preview */}
                {(collection.bannerImage || collection.image) && (
                  <div>
                    <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">
                      Hero Banner & Header
                    </h4>
                    <div className="relative aspect-[16/6] w-full rounded-xl overflow-hidden border border-sand-300 bg-charcoal-950">
                      <img
                        src={collection.bannerImage || collection.image || ''}
                        alt={collection.name}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                        {collection.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-gold-400 text-xs font-serif uppercase tracking-widest mb-1">
                            <Sparkles className="w-3.5 h-3.5" /> Featured Collection
                          </span>
                        )}
                        <h2 className="text-2xl sm:text-3xl font-serif text-sand-50 font-medium">
                          {collection.heroTitle || collection.name}
                        </h2>
                        {(collection.heroDescription || collection.shortDescription) && (
                          <p className="text-xs sm:text-sm text-sand-200 mt-1 max-w-2xl line-clamp-2">
                            {collection.heroDescription || collection.shortDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Narrative Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    {collection.shortDescription && (
                      <div>
                        <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1.5">
                          Short Description (Excerpt)
                        </h4>
                        <p className="text-sm text-charcoal-700 bg-sand-50 p-3 rounded-lg border border-sand-200">
                          {collection.shortDescription}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-1.5">
                        Curatorial Narrative
                      </h4>
                      {collection.description ? (
                        <div className="text-sm text-charcoal-800 leading-relaxed whitespace-pre-line bg-sand-50/50 p-4 rounded-lg border border-sand-200">
                          {collection.description}
                        </div>
                      ) : (
                        <p className="text-xs italic text-charcoal-400">
                          No extended narrative provided.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Sidebar Card */}
                  <div className="p-4 bg-sand-50/70 rounded-xl border border-sand-200 space-y-4 text-xs">
                    <h4 className="font-semibold text-charcoal-900 uppercase tracking-wider text-[11px] pb-2 border-b border-sand-200">
                      Collection Metadata
                    </h4>

                    <div>
                      <span className="text-charcoal-500 block">Identifier ID</span>
                      <span className="font-mono text-charcoal-800 break-all select-all font-semibold">
                        {collection.id}
                      </span>
                    </div>

                    <div>
                      <span className="text-charcoal-500 block">Storefront URL</span>
                      <a
                        href={`https://lagoreearts.com/collections/${collection.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-700 hover:underline flex items-center gap-1 font-mono break-all mt-0.5"
                      >
                        /collections/{collection.slug}
                        <ExternalLink className="w-3 h-3 inline flex-shrink-0" />
                      </a>
                    </div>

                    <div>
                      <span className="text-charcoal-500 block">Created At</span>
                      <span className="text-charcoal-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-charcoal-400" />
                        {new Date(collection.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-charcoal-500 block">Last Modified</span>
                      <span className="text-charcoal-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-charcoal-400" />
                        {new Date(collection.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PRODUCTS */}
            {activeTab === 'products' && (
              <CollectionProductManager
                collectionId={collection.id}
                collectionName={collection.name}
              />
            )}

            {/* TAB 3: MEDIA */}
            {activeTab === 'media' && (
              <CollectionMediaManager
                collectionId={collection.id}
                coverImage={collection.image || ''}
                bannerImage={collection.bannerImage || ''}
              />
            )}

            {/* TAB 4: SEO */}
            {activeTab === 'seo' && (
              <div className="space-y-6 max-w-3xl font-sans">
                {/* SERP Box */}
                <div className="bg-white rounded-lg border border-sand-200 p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-3">
                    Search Engine Result Preview (SERP)
                  </div>
                  <div className="p-4 bg-sand-50 rounded-md border border-sand-200">
                    <div className="text-xs text-[#202124] flex items-center gap-1.5 mb-1 truncate">
                      <Globe className="w-3.5 h-3.5 text-charcoal-500" />
                      <span>
                        {collection.canonicalUrl || `https://lagoreearts.com/collections/${collection.slug}`}
                      </span>
                    </div>
                    <h3 className="text-lg text-[#1a0dab] font-normal leading-snug">
                      {collection.metaTitle || `${collection.name} | Lagoree Arts Luxury Collections`}
                    </h3>
                    <p className="text-xs text-[#4d5156] mt-1 leading-relaxed">
                      {collection.metaDescription ||
                        collection.shortDescription ||
                        'Explore this curated collection of handcrafted sacred artworks and antiquities.'}
                    </p>
                  </div>
                </div>

                {/* Open Graph & Canonical Details */}
                <div className="p-4 bg-sand-50/50 rounded-lg border border-sand-200">
                  <h4 className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-3">
                    Open Graph & Social Sharing Card
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-charcoal-500">OG Title:</dt>
                      <dd className="text-charcoal-800 font-medium">
                        {collection.ogTitle || collection.metaTitle || collection.name}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-charcoal-500">Canonical URL:</dt>
                      <dd className="text-charcoal-800 font-mono">
                        {collection.canonicalUrl || 'Default'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-charcoal-500">OG Description:</dt>
                      <dd className="text-charcoal-800">
                        {collection.ogDescription || collection.metaDescription || 'Default'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* TAB 5: PREVIEW */}
            {activeTab === 'preview' && (
              <CollectionPreview
                collection={collection}
                products={productsData?.products || []}
                productTotal={productsData?.total || 0}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title={`Delete Collection "${collection.name}"?`}
        message="Are you sure you want to delete this collection? Assigned products will NOT be deleted, but they will be detached from this curation."
        confirmLabel="Delete Collection"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </PageContainer>
  );
};
