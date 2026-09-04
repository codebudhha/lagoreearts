import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { Spinner } from '../feedback/Spinner';
import { AuthenticityBadge } from './AuthenticityBadge';
import { ConditionBadge } from './ConditionBadge';
import { AntiqueProfileForm } from './AntiqueProfileForm';
import {
  useAntiqueProfile,
  useCreateAntiqueProfile,
  useUpdateAntiqueProfile,
  useDeleteAntiqueProfile,
} from '../../hooks/useAntiques';
import {
  Hourglass,
  Ruler,
  Edit2,
  Trash2,
  Plus,
  FileCheck,
} from 'lucide-react';

interface ProductAntiqueProfileProps {
  productId: string;
  productStock?: number;
  productAllowBackorder?: boolean;
  disabled?: boolean;
}

export const ProductAntiqueProfile: React.FC<ProductAntiqueProfileProps> = ({
  productId,
  productStock = 1,
  productAllowBackorder = false,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: profile, isLoading, refetch } = useAntiqueProfile(productId);
  const createMutation = useCreateAntiqueProfile();
  const updateMutation = useUpdateAntiqueProfile();
  const deleteMutation = useDeleteAntiqueProfile();

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
            {profile ? 'Edit Antique & Collectible Profile' : 'Create Antique & Collectible Profile'}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Back to Summary
          </Button>
        </div>

        <AntiqueProfileForm
          productId={productId}
          initialData={profile}
          productStock={productStock}
          productAllowBackorder={productAllowBackorder}
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
          <Hourglass className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 font-sans">
            No Antique Profile Attached
          </h3>
          <p className="text-xs text-charcoal-500 font-sans">
            Designate this product as a historical antiquity or rare collectible to record provenance, authenticity certificates, age, and dimensional specs.
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
            Create Antique Profile
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
            <Hourglass className="w-4 h-4 text-champagne-600" />
            Antique & Collectible Specifications
          </h3>
          <AuthenticityBadge
            status={profile.authenticityStatus}
            isCertified={profile.isCertified}
          />
          {profile.isOneOfAKind && (
            <Badge variant="champagne" size="sm">
              One-of-a-Kind
            </Badge>
          )}
        </div>

        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              Edit Profile
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Remove Profile
            </Button>
          </div>
        )}
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Era & Condition */}
        <Card className="p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans border-b border-sand-200 pb-2 flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 text-champagne-600" />
            Era & Provenance
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-charcoal-500 block">Era / Period</span>
              <span className="font-semibold text-charcoal-900 font-serif">
                {profile.era || '—'} {profile.period ? `(${profile.period})` : ''}
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 block">Origin Region</span>
              <span className="font-medium text-charcoal-800">
                {profile.origin || profile.countryOfOrigin || '—'}
              </span>
            </div>

            <div>
              <span className="text-charcoal-500 block">Condition</span>
              <ConditionBadge condition={profile.condition} className="mt-0.5" />
            </div>

            {profile.conditionNotes && (
              <div>
                <span className="text-charcoal-500 block">Condition Notes</span>
                <p className="text-charcoal-700 italic mt-0.5">{profile.conditionNotes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Card 2: Physical Specifications */}
        <Card className="p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans border-b border-sand-200 pb-2 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-champagne-600" />
            Physical Specifications
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-charcoal-500 block">Dimensions</span>
              <span className="font-semibold text-charcoal-900 font-mono">
                {profile.height ? `${profile.height}H ` : ''}
                {profile.width ? `× ${profile.width}W ` : ''}
                {profile.depth ? `× ${profile.depth}D ` : ''}
                {profile.diameter ? `(Ø ${profile.diameter}) ` : ''}
                {profile.dimensionUnit}
              </span>
            </div>

            {profile.weight && (
              <div>
                <span className="text-charcoal-500 block">Weight</span>
                <span className="font-semibold text-charcoal-900 font-mono">
                  {profile.weight} {profile.weightUnit}
                </span>
              </div>
            )}

            <div>
              <span className="text-charcoal-500 block">Material & Technique</span>
              <span className="font-medium text-charcoal-800">
                {profile.material || '—'}
                {profile.technique ? ` • ${profile.technique}` : ''}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 3: Certificate & Lineage */}
        <Card className="p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 font-sans border-b border-sand-200 pb-2 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-champagne-600" />
            Authentication & Records
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-charcoal-500 block">Certificate</span>
              {profile.isCertified ? (
                <div className="font-semibold text-emerald-800">
                  #{profile.certificateNumber || 'Certified'}
                  {profile.certificateIssuer && (
                    <span className="text-charcoal-500 font-normal block">
                      Issued by: {profile.certificateIssuer}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-charcoal-400 italic">No certificate issued</span>
              )}
            </div>

            {profile.provenance && (
              <div>
                <span className="text-charcoal-500 block">Provenance</span>
                <p className="text-charcoal-700 font-serif line-clamp-3 mt-0.5">
                  {profile.provenance}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Remove Antique Profile"
        message="Are you sure you want to remove the antique profile from this product? The underlying catalog product will not be affected."
        confirmLabel="Remove Profile"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
