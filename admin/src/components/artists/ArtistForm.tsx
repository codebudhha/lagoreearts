import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CreateArtistPayload, UpdateArtistPayload, Artist } from '../../lib/api/artists';
import { Globe, User, BookOpen, Save, X } from 'lucide-react';

const generateSlug = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface ArtistFormProps {
  initialData?: Artist;
  onSubmit: (data: CreateArtistPayload | UpdateArtistPayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ArtistForm: React.FC<ArtistFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'heritage' | 'seo'>('identity');
  const [autoSlug, setAutoSlug] = useState(!initialData?.slug);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateArtistPayload>({
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      shortBio: initialData?.shortBio || '',
      biography: initialData?.biography || '',
      birthYear: initialData?.birthYear || undefined,
      deathYear: initialData?.deathYear || undefined,
      nationality: initialData?.nationality || '',
      origin: initialData?.origin || '',
      tradition: initialData?.tradition || '',
      medium: initialData?.medium || '',
      specialization: initialData?.specialization || '',
      signature: initialData?.signature || '',
      status: initialData?.status || 'ACTIVE',
      isFeatured: initialData?.isFeatured || false,
      sortOrder: initialData?.sortOrder ?? 0,
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || '',
      metaKeywords: initialData?.metaKeywords || '',
      ogImage: initialData?.ogImage || '',
    },
  });

  const nameVal = watch('name');
  const statusVal = watch('status');
  const isFeaturedVal = watch('isFeatured');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val, { shouldDirty: true });
    if (autoSlug) {
      setValue('slug', generateSlug(val), { shouldDirty: true });
    }
  };

  const onFormSubmit = async (formData: CreateArtistPayload) => {
    const payload: CreateArtistPayload = {
      ...formData,
      birthYear: formData.birthYear ? Number(formData.birthYear) : null,
      deathYear: formData.deathYear ? Number(formData.deathYear) : null,
      sortOrder: Number(formData.sortOrder || 0),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-sand-300 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'identity'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <User className="w-4 h-4" />
          Identity & Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heritage')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'heritage'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Heritage & Specialization
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'seo'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO & Social Metadata
        </button>
      </div>

      {/* Tab 1: Identity & Profile */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Primary Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Artist / Maker Name <span className="text-rose-600">*</span>
                </label>
                <Input
                  {...register('name', { required: 'Artist name is required' })}
                  placeholder="e.g. Master Ustad Mansur"
                  onChange={handleNameChange}
                  error={errors.name?.message}
                  disabled={disabled}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                    Slug / URL Identifier
                  </label>
                  <label className="text-[11px] text-charcoal-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSlug}
                      onChange={(e) => setAutoSlug(e.target.checked)}
                      className="rounded border-sand-300 text-gold-600 focus:ring-gold-500"
                    />
                    Auto-generate
                  </label>
                </div>
                <Input
                  {...register('slug')}
                  placeholder="e.g. master-ustad-mansur"
                  disabled={disabled || autoSlug}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Short Bio / Catchphrase
              </label>
              <Input
                {...register('shortBio')}
                placeholder="e.g. 17th-century Mughal court master painter specializing in flora and fauna."
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Full Biography & Lineage
              </label>
              <Textarea
                {...register('biography')}
                rows={5}
                placeholder="Comprehensive historical narrative, master-student lineage, court patronages..."
                disabled={disabled}
              />
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Status & Merchandising
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <Select
                  value={statusVal}
                  onChange={(val) => setValue('status', val as any, { shouldDirty: true })}
                  options={[
                    { value: 'ACTIVE', label: 'Active — Published' },
                    { value: 'INACTIVE', label: 'Inactive — Hidden' },
                  ]}
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Sort Order
                </label>
                <Input
                  type="number"
                  {...register('sortOrder')}
                  placeholder="0"
                  disabled={disabled}
                />
              </div>

              <div className="flex items-center pt-6">
                <Switch
                  checked={Boolean(isFeaturedVal)}
                  onChange={(checked) => setValue('isFeatured', checked, { shouldDirty: true })}
                  label="Featured Artist Showcase"
                  description="Promote on homepage masterworks section"
                  disabled={disabled}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Heritage & Specialization */}
      {activeTab === 'heritage' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Historical Lineage & Practice
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Birth Year
              </label>
              <Input
                type="number"
                {...register('birthYear')}
                placeholder="e.g. 1590"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Death Year
              </label>
              <Input
                type="number"
                {...register('deathYear')}
                placeholder="e.g. 1624"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Nationality
              </label>
              <Input
                {...register('nationality')}
                placeholder="e.g. Indian"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Origin / Atelier Region
              </label>
              <Input
                {...register('origin')}
                placeholder="e.g. Lahore / Agra Imperial Atelier"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Tradition / School
              </label>
              <Input
                {...register('tradition')}
                placeholder="e.g. Mughal Imperial School / Pahari Miniature"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Primary Medium
              </label>
              <Input
                {...register('medium')}
                placeholder="e.g. Opaque watercolor and gold on wasli paper"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Specialization
              </label>
              <Input
                {...register('specialization')}
                placeholder="e.g. Botanical illustration, Court portraits"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Signature / Seal Mark
              </label>
              <Input
                {...register('signature')}
                placeholder="e.g. Signed 'Amal-e Nadir al-Asr' in Persian Nasta'liq"
                disabled={disabled}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: SEO & Social Metadata */}
      {activeTab === 'seo' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Search Engine & Social Discovery
          </h3>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Meta Title
            </label>
            <Input
              {...register('metaTitle')}
              placeholder={nameVal ? `${nameVal} — Master Artisan | Lagoree Arts` : 'Meta Title'}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Meta Description
            </label>
            <Textarea
              {...register('metaDescription')}
              rows={3}
              placeholder="Discover the masterworks and historical lineage of this artisan..."
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Keywords (Comma separated)
            </label>
            <Input
              {...register('metaKeywords')}
              placeholder="e.g. miniature painting, mughal art, heritage artisan"
              disabled={disabled}
            />
          </div>
        </Card>
      )}

      {/* Footer Controls */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-300">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          leftIcon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={disabled || !isDirty}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? 'Update Artist Profile' : 'Create Artist Profile'}
        </Button>
      </div>
    </form>
  );
};
