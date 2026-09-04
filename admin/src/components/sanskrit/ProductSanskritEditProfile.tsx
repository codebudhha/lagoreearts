import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Spinner } from '../feedback/Spinner';
import { SanskritPublishingBadge } from './SanskritPublishingBadge';
import { SanskritTextCard } from './SanskritTextCard';
import { SanskritEditForm } from './SanskritEditForm';
import {
  useSanskritEditProfile,
  useCreateSanskritEditProfile,
  useUpdateSanskritEditProfile,
  useDeleteSanskritEditProfile,
} from '../../hooks/useSanskritEdit';
import { BookOpen, Edit2, Trash2, Plus } from 'lucide-react';

interface ProductSanskritEditProfileProps {
  productId: string;
  disabled?: boolean;
}

export const ProductSanskritEditProfile: React.FC<ProductSanskritEditProfileProps> = ({
  productId,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: profile, isLoading, refetch } = useSanskritEditProfile(productId);
  const createMutation = useCreateSanskritEditProfile();
  const updateMutation = useUpdateSanskritEditProfile();
  const deleteMutation = useDeleteSanskritEditProfile();

  const handleSave = async (data: any) => {
    if (profile) {
      await updateMutation.mutateAsync({ productId, payload: data });
    } else {
      await createMutation.mutateAsync({ productId, payload: data });
    }
    setIsEditing(false);
    refetch();
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(productId);
    setShowDeleteModal(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-sand-200 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans">
            {profile ? 'Edit The Sanskrit Edit Entry' : 'Create The Sanskrit Edit Entry'}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Back to Summary
          </Button>
        </div>

        <SanskritEditForm
          productId={productId}
          initialData={profile}
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
          isLoading={createMutation.isPending || updateMutation.isPending}
          disabled={disabled}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-sand-200 rounded-xl bg-sand-50/50 space-y-4 p-6">
        <div className="w-12 h-12 rounded-full bg-champagne-100 text-champagne-700 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 font-sans">
            No Sanskrit Edit Entry Attached
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Enrich this masterwork with authentic Sanskrit calligraphy, Devanagari verse interpretations, scriptural lineage, and curated editorial commentary.
          </p>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsEditing(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Sanskrit Edit Entry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-sand-200 pb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-champagne-600" />
            The Sanskrit Edit — Scriptural & Calligraphic Profile
          </h3>
          <SanskritPublishingBadge
            isPublished={profile.isPublished}
            isFeatured={profile.isFeatured}
          />
        </div>

        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Sanskrit Profile
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Remove
            </Button>
          </div>
        )}
      </div>

      {/* Sanskrit Text Presentation */}
      <SanskritTextCard profile={profile} />

      {/* Editorial Content Card if available */}
      {profile.editorialContent && (
        <Card className="p-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans border-b border-sand-200 pb-2">
            Editorial Commentary & Essay
          </h4>
          <div className="text-sm font-serif text-charcoal-800 leading-relaxed whitespace-pre-line">
            {profile.editorialContent}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Sanskrit Edit Entry"
        message="Are you sure you want to remove the Sanskrit Edit profile from this product? The underlying catalog product will not be deleted."
        confirmLabel="Remove Entry"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
