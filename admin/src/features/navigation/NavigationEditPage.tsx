import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Switch } from '../../components/ui/Switch';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { NavigationItemCard } from '../../components/navigation/NavigationItemCard';
import { NavigationItemEditorModal } from '../../components/navigation/NavigationItemEditorModal';
import {
  useNavigationDetail,
  useUpdateNavigation,
  useNavigationItems,
  useCreateNavigationItem,
  useUpdateNavigationItem,
  useDeleteNavigationItem,
  useReorderNavigationItems,
} from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import {
  AdminNavigationItem,
  NavigationLocation,
  NavigationStatus,
  NavigationItemTargetType,
  NavigationItemDisplayType,
  navigationLocations,
  buildNavigationTree,
} from '../../lib/api/navigation';
import {
  Plus,
  Save,
  Settings,
  Star,
  LayoutList,
  FolderTree,
} from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface ItemFormData {
  label: string;
  description: string;
  targetType: NavigationItemTargetType;
  displayType: NavigationItemDisplayType;
  url: string;
  targetId: string;
  openInNewTab: boolean;
  isVisible: boolean;
  isFeatured: boolean;
}

export const NavigationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('navigation.update');

  const { data: navigation, isLoading, isError, error, refetch } = useNavigationDetail(id || '');
  const { data: items = [] } = useNavigationItems(id || '');

  const updateNavigationMutation = useUpdateNavigation();
  const createItemMutation = useCreateNavigationItem();
  const updateItemMutation = useUpdateNavigationItem();
  const deleteItemMutation = useDeleteNavigationItem();
  const reorderMutation = useReorderNavigationItems();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState<NavigationLocation>('HEADER');
  const [status, setStatus] = useState<NavigationStatus>('ACTIVE');
  const [isDefault, setIsDefault] = useState(false);
  const [isMetaDirty, setIsMetaDirty] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminNavigationItem | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AdminNavigationItem | null>(null);

  useEffect(() => {
    if (navigation) {
      setName(navigation.name || '');
      setSlug(navigation.slug || '');
      setLocation(navigation.location);
      setStatus(navigation.status);
      setIsDefault(navigation.isDefault);
      setIsMetaDirty(false);
    }
  }, [navigation]);

  const tree = useMemo(() => buildNavigationTree(items), [items]);

  const toggleExpand = (itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await updateNavigationMutation.mutateAsync({
      id,
      payload: {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        location,
        status,
        isDefault,
      },
    });
    setIsMetaDirty(false);
  };

  const handleAddRootItem = () => {
    setEditingItem(null);
    setAddingChildTo(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: AdminNavigationItem) => {
    setEditingItem(item);
    setAddingChildTo(null);
    setIsItemModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    setEditingItem(null);
    setAddingChildTo(parentId);
    setIsItemModalOpen(true);
  };

  const handleSubmitItem = async (data: ItemFormData) => {
    if (!id) return;

    const payload: any = {
      label: data.label.trim(),
      description: data.description.trim() || undefined,
      targetType: data.targetType,
      displayType: data.displayType,
      openInNewTab: data.openInNewTab,
      isVisible: data.isVisible,
      isFeatured: data.isFeatured,
    };

    if (data.targetType === 'INTERNAL_URL' || data.targetType === 'EXTERNAL_URL') {
      payload.url = data.url.trim() || undefined;
    }

    if (['CATEGORY', 'COLLECTION', 'PRODUCT', 'ARTIST', 'JOURNAL', 'LOOKBOOK', 'SANSKRIT_EDIT'].includes(data.targetType)) {
      payload.targetId = data.targetId || undefined;
    }

    if (editingItem) {
      await updateItemMutation.mutateAsync({
        navigationId: id,
        itemId: editingItem.id,
        payload,
      });
    } else {
      const siblingCount = addingChildTo
        ? items.filter((i) => i.parentId === addingChildTo).length
        : items.filter((i) => !i.parentId).length;

      payload.parentId = addingChildTo || null;
      payload.sortOrder = siblingCount;

      await createItemMutation.mutateAsync({
        navigationId: id,
        payload,
      });
    }

    setIsItemModalOpen(false);
    setEditingItem(null);
    setAddingChildTo(null);
  };

  const handleDeleteItem = async () => {
    if (!id || !itemToDelete) return;
    await deleteItemMutation.mutateAsync({
      navigationId: id,
      itemId: itemToDelete.id,
    });
    setItemToDelete(null);
  };

  const handleMoveItem = async (item: AdminNavigationItem, direction: 'up' | 'down') => {
    if (!id) return;

    const siblings = items
      .filter((i) => i.parentId === (item.parentId || null))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = siblings.findIndex((s) => s.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const reordered = [...siblings];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    await reorderMutation.mutateAsync({
      navigationId: id,
      items: reordered.map((s, i) => ({
        id: s.id,
        parentId: s.parentId || undefined,
        sortOrder: i,
      })),
    });
  };

  const renderTree = (nodes: AdminNavigationItem[], depth = 0): React.ReactNode[] => {
    return nodes.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedIds.has(item.id);

      return (
        <React.Fragment key={item.id}>
          <NavigationItemCard
            item={item}
            depth={depth}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
            onEdit={handleEditItem}
            onDelete={(i) => setItemToDelete(i)}
            onAddChild={handleAddChild}
            totalSiblings={nodes.length}
            onMoveUp={() => handleMoveItem(item, 'up')}
            onMoveDown={() => handleMoveItem(item, 'down')}
          />
          {hasChildren && isExpanded && (
            <div>
              {renderTree(item.children!, depth + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  if (isLoading || !id) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !navigation) {
    return (
      <PageContainer>
        <ErrorState
          title="Navigation not found"
          message={(error as Error)?.message || 'Unable to load navigation.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Edit: ${navigation.name}`}
        description="Manage navigation items, menu structure, and item properties."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Navigation', path: '/admin/navigation' },
          { label: navigation.name },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={navigation.status === 'ACTIVE' ? 'success' : 'danger'}
            size="sm"
          >
            {navigation.status}
          </Badge>

          {navigation.isDefault && (
            <Badge variant="champagne" size="sm" className="gap-1">
              <Star className="w-3 h-3 fill-current" />
              Default
            </Badge>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left: Tree Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-gold-600" />
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Menu Items ({items.length})
              </h2>
            </div>

            {canUpdate && (
              <Button onClick={handleAddRootItem} className="gap-2" size="sm">
                <Plus className="w-4 h-4" />
                Add Root Item
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-neutral-50/50 dark:bg-neutral-900/30">
              <LayoutList className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                No menu items yet
              </p>
              <p className="text-xs text-neutral-500 mb-4">
                Add your first navigation link or group to start building the menu.
              </p>
              {canUpdate && (
                <Button onClick={handleAddRootItem} size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {renderTree(tree)}
            </div>
          )}
        </div>

        {/* Right: Metadata Editor */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gold-600" />
              Navigation Details
            </h3>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsMetaDirty(true);
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsMetaDirty(true);
                  }}
                  placeholder={name ? slugify(name) : 'auto-generated'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Location
                </label>
                <Select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value as NavigationLocation);
                    setIsMetaDirty(true);
                  }}
                  options={navigationLocations.map((l) => ({ value: l.value, label: l.label }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Status
                </label>
                <Select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as NavigationStatus);
                    setIsMetaDirty(true);
                  }}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                />
              </div>

              <Switch
                id="is-default"
                label="Default Navigation"
                description="Make this the default for its location"
                checked={isDefault}
                onChange={(val) => {
                  setIsDefault(val);
                  setIsMetaDirty(true);
                }}
              />

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canUpdate || !isMetaDirty || updateNavigationMutation.isPending}
                  className="gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {updateNavigationMutation.isPending ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5 space-y-3 border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Quick Stats
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal-500">Total items</dt>
                <dd className="font-medium text-charcoal-900">{items.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal-500">Visible items</dt>
                <dd className="font-medium text-charcoal-900">
                  {items.filter((i) => i.isVisible).length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal-500">Featured items</dt>
                <dd className="font-medium text-charcoal-900">
                  {items.filter((i) => i.isFeatured).length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-charcoal-500">Root items</dt>
                <dd className="font-medium text-charcoal-900">
                  {items.filter((i) => !i.parentId).length}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Item Editor Modal */}
      <NavigationItemEditorModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
          setAddingChildTo(null);
        }}
        navigationId={id}
        item={editingItem || undefined}
        parentId={addingChildTo}
        onSubmit={handleSubmitItem}
        isLoading={createItemMutation.isPending || updateItemMutation.isPending}
      />

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Delete Menu Item"
        message={
          <span>
            Are you sure you want to delete <strong>"{itemToDelete?.label}"</strong>?
            {itemToDelete?.children && itemToDelete.children.length > 0 && (
              <span className="text-amber-600 block mt-1">
                This item has {itemToDelete.children.length} child items that will also be deleted.
              </span>
            )}
          </span>
        }
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={deleteItemMutation.isPending}
      />
    </PageContainer>
  );
};
