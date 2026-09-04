import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import {
  HomepageSection,
  HomepageSectionType,
  CreateSectionPayload,
  UpdateSectionPayload,
} from '../../lib/api/homepage';

interface SectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: HomepageSection | null;
  onSubmit: (payload: CreateSectionPayload | UpdateSectionPayload) => Promise<void>;
  isLoading?: boolean;
}

const SECTION_TYPE_OPTIONS: { value: HomepageSectionType; label: string }[] = [
  { value: 'HERO', label: 'Hero Banner' },
  { value: 'FEATURED_PRODUCTS', label: 'Featured Artworks & Products' },
  { value: 'FEATURED_COLLECTIONS', label: 'Curated Collections' },
  { value: 'FEATURED_ARTISTS', label: 'Master Makers & Artists' },
  { value: 'CATEGORIES', label: 'Taxonomy Categories' },
  { value: 'ANTIQUES', label: 'Antiques & Historical Collectibles' },
  { value: 'SANSKRIT_EDIT', label: 'The Sanskrit Edit Spotlight' },
  { value: 'EDITORIAL', label: 'Editorial Story & Narrative' },
  { value: 'IMAGE_BANNER', label: 'Image Banner' },
  { value: 'PROMOTIONAL_BANNER', label: 'Promotional Ribbon / Callout' },
  { value: 'SPACER', label: 'Layout Spacer' },
];

export const SectionEditorModal: React.FC<SectionEditorModalProps> = ({
  isOpen,
  onClose,
  section,
  onSubmit,
  isLoading = false,
}) => {
  const isEditing = Boolean(section);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<any>({
    mode: 'onTouched',
    defaultValues: {
      type: 'HERO',
      title: '',
      subtitle: '',
      eyebrow: '',
      content: '',
      isActive: true,
      config: {},
    },
  });

  const selectedType = watch('type');
  const isActiveVal = watch('isActive');

  useEffect(() => {
    if (section) {
      reset({
        type: section.type,
        title: section.title || '',
        subtitle: section.subtitle || '',
        eyebrow: section.eyebrow || '',
        content: section.content || '',
        isActive: section.isActive,
        config: section.config || {},
      });
    } else {
      reset({
        type: 'HERO',
        title: '',
        subtitle: '',
        eyebrow: '',
        content: '',
        isActive: true,
        config: {
          textAlignment: 'center',
          overlayOpacity: 0.4,
          ctaLabel: 'Explore Collection',
          ctaUrl: '/collections/all',
        },
      });
    }
  }, [section, reset, isOpen]);

  const onFormSubmit = async (formData: any) => {
    await onSubmit({
      type: formData.type,
      title: formData.title || undefined,
      subtitle: formData.subtitle || undefined,
      eyebrow: formData.eyebrow || undefined,
      content: formData.content || undefined,
      isActive: formData.isActive,
      config: formData.config || {},
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Section: ${section?.title || section?.type}` : 'Add New Homepage Section'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Section Type */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
            Section Type <span className="text-rose-600">*</span>
          </label>
          <Select
            value={selectedType}
            onChange={(e) => setValue('type', e.target.value as HomepageSectionType, { shouldDirty: true })}
            options={SECTION_TYPE_OPTIONS}
            disabled={isEditing}
          />
        </div>

        {/* Base Titles & Headings */}
        {selectedType !== 'SPACER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Eyebrow Label
              </label>
              <Input
                {...register('eyebrow')}
                placeholder="e.g. SACRED TRADITIONS, CURATOR'S PICK"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Section Title
              </label>
              <Input
                {...register('title')}
                placeholder="e.g. Masterworks of Tanjore"
              />
            </div>
          </div>
        )}

        {selectedType !== 'SPACER' && (
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Subtitle / Description
            </label>
            <Input
              {...register('subtitle')}
              placeholder="e.g. Handcrafted in 24K gold foil by master artisans"
            />
          </div>
        )}

        {/* Narrative / Long Content */}
        {(selectedType === 'EDITORIAL' || selectedType === 'HERO' || selectedType === 'PROMOTIONAL_BANNER') && (
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Body Content / Narrative
            </label>
            <Textarea
              {...register('content')}
              rows={3}
              placeholder="Enter supporting commentary or promotional announcement..."
            />
          </div>
        )}

        {/* Dynamic Type-Aware Configuration Block */}
        <div className="bg-sand-50/70 p-4 rounded-xl border border-sand-200 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-champagne-800 font-sans border-b border-sand-200 pb-1.5">
            {selectedType} Configuration
          </h4>

          {/* 1. HERO CONFIG */}
          {selectedType === 'HERO' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Button Label</label>
                  <Input {...register('config.ctaLabel')} placeholder="e.g. Explore Masterpieces" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Destination URL</label>
                  <Input {...register('config.ctaUrl')} placeholder="e.g. /collections/tanjore-gold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Text Alignment</label>
                  <Select
                    value={watch('config.textAlignment') || 'center'}
                    onChange={(e) => setValue('config.textAlignment', e.target.value, { shouldDirty: true })}
                    options={[
                      { value: 'center', label: 'Center Aligned' },
                      { value: 'left', label: 'Left Aligned' },
                      { value: 'right', label: 'Right Aligned' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Mode</label>
                  <Select
                    value={watch('config.layout') || 'full-width'}
                    onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                    options={[
                      { value: 'full-width', label: 'Full Width Hero' },
                      { value: 'split', label: 'Split (Text + Visual)' },
                      { value: 'contained', label: 'Contained Box' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Dark Overlay (0 - 1)</label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    {...register('config.overlayOpacity')}
                    placeholder="0.4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. FEATURED PRODUCTS CONFIG */}
          {selectedType === 'FEATURED_PRODUCTS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'grid'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'grid', label: 'Responsive Grid' },
                    { value: 'carousel', label: 'Horizontal Slider' },
                    { value: 'masonry', label: 'Artisan Masonry' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Columns (Desktop)</label>
                <Select
                  value={String(watch('config.columns') || 4)}
                  onChange={(e) => setValue('config.columns', Number(e.target.value), { shouldDirty: true })}
                  options={[
                    { value: '2', label: '2 Columns' },
                    { value: '3', label: '3 Columns' },
                    { value: '4', label: '4 Columns' },
                    { value: '5', label: '5 Columns' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Items</label>
                <Input type="number" min="1" max="24" {...register('config.maxItems')} placeholder="8" />
              </div>
            </div>
          )}

          {/* 3. FEATURED COLLECTIONS CONFIG */}
          {selectedType === 'FEATURED_COLLECTIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'grid'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'grid', label: 'Grid Cards' },
                    { value: 'carousel', label: 'Slider Carousel' },
                    { value: 'spotlight', label: 'Curator Spotlight' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Columns</label>
                <Select
                  value={String(watch('config.columns') || 3)}
                  onChange={(e) => setValue('config.columns', Number(e.target.value), { shouldDirty: true })}
                  options={[
                    { value: '2', label: '2 Columns' },
                    { value: '3', label: '3 Columns' },
                    { value: '4', label: '4 Columns' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Collections</label>
                <Input type="number" min="1" max="12" {...register('config.maxItems')} placeholder="6" />
              </div>
            </div>
          )}

          {/* 4. FEATURED ARTISTS CONFIG */}
          {selectedType === 'FEATURED_ARTISTS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'grid'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'grid', label: 'Avatar Grid' },
                    { value: 'carousel', label: 'Artisan Slider' },
                    { value: 'editorial', label: 'Editorial Profiles' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Columns</label>
                <Select
                  value={String(watch('config.columns') || 4)}
                  onChange={(e) => setValue('config.columns', Number(e.target.value), { shouldDirty: true })}
                  options={[
                    { value: '2', label: '2 Columns' },
                    { value: '3', label: '3 Columns' },
                    { value: '4', label: '4 Columns' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Artists</label>
                <Input type="number" min="1" max="12" {...register('config.maxItems')} placeholder="4" />
              </div>
            </div>
          )}

          {/* 5. CATEGORIES CONFIG */}
          {selectedType === 'CATEGORIES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'cards'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'cards', label: 'Taxonomy Cards' },
                    { value: 'circles', label: 'Circular Icons' },
                    { value: 'grid', label: 'Compact Grid' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Columns</label>
                <Select
                  value={String(watch('config.columns') || 4)}
                  onChange={(e) => setValue('config.columns', Number(e.target.value), { shouldDirty: true })}
                  options={[
                    { value: '2', label: '2 Columns' },
                    { value: '3', label: '3 Columns' },
                    { value: '4', label: '4 Columns' },
                    { value: '6', label: '6 Columns' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Browse All Categories" />
              </div>
            </div>
          )}

          {/* 6. ANTIQUES CONFIG */}
          {selectedType === 'ANTIQUES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Selection Mode</label>
                <Select
                  value={watch('config.selectionMode') || 'AUTOMATIC'}
                  onChange={(e) => setValue('config.selectionMode', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'AUTOMATIC', label: 'Automatic (Latest Verified)' },
                    { value: 'MANUAL', label: 'Manual Selection' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout</label>
                <Select
                  value={watch('config.layout') || 'curator-picks'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'curator-picks', label: 'Curator Picks' },
                    { value: 'grid', label: 'Catalogue Grid' },
                    { value: 'carousel', label: 'Antique Slider' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Items</label>
                <Input type="number" min="1" max="12" {...register('config.maxItems')} placeholder="4" />
              </div>
            </div>
          )}

          {/* 7. SANSKRIT EDIT CONFIG */}
          {selectedType === 'SANSKRIT_EDIT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Selection Mode</label>
                <Select
                  value={watch('config.selectionMode') || 'AUTOMATIC'}
                  onChange={(e) => setValue('config.selectionMode', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'AUTOMATIC', label: 'Automatic (Featured Verses)' },
                    { value: 'MANUAL', label: 'Manual Selection' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout</label>
                <Select
                  value={watch('config.layout') || 'editorial-spotlight'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'editorial-spotlight', label: 'Editorial Spotlight' },
                    { value: 'grid', label: 'Verse Cards Grid' },
                    { value: 'carousel', label: 'Calligraphy Slider' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Entries</label>
                <Input type="number" min="1" max="8" {...register('config.maxItems')} placeholder="3" />
              </div>
            </div>
          )}

          {/* 8. EDITORIAL CONFIG */}
          {selectedType === 'EDITORIAL' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Composition</label>
                <Select
                  value={watch('config.layout') || 'left-image'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'left-image', label: 'Image Left, Text Right' },
                    { value: 'right-image', label: 'Text Left, Image Right' },
                    { value: 'center', label: 'Centered Column' },
                    { value: 'full-quote', label: 'Philosophical Quote Banner' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Quote Author / Source</label>
                <Input {...register('config.quoteAuthor')} placeholder="e.g. Shilpa Shastras, Treatise IV" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Read Heritage Story" />
              </div>
            </div>
          )}

          {/* 9. PROMOTIONAL BANNER CONFIG */}
          {selectedType === 'PROMOTIONAL_BANNER' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Color Theme</label>
                <Select
                  value={watch('config.theme') || 'gold'}
                  onChange={(e) => setValue('config.theme', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'gold', label: 'Imperial Gold' },
                    { value: 'dark', label: 'Charcoal Luxury' },
                    { value: 'light', label: 'Ivory Sand' },
                    { value: 'royal-saffron', label: 'Royal Saffron' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Learn More" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/journal" />
              </div>
            </div>
          )}

          {/* 10. SPACER CONFIG */}
          {selectedType === 'SPACER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Desktop Height (px)</label>
                <Input type="number" min="10" max="200" {...register('config.desktopHeight')} placeholder="60" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Mobile Height (px)</label>
                <Input type="number" min="10" max="100" {...register('config.mobileHeight')} placeholder="30" />
              </div>
            </div>
          )}
        </div>

        {/* Section Visibility Switch */}
        <div className="pt-2">
          <Switch
            checked={Boolean(isActiveVal)}
            onChange={(checked) => setValue('isActive', checked, { shouldDirty: true })}
            label="Section Visibility"
            description="When disabled, this section is hidden from the public storefront."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading} disabled={isEditing && !isDirty}>
            {isEditing ? 'Save Section Changes' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
