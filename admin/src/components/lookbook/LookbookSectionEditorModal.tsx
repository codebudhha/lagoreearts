import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import {
  AdminLookbookSection,
  LookbookSectionType,
  CreateLookbookSectionPayload,
  UpdateLookbookSectionPayload,
  lookbookSectionTypes,
} from '../../lib/api/lookbook';

interface LookbookSectionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  section?: AdminLookbookSection | null;
  onSubmit: (payload: CreateLookbookSectionPayload | UpdateLookbookSectionPayload) => Promise<void>;
  isLoading?: boolean;
}

export const LookbookSectionEditorModal: React.FC<LookbookSectionEditorModalProps> = ({
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
      body: '',
      ctaLabel: '',
      ctaUrl: '',
      isVisible: true,
      config: {},
    },
  });

  const selectedType = watch('type');
  const isVisibleVal = watch('isVisible');

  useEffect(() => {
    if (section) {
      reset({
        type: section.type,
        title: section.title || '',
        subtitle: section.subtitle || '',
        body: section.body || '',
        ctaLabel: section.ctaLabel || '',
        ctaUrl: section.ctaUrl || '',
        isVisible: section.isVisible,
        config: section.config || {},
      });
    } else {
      reset({
        type: 'HERO',
        title: '',
        subtitle: '',
        body: '',
        ctaLabel: '',
        ctaUrl: '',
        isVisible: true,
        config: {
          textAlignment: 'center',
          overlayOpacity: 0.4,
          ctaLabel: 'Explore Collection',
          ctaUrl: '/collections/all',
          layout: 'full-width',
        },
      });
    }
  }, [section, reset, isOpen]);

  const onFormSubmit = async (formData: any) => {
    await onSubmit({
      type: formData.type,
      title: formData.title || undefined,
      subtitle: formData.subtitle || undefined,
      body: formData.body || undefined,
      ctaLabel: (formData.ctaLabel || formData.config?.ctaLabel) || undefined,
      ctaUrl: (formData.ctaUrl || formData.config?.ctaUrl) || undefined,
      isVisible: formData.isVisible,
      layout: formData.config?.layout || undefined,
      config: formData.config || {},
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Section: ${section?.title || section?.type}` : 'Add New Lookbook Section'}
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
            onChange={(e) => setValue('type', e.target.value as LookbookSectionType, { shouldDirty: true })}
            options={lookbookSectionTypes}
            disabled={isEditing}
          />
        </div>

        {/* Base Titles & Headings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Section Title
            </label>
            <Input
              {...register('title')}
              placeholder="e.g. Masterworks of Tanjore"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Subtitle / Description
            </label>
            <Input
              {...register('subtitle')}
              placeholder="e.g. Handcrafted in 24K gold foil by master artisans"
            />
          </div>
        </div>

        {/* Body / Narrative Content */}
        {(selectedType === 'HERO' ||
          selectedType === 'EDITORIAL' ||
          selectedType === 'MIXED') && (
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Body Content / Narrative
            </label>
            <Textarea
              {...register('body')}
              rows={3}
              placeholder="Enter supporting commentary or narrative..."
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Eyebrow Label</label>
                  <Input {...register('config.eyebrow')} placeholder="e.g. SACRED TRADITIONS" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">Text Color</label>
                  <Input {...register('config.textColor')} placeholder="e.g. #FFFFFF" />
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

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Overlay Color</label>
                <Input {...register('config.overlayColor')} placeholder="e.g. #1a1714" />
              </div>
            </div>
          )}

          {/* 2. EDITORIAL CONFIG */}
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
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Alignment</label>
                <Select
                  value={watch('config.alignment') || 'left'}
                  onChange={(e) => setValue('config.alignment', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'left', label: 'Left Aligned' },
                    { value: 'center', label: 'Center Aligned' },
                    { value: 'right', label: 'Right Aligned' },
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
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/journal" />
              </div>
            </div>
          )}

          {/* 3. PRODUCTS CONFIG */}
          {selectedType === 'PRODUCTS' && (
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
                    { value: 'lookbook-spotlight', label: 'Lookbook Spotlight' },
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
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Browse All Artworks" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/artworks" />
              </div>
              <div className="col-span-full flex flex-col gap-2">
                <Switch
                  checked={Boolean(watch('config.showPrice'))}
                  onChange={(checked) => setValue('config.showPrice', checked, { shouldDirty: true })}
                  label="Show Price"
                />
                <Switch
                  checked={Boolean(watch('config.showArtist'))}
                  onChange={(checked) => setValue('config.showArtist', checked, { shouldDirty: true })}
                  label="Show Artist"
                />
              </div>
            </div>
          )}

          {/* 4. COLLECTIONS CONFIG */}
          {selectedType === 'COLLECTIONS' && (
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
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Explore Collections" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/collections" />
              </div>
            </div>
          )}

          {/* 5. ARTISTS CONFIG */}
          {selectedType === 'ARTISTS' && (
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
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Meet the Makers" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/artists" />
              </div>
            </div>
          )}

          {/* 6. CATEGORIES CONFIG */}
          {selectedType === 'CATEGORIES' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'cards'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'cards', label: 'Category Cards' },
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
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Categories</label>
                <Input type="number" min="1" max="12" {...register('config.maxItems')} placeholder="6" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Browse All Categories" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/categories" />
              </div>
              <div className="col-span-full">
                <Switch
                  checked={Boolean(watch('config.showCount'))}
                  onChange={(checked) => setValue('config.showCount', checked, { shouldDirty: true })}
                  label="Show Item Count"
                />
              </div>
            </div>
          )}

          {/* 7. JOURNAL CONFIG */}
          {selectedType === 'JOURNAL' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'grid'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'grid', label: 'Post Grid' },
                    { value: 'carousel', label: 'Slider Carousel' },
                    { value: 'featured-lead', label: 'Featured Lead Story' },
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
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Posts</label>
                <Input type="number" min="1" max="12" {...register('config.maxItems')} placeholder="4" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Read the Journal" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/journal" />
              </div>
              <div className="col-span-full">
                <Switch
                  checked={Boolean(watch('config.showExcerpt'))}
                  onChange={(checked) => setValue('config.showExcerpt', checked, { shouldDirty: true })}
                  label="Show Excerpt"
                />
              </div>
            </div>
          )}

          {/* 8. SANSKRIT EDIT CONFIG */}
          {selectedType === 'SANSKRIT_EDIT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Max Entries</label>
                <Input type="number" min="1" max="8" {...register('config.maxItems')} placeholder="3" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Discover More Verses" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/sanskrit-edit" />
              </div>
              <div className="col-span-full flex flex-col gap-2">
                <Switch
                  checked={Boolean(watch('config.showTranslation'))}
                  onChange={(checked) => setValue('config.showTranslation', checked, { shouldDirty: true })}
                  label="Show Translation"
                />
                <Switch
                  checked={Boolean(watch('config.showDevanagari'))}
                  onChange={(checked) => setValue('config.showDevanagari', checked, { shouldDirty: true })}
                  label="Show Devanagari"
                />
              </div>
            </div>
          )}

          {/* 9. GALLERY CONFIG */}
          {selectedType === 'GALLERY' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'masonry'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'masonry', label: 'Masonry Wall' },
                    { value: 'grid', label: 'Uniform Grid' },
                    { value: 'carousel', label: 'Image Carousel' },
                    { value: 'lightbox', label: 'Lightbox Gallery' },
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
                    { value: '5', label: '5 Columns' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Aspect Ratio</label>
                <Select
                  value={watch('config.aspectRatio') || 'square'}
                  onChange={(e) => setValue('config.aspectRatio', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'square', label: 'Square (1:1)' },
                    { value: 'portrait', label: 'Portrait' },
                    { value: 'landscape', label: 'Landscape' },
                    { value: 'original', label: 'Original' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="View Full Gallery" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/gallery" />
              </div>
            </div>
          )}

          {/* 10. MIXED CONFIG */}
          {selectedType === 'MIXED' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">Layout Style</label>
                <Select
                  value={watch('config.layout') || 'split-story'}
                  onChange={(e) => setValue('config.layout', e.target.value, { shouldDirty: true })}
                  options={[
                    { value: 'split-story', label: 'Split Story' },
                    { value: 'magazine-spread', label: 'Magazine Spread' },
                    { value: 'curator-choice', label: "Curator's Choice" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA Label</label>
                <Input {...register('config.ctaLabel')} placeholder="Explore More" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">CTA URL</label>
                <Input {...register('config.ctaUrl')} placeholder="/lookbook" />
              </div>
              <div className="col-span-full">
                <Switch
                  checked={Boolean(watch('config.showEntities'))}
                  onChange={(checked) => setValue('config.showEntities', checked, { shouldDirty: true })}
                  label="Show Linked Entities"
                  description="Display products, collections and artists linked to this section."
                />
              </div>
            </div>
          )}
        </div>

        {/* Section Visibility Switch */}
        <div className="pt-2">
          <Switch
            checked={Boolean(isVisibleVal)}
            onChange={(checked) => setValue('isVisible', checked, { shouldDirty: true })}
            label="Section Visibility"
            description="When disabled, this section is hidden from the public lookbook."
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
