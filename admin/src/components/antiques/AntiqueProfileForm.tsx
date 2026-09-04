import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  CreateAntiqueProfilePayload,
  UpdateAntiqueProfilePayload,
  AntiqueProfile,
  AntiqueCondition,
  AntiqueRestorationStatus,
  AntiqueAuthenticityStatus,
  DimensionUnit,
  WeightUnit,
} from '../../lib/api/antiques';
import {
  ShieldCheck,
  Hourglass,
  Scale,
  Ruler,
  FileCheck,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';

interface AntiqueProfileFormProps {
  productId: string;
  initialData?: AntiqueProfile | null;
  productStock?: number;
  productAllowBackorder?: boolean;
  onSubmit: (data: CreateAntiqueProfilePayload | UpdateAntiqueProfilePayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const CONDITION_OPTIONS: { value: AntiqueCondition; label: string }[] = [
  { value: 'EXCELLENT', label: 'Excellent — Museum Grade' },
  { value: 'VERY_GOOD', label: 'Very Good — Minor Natural Patina' },
  { value: 'GOOD', label: 'Good — Consistent Age Wear' },
  { value: 'FAIR', label: 'Fair — Visible Ageing' },
  { value: 'POOR', label: 'Poor — Significant Degradation' },
  { value: 'RESTORED', label: 'Restored — Expertly Conserved' },
  { value: 'FOR_RESTORATION', label: 'For Restoration — Raw Discovery' },
];

const RESTORATION_OPTIONS: { value: AntiqueRestorationStatus; label: string }[] = [
  { value: 'ORIGINAL', label: 'Original — Untouched State' },
  { value: 'PARTIALLY_RESTORED', label: 'Partially Restored' },
  { value: 'FULLY_RESTORED', label: 'Fully Restored' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

const AUTHENTICITY_OPTIONS: { value: AntiqueAuthenticityStatus; label: string }[] = [
  { value: 'VERIFIED', label: 'Verified Authentic' },
  { value: 'UNVERIFIED', label: 'Unverified / Pending Authentication' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

const DIMENSION_UNITS: { value: DimensionUnit; label: string }[] = [
  { value: 'CM', label: 'Centimeters (cm)' },
  { value: 'MM', label: 'Millimeters (mm)' },
  { value: 'IN', label: 'Inches (in)' },
  { value: 'FT', label: 'Feet (ft)' },
  { value: 'M', label: 'Meters (m)' },
];

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'KG', label: 'Kilograms (kg)' },
  { value: 'G', label: 'Grams (g)' },
  { value: 'LB', label: 'Pounds (lb)' },
  { value: 'OZ', label: 'Ounces (oz)' },
];

export const AntiqueProfileForm: React.FC<AntiqueProfileFormProps> = ({
  initialData,
  productStock = 1,
  productAllowBackorder = false,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'authenticity' | 'lineage' | 'physical' | 'provenance'>('authenticity');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<CreateAntiqueProfilePayload>({
    defaultValues: {
      era: initialData?.era || '',
      period: initialData?.period || '',
      approximateAgeFrom: initialData?.approximateAgeFrom || undefined,
      approximateAgeTo: initialData?.approximateAgeTo || undefined,
      ageDescription: initialData?.ageDescription || '',
      origin: initialData?.origin || '',
      region: initialData?.region || '',
      countryOfOrigin: initialData?.countryOfOrigin || '',
      artistMaker: initialData?.artistMaker || '',
      attribution: initialData?.attribution || '',
      schoolOrTradition: initialData?.schoolOrTradition || '',
      material: initialData?.material || '',
      technique: initialData?.technique || '',
      condition: initialData?.condition || 'VERY_GOOD',
      conditionNotes: initialData?.conditionNotes || '',
      restorationStatus: initialData?.restorationStatus || 'ORIGINAL',
      restorationNotes: initialData?.restorationNotes || '',
      provenance: initialData?.provenance || '',
      provenanceNotes: initialData?.provenanceNotes || '',
      authenticityStatus: initialData?.authenticityStatus || 'VERIFIED',
      authenticityNotes: initialData?.authenticityNotes || '',
      acquisitionSource: initialData?.acquisitionSource || '',
      acquisitionNotes: initialData?.acquisitionNotes || '',
      dimensionsDescription: initialData?.dimensionsDescription || '',
      height: initialData?.height || undefined,
      width: initialData?.width || undefined,
      depth: initialData?.depth || undefined,
      diameter: initialData?.diameter || undefined,
      dimensionUnit: initialData?.dimensionUnit || 'CM',
      weight: initialData?.weight || undefined,
      weightUnit: initialData?.weightUnit || 'KG',
      isOneOfAKind: initialData?.isOneOfAKind ?? true,
      isCertified: initialData?.isCertified || false,
      certificateNumber: initialData?.certificateNumber || '',
      certificateIssuer: initialData?.certificateIssuer || '',
      certificateDate: initialData?.certificateDate ? String(initialData.certificateDate).split('T')[0] : '',
    },
  });

  const isOneOfAKindVal = watch('isOneOfAKind');
  const isCertifiedVal = watch('isCertified');
  const authenticityVal = watch('authenticityStatus');
  const conditionVal = watch('condition');
  const restorationVal = watch('restorationStatus');
  const dimensionUnitVal = watch('dimensionUnit');
  const weightUnitVal = watch('weightUnit');

  // Invariant check for One-of-a-Kind
  const stockExceedsLimit = Boolean(isOneOfAKindVal && productStock > 1);
  const backorderConflict = Boolean(isOneOfAKindVal && productAllowBackorder);

  const onFormSubmit = async (formData: CreateAntiqueProfilePayload) => {
    const payload: CreateAntiqueProfilePayload = {
      ...formData,
      approximateAgeFrom: formData.approximateAgeFrom ? Number(formData.approximateAgeFrom) : null,
      approximateAgeTo: formData.approximateAgeTo ? Number(formData.approximateAgeTo) : null,
      height: formData.height ? Number(formData.height) : null,
      width: formData.width ? Number(formData.width) : null,
      depth: formData.depth ? Number(formData.depth) : null,
      diameter: formData.diameter ? Number(formData.diameter) : null,
      weight: formData.weight ? Number(formData.weight) : null,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-sand-300 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('authenticity')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'authenticity'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Authenticity & Certification
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lineage')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'lineage'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Hourglass className="w-4 h-4" />
          Era, Lineage & Condition
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('physical')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'physical'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Physical Specifications
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('provenance')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'provenance'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Provenance & Acquisition
        </button>
      </div>

      {/* Warnings / Invariant Alerts */}
      {stockExceedsLimit && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">One-of-a-Kind Inventory Conflict</p>
            <p>
              This product currently has a stock quantity of <strong>{productStock}</strong>. One-of-a-kind antiquities cannot exceed stock quantity of 1. Please adjust product stock to 1 or 0 before finalizing.
            </p>
          </div>
        </div>
      )}

      {backorderConflict && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Backorder Policy Restriction</p>
            <p>
              Backorders are not allowed on unique one-of-a-kind antiquities. Please disable backorders in the product overview tab.
            </p>
          </div>
        </div>
      )}

      {/* Tab 1: Authenticity & Certification */}
      {activeTab === 'authenticity' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Authenticity Classification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Authenticity Status
                </label>
                <Select
                  value={authenticityVal}
                  onChange={(e) => setValue('authenticityStatus', e.target.value as AntiqueAuthenticityStatus, { shouldDirty: true })}
                  options={AUTHENTICITY_OPTIONS}
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center pt-6">
                <Switch
                  checked={Boolean(isOneOfAKindVal)}
                  onChange={(checked) => setValue('isOneOfAKind', checked, { shouldDirty: true })}
                  label="One-of-a-Kind Unique Antiquity"
                  description="Enforces strict 0-1 stock inventory limits"
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Authenticity Research & Scholarly Notes
              </label>
              <Textarea
                {...register('authenticityNotes')}
                rows={3}
                placeholder="Scholarly opinions, thermoluminescence test results, carbon dating, or connoisseurship notes..."
                disabled={disabled}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-sand-200 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans">
                Official Certification of Authenticity
              </h3>
              <Switch
                checked={Boolean(isCertifiedVal)}
                onChange={(checked) => setValue('isCertified', checked, { shouldDirty: true })}
                label="Certified"
                disabled={disabled}
              />
            </div>

            {isCertifiedVal && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                    Certificate Number
                  </label>
                  <Input
                    {...register('certificateNumber')}
                    placeholder="e.g. LAG-COA-2026-089"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                    Certifying Authority / Expert
                  </label>
                  <Input
                    {...register('certificateIssuer')}
                    placeholder="e.g. Archaeological Survey of India / Lagoree Heritage Board"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                    Certificate Date
                  </label>
                  <Input
                    type="date"
                    {...register('certificateDate')}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Era, Lineage & Condition */}
      {activeTab === 'lineage' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Historical Era & Geography
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Historical Era
                </label>
                <Input
                  {...register('era')}
                  placeholder="e.g. Late 18th Century / Victorian Era"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Dynasty / Period
                </label>
                <Input
                  {...register('period')}
                  placeholder="e.g. Maratha Empire / Chola Bronze Age"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Country of Origin
                </label>
                <Input
                  {...register('countryOfOrigin')}
                  placeholder="e.g. India"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Approximate Age From (Years)
                </label>
                <Input
                  type="number"
                  {...register('approximateAgeFrom')}
                  placeholder="e.g. 150"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Approximate Age To (Years)
                </label>
                <Input
                  type="number"
                  {...register('approximateAgeTo')}
                  placeholder="e.g. 200"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Age Description
                </label>
                <Input
                  {...register('ageDescription')}
                  placeholder="e.g. Circa 1780-1820 CE"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Origin / Provenance Region
                </label>
                <Input
                  {...register('origin')}
                  placeholder="e.g. Thanjavur, Tamil Nadu"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  School / Art Tradition
                </label>
                <Input
                  {...register('schoolOrTradition')}
                  placeholder="e.g. Vijayanagara Revivalist Bronze Casting"
                  disabled={disabled}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Material, Technique & Condition Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Primary Material
                </label>
                <Input
                  {...register('material')}
                  placeholder="e.g. Panchaloha (Five-metal alloy) with verdigris patina"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Manufacturing Technique
                </label>
                <Input
                  {...register('technique')}
                  placeholder="e.g. Lost-wax casting (Cire perdue)"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Condition Rating
                </label>
                <Select
                  value={conditionVal || 'VERY_GOOD'}
                  onChange={(e) => setValue('condition', e.target.value as AntiqueCondition, { shouldDirty: true })}
                  options={CONDITION_OPTIONS}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Restoration Status
                </label>
                <Select
                  value={restorationVal || 'ORIGINAL'}
                  onChange={(e) => setValue('restorationStatus', e.target.value as AntiqueRestorationStatus, { shouldDirty: true })}
                  options={RESTORATION_OPTIONS}
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Detailed Condition Notes & Patina Description
              </label>
              <Textarea
                {...register('conditionNotes')}
                rows={3}
                placeholder="Describe oxidization, micro-abrasions, surface stability..."
                disabled={disabled}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Tab 3: Physical Specifications */}
      {activeTab === 'physical' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-champagne-600" />
              Dimensional Measurements
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Height
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('height')}
                  placeholder="e.g. 45.5"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Width
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('width')}
                  placeholder="e.g. 30.0"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Depth
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('depth')}
                  placeholder="e.g. 15.0"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Diameter (Circular)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('diameter')}
                  placeholder="e.g. 22.0"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Dimension Unit
                </label>
                <Select
                  value={dimensionUnitVal}
                  onChange={(e) => setValue('dimensionUnit', e.target.value as DimensionUnit, { shouldDirty: true })}
                  options={DIMENSION_UNITS}
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Dimensions Narrative
              </label>
              <Input
                {...register('dimensionsDescription')}
                placeholder="e.g. 45.5 cm (H) x 30 cm (W) mounted on hand-carved rosewood pedestal"
                disabled={disabled}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2 flex items-center gap-2">
              <Scale className="w-4 h-4 text-champagne-600" />
              Weight & Mass
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Weight Value
                </label>
                <Input
                  type="number"
                  step="0.001"
                  {...register('weight')}
                  placeholder="e.g. 12.8"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Weight Unit
                </label>
                <Select
                  value={weightUnitVal}
                  onChange={(e) => setValue('weightUnit', e.target.value as WeightUnit, { shouldDirty: true })}
                  options={WEIGHT_UNITS}
                  disabled={disabled}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 4: Provenance & Acquisition */}
      {activeTab === 'provenance' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Provenance Lineage & Private Acquisition Records
          </h3>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Public Provenance Summary
            </label>
            <Textarea
              {...register('provenance')}
              rows={3}
              placeholder="Ex-collection Maharaja of Mysore, acquired 1920s; thence by family descent..."
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Internal Acquisition Source (Staff Only)
            </label>
            <Input
              {...register('acquisitionSource')}
              placeholder="e.g. Estate private treaty sale, Mumbai 2024"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Confidential Acquisition Notes (Staff Only)
            </label>
            <Textarea
              {...register('acquisitionNotes')}
              rows={3}
              placeholder="Internal appraisal references, export permits, customs clearances..."
              disabled={disabled}
            />
          </div>
        </Card>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-300">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={disabled || !isDirty || stockExceedsLimit || backorderConflict}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? 'Update Antique Profile' : 'Save Antique Profile'}
        </Button>
      </div>
    </form>
  );
};
