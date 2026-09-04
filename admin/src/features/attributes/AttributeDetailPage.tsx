import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { AttributeTypeBadge } from '../../components/attributes/AttributeTypeBadge';
import { AttributeValueManager } from '../../components/attributes/AttributeValueManager';
import { ConfirmDialog } from '../../components/feedback/ConfirmDialog';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useAuth } from '../../hooks/useAuth';
import {
  useAttributeDetail,
  useDeleteAttribute,
} from '../../hooks/useAttributes';
import {
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react';

export const AttributeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canUpdate = hasPermission('attribute.update');
  const canDelete = hasPermission('attribute.delete');

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: attribute,
    isLoading,
    isError,
    error,
    refetch,
  } = useAttributeDetail(id || '');

  const deleteMutation = useDeleteAttribute();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate('/admin/attributes');
    } catch {
      // Handled by toast
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

  if (isError || !attribute) {
    return (
      <PageContainer>
        <ErrorState
          title="Attribute Not Found"
          message={(error as any)?.message || 'The requested attribute does not exist.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={
            <div className="flex items-center space-x-3">
              <span>{attribute.name}</span>
              <AttributeTypeBadge type={attribute.type} size="md" />
              <StatusBadge status={attribute.status} size="md" />
              {attribute.isSystem && (
                <Badge variant="warning" size="md">
                  <Lock className="w-3.5 h-3.5 mr-1 inline" />
                  System Protected
                </Badge>
              )}
            </div>
          }
          description={`Slug: /${attribute.slug} • Type: ${attribute.type}`}
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Attributes', path: '/admin/attributes' },
            { label: attribute.name },
          ]}
        >
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/attributes')}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </Button>
            {canUpdate && (
              <Link to={`/admin/attributes/${attribute.id}/edit`}>
                <Button variant="primary" size="sm" className="flex items-center space-x-1">
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Attribute</span>
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={attribute.isSystem}
                className="flex items-center space-x-1"
                title={
                  attribute.isSystem
                    ? 'System attributes cannot be deleted'
                    : 'Delete Attribute'
                }
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </PageHeader>

        {/* System Protection Alert */}
        {attribute.isSystem && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 font-sans">
              <span className="font-semibold block mb-0.5 font-serif text-sm">
                Protected System Attribute
              </span>
              This attribute is a core system dimension required for storefront operations. It cannot be deleted, and its data type cannot be altered.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Description and Option Values Manager */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-2">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Curator Description & Guidelines
              </h3>
              <p className="text-sm text-charcoal-700 font-serif leading-relaxed">
                {attribute.description || 'No specific description provided for this attribute.'}
              </p>
            </div>

            {/* Values Manager */}
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm">
              <AttributeValueManager attribute={attribute} readOnly={!canUpdate} />
            </div>
          </div>

          {/* Right 1 Col: Specifications & Timestamps */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-4">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                Configuration & Rules
              </h3>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600 font-semibold uppercase">Data Type:</span>
                  <AttributeTypeBadge type={attribute.type} size="sm" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600 font-semibold uppercase">Storefront Facet:</span>
                  <span className="font-serif font-medium text-charcoal-900 flex items-center">
                    {attribute.isFilterable ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        Filterable
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-charcoal-400 mr-1" />
                        Hidden from Filters
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600 font-semibold uppercase">Mandatory Input:</span>
                  <span className="font-serif font-medium text-charcoal-900">
                    {attribute.isRequired ? 'Required' : 'Optional'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal-600 font-semibold uppercase">Sort Order:</span>
                  <span className="font-mono text-charcoal-800">{attribute.sortOrder ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white p-6 rounded-lg border border-sand-200 shadow-sm space-y-3 text-xs text-charcoal-600 font-sans">
              <h3 className="text-sm font-serif font-semibold text-charcoal-900 border-b border-sand-200 pb-2">
                System Timestamps
              </h3>
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <span className="font-mono text-charcoal-800">
                  {attribute.createdAt ? new Date(attribute.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-charcoal-800">
                  {attribute.updatedAt ? new Date(attribute.updatedAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Attribute"
        message={`Are you sure you want to delete "${attribute.name}"? Attributes that are actively used or assigned to categories cannot be deleted.`}
        confirmLabel="Delete Attribute"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  );
};
