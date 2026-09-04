import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductPicker } from '../collections/ProductPicker';
import { CollectionPickerModal } from './CollectionPickerModal';
import { ArtistPickerModal } from './ArtistPickerModal';
import { CategoryPickerModal } from './CategoryPickerModal';
import {
  AdminHomepageSection,
  HomepageSectionProduct,
  HomepageSectionCollection,
  HomepageSectionArtist,
  HomepageSectionCategory,
} from '../../lib/api/homepage';
import {
  useSyncSectionProducts,
  useSyncSectionCollections,
  useSyncSectionArtists,
  useSyncSectionCategories,
} from '../../hooks/useHomepage';
import {
  Package,
  FolderArchive,
  User,
  Tags,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface SectionEntityLinkerProps {
  isOpen: boolean;
  onClose: () => void;
  homepageId: string;
  section: AdminHomepageSection | null;
}

type EntityTab = 'products' | 'collections' | 'artists' | 'categories';

export const SectionEntityLinker: React.FC<SectionEntityLinkerProps> = ({
  isOpen,
  onClose,
  homepageId,
  section,
}) => {
  if (!section) return null;

  // Choose default tab based on section type
  const getDefaultTab = (): EntityTab => {
    switch (section.type) {
      case 'FEATURED_COLLECTIONS':
        return 'collections';
      case 'FEATURED_ARTISTS':
        return 'artists';
      case 'CATEGORIES':
        return 'categories';
      case 'FEATURED_PRODUCTS':
      default:
        return 'products';
    }
  };

  const [activeTab, setActiveTab] = useState<EntityTab>(getDefaultTab());

  // Pickers open state
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);
  const [isArtistPickerOpen, setIsArtistPickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  // Mutations
  const syncProductsMutation = useSyncSectionProducts();
  const syncCollectionsMutation = useSyncSectionCollections();
  const syncArtistsMutation = useSyncSectionArtists();
  const syncCategoriesMutation = useSyncSectionCategories();

  // Local assigned states
  const products: HomepageSectionProduct[] = section.products || [];
  const collections: HomepageSectionCollection[] = section.collections || [];
  const artists: HomepageSectionArtist[] = section.artists || [];
  const categories: HomepageSectionCategory[] = section.categories || [];

  // --- Handlers for Products ---
  const handleAddProducts = async (newProductIds: string[]) => {
    const existingIds = products.map((p) => p.productId);
    const combined = [
      ...existingIds,
      ...newProductIds.filter((id) => !existingIds.includes(id)),
    ];
    await syncProductsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      products: combined.map((id, index) => ({ id, displayOrder: index })),
    });
    setIsProductPickerOpen(false);
  };

  const handleRemoveProduct = async (productId: string) => {
    const updated = products
      .filter((p) => p.productId !== productId)
      .map((p, index) => ({ id: p.productId, displayOrder: index }));
    await syncProductsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      products: updated,
    });
  };

  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const list = [...products];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await syncProductsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      products: list.map((p, i) => ({ id: p.productId, displayOrder: i })),
    });
  };

  // --- Handlers for Collections ---
  const handleAddCollections = async (newCollectionIds: string[]) => {
    const existingIds = collections.map((c) => c.collectionId);
    const combined = [
      ...existingIds,
      ...newCollectionIds.filter((id) => !existingIds.includes(id)),
    ];
    await syncCollectionsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      collections: combined.map((id, index) => ({ id, displayOrder: index })),
    });
    setIsCollectionPickerOpen(false);
  };

  const handleRemoveCollection = async (collectionId: string) => {
    const updated = collections
      .filter((c) => c.collectionId !== collectionId)
      .map((c, index) => ({ id: c.collectionId, displayOrder: index }));
    await syncCollectionsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      collections: updated,
    });
  };

  const handleMoveCollection = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= collections.length) return;

    const list = [...collections];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await syncCollectionsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      collections: list.map((c, i) => ({ id: c.collectionId, displayOrder: i })),
    });
  };

  // --- Handlers for Artists ---
  const handleAddArtists = async (newArtistIds: string[]) => {
    const existingIds = artists.map((a) => a.artistId);
    const combined = [
      ...existingIds,
      ...newArtistIds.filter((id) => !existingIds.includes(id)),
    ];
    await syncArtistsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      artists: combined.map((id, index) => ({ id, displayOrder: index })),
    });
    setIsArtistPickerOpen(false);
  };

  const handleRemoveArtist = async (artistId: string) => {
    const updated = artists
      .filter((a) => a.artistId !== artistId)
      .map((a, index) => ({ id: a.artistId, displayOrder: index }));
    await syncArtistsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      artists: updated,
    });
  };

  const handleMoveArtist = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= artists.length) return;

    const list = [...artists];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await syncArtistsMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      artists: list.map((a, i) => ({ id: a.artistId, displayOrder: i })),
    });
  };

  // --- Handlers for Categories ---
  const handleAddCategories = async (newCategoryIds: string[]) => {
    const existingIds = categories.map((c) => c.categoryId);
    const combined = [
      ...existingIds,
      ...newCategoryIds.filter((id) => !existingIds.includes(id)),
    ];
    await syncCategoriesMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      categories: combined.map((id, index) => ({ id, displayOrder: index })),
    });
    setIsCategoryPickerOpen(false);
  };

  const handleRemoveCategory = async (categoryId: string) => {
    const updated = categories
      .filter((c) => c.categoryId !== categoryId)
      .map((c, index) => ({ id: c.categoryId, displayOrder: index }));
    await syncCategoriesMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      categories: updated,
    });
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const list = [...categories];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    await syncCategoriesMutation.mutateAsync({
      homepageId,
      sectionId: section.id,
      categories: list.map((c, i) => ({ id: c.categoryId, displayOrder: i })),
    });
  };

  const isAnyLoading =
    syncProductsMutation.isPending ||
    syncCollectionsMutation.isPending ||
    syncArtistsMutation.isPending ||
    syncCategoriesMutation.isPending;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Linked Entities — ${section.title || section.type}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-gold-600 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Package className="w-4 h-4" />
              Products ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('collections')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'collections'
                  ? 'border-gold-600 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              Collections ({collections.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('artists')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'artists'
                  ? 'border-gold-600 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <User className="w-4 h-4" />
              Artists ({artists.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-gold-600 text-gold-600 dark:text-gold-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Tags className="w-4 h-4" />
              Categories ({categories.length})
            </button>
          </div>

          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  Manage products featured in this section.
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsProductPickerOpen(true)}
                  disabled={isAnyLoading}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Products
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                  No products linked to this section.
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-200 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                  {products.map((p, idx) => (
                    <div
                      key={p.productId}
                      className="p-3 flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-neutral-400 w-5">
                          {idx + 1}.
                        </span>
                        {p.product?.thumbnailUrl ? (
                          <img
                            src={p.product.thumbnailUrl}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Package className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {p.product?.title || `Product (${p.productId.slice(0, 8)}...)`}
                          </p>
                          {p.product?.sku && (
                            <p className="text-xs text-neutral-400 font-mono">
                              SKU: {p.product.sku}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(idx, 'up')}
                          disabled={idx === 0 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProduct(idx, 'down')}
                          disabled={idx === products.length - 1 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.productId)}
                          disabled={isAnyLoading}
                          className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collections Tab Content */}
          {activeTab === 'collections' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  Manage collections featured in this section.
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsCollectionPickerOpen(true)}
                  disabled={isAnyLoading}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Collections
                </Button>
              </div>

              {collections.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                  No collections linked to this section.
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-200 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                  {collections.map((c, idx) => (
                    <div
                      key={c.collectionId}
                      className="p-3 flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-neutral-400 w-5">
                          {idx + 1}.
                        </span>
                        {c.collection?.imageUrl ? (
                          <img
                            src={c.collection.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <FolderArchive className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {c.collection?.title || `Collection (${c.collectionId.slice(0, 8)}...)`}
                          </p>
                          {c.collection?.slug && (
                            <p className="text-xs text-neutral-400 font-mono">
                              /{c.collection.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCollection(idx, 'up')}
                          disabled={idx === 0 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCollection(idx, 'down')}
                          disabled={idx === collections.length - 1 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCollection(c.collectionId)}
                          disabled={isAnyLoading}
                          className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Artists Tab Content */}
          {activeTab === 'artists' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  Manage artists featured in this section.
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsArtistPickerOpen(true)}
                  disabled={isAnyLoading}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Artists
                </Button>
              </div>

              {artists.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                  No artists linked to this section.
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-200 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                  {artists.map((a, idx) => (
                    <div
                      key={a.artistId}
                      className="p-3 flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-neutral-400 w-5">
                          {idx + 1}.
                        </span>
                        {a.artist?.avatarUrl ? (
                          <img
                            src={a.artist.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <User className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {a.artist?.name || `Artist (${a.artistId.slice(0, 8)}...)`}
                          </p>
                          {a.artist?.origin && (
                            <p className="text-xs text-neutral-400">
                              {a.artist.origin}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveArtist(idx, 'up')}
                          disabled={idx === 0 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveArtist(idx, 'down')}
                          disabled={idx === artists.length - 1 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveArtist(a.artistId)}
                          disabled={isAnyLoading}
                          className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Categories Tab Content */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  Manage categories featured in this section.
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsCategoryPickerOpen(true)}
                  disabled={isAnyLoading}
                  className="gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Categories
                </Button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-sm border border-dashed rounded-lg">
                  No categories linked to this section.
                </div>
              ) : (
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-md divide-y divide-neutral-200 dark:divide-neutral-800 max-h-80 overflow-y-auto">
                  {categories.map((c, idx) => (
                    <div
                      key={c.categoryId}
                      className="p-3 flex items-center justify-between text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-neutral-400 w-5">
                          {idx + 1}.
                        </span>
                        <div className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Tags className="w-4 h-4 text-neutral-400" />
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {c.category?.name || `Category (${c.categoryId.slice(0, 8)}...)`}
                          </p>
                          {c.category?.slug && (
                            <p className="text-xs text-neutral-400 font-mono">
                              /{c.category.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'up')}
                          disabled={idx === 0 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCategory(idx, 'down')}
                          disabled={idx === categories.length - 1 || isAnyLoading}
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30 rounded text-neutral-600 dark:text-neutral-300"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(c.categoryId)}
                          disabled={isAnyLoading}
                          className="p-1 hover:bg-red-50 text-red-500 rounded ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </Modal>

      {/* Pickers */}
      <ProductPicker
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        onSelectProducts={handleAddProducts}
        alreadyAssignedProductIds={products.map((p) => p.productId)}
      />

      <CollectionPickerModal
        isOpen={isCollectionPickerOpen}
        onClose={() => setIsCollectionPickerOpen(false)}
        onSelectCollections={handleAddCollections}
        alreadyAssignedIds={collections.map((c) => c.collectionId)}
      />

      <ArtistPickerModal
        isOpen={isArtistPickerOpen}
        onClose={() => setIsArtistPickerOpen(false)}
        onSelectArtists={handleAddArtists}
        alreadyAssignedIds={artists.map((a) => a.artistId)}
      />

      <CategoryPickerModal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        onSelectCategories={handleAddCategories}
        alreadyAssignedIds={categories.map((c) => c.categoryId)}
      />
    </>
  );
};
