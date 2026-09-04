import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { NavigationItemCard } from '../../components/navigation/NavigationItemCard';
import {
  useNavigationDetail,
  useUpdateNavigation,
  useNavigationItems,
} from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import {
  AdminNavigationItem,
  navigationLocations,
  buildNavigationTree,
} from '../../lib/api/navigation';
import {
  Edit2,
  CheckCircle2,
  XCircle,
  Star,
  Link,
  FolderTree,
} from 'lucide-react';

export const NavigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('navigation.update');

  const { data: navigation, isLoading, isError, error, refetch } = useNavigationDetail(id || '');
  const { data: items = [] } = useNavigationItems(id || '');
  const updateMutation = useUpdateNavigation();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
            onEdit={() => {}}
            onDelete={() => {}}
            onAddChild={() => {}}
            totalSiblings={nodes.length}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
          />
          {hasChildren && isExpanded && (
            <div className="ml-6">
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
          <Skeleton className="h-24 w-full" />
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

  const tree = buildNavigationTree(items);

  return (
    <PageContainer>
      <PageHeader
        title={navigation.name}
        description="Read-only view of this navigation menu structure."
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

          <Badge variant="secondary" size="sm">
            {navigationLocations.find((l) => l.value === navigation.location)?.label || navigation.location}
          </Badge>

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/navigation/${navigation.id}/edit`)}
              className="gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}

          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateMutation.mutate({
                  id: navigation.id,
                  payload: {
                    status: navigation.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  },
                })
              }
              disabled={updateMutation.isPending}
              className="gap-1.5"
            >
              {navigation.status === 'ACTIVE' ? (
                <>
                  <XCircle className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Activate
                </>
              )}
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-gold-600" />
              Menu Items ({items.length})
            </h3>

            {items.length === 0 ? (
              <EmptyState
                icon={<Link className="w-7 h-7 text-charcoal-400" />}
                title="No menu items"
                description="This navigation has no menu items configured."
              />
            ) : (
              <div className="space-y-2">
                {renderTree(tree)}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-charcoal-500 uppercase font-medium">Location</dt>
                <dd className="mt-1 text-charcoal-900">
                  {navigationLocations.find((l) => l.value === navigation.location)?.label || navigation.location}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-charcoal-500 uppercase font-medium">Slug</dt>
                <dd className="mt-1 font-mono text-xs text-charcoal-700">{navigation.slug}</dd>
              </div>
              <div>
                <dt className="text-xs text-charcoal-500 uppercase font-medium">Created</dt>
                <dd className="mt-1 text-charcoal-700">
                  {new Date(navigation.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-charcoal-500 uppercase font-medium">Updated</dt>
                <dd className="mt-1 text-charcoal-700">
                  {new Date(navigation.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};
