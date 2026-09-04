import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  CreateSanskritEditProfilePayload,
  UpdateSanskritEditProfilePayload,
  SanskritEditProfile,
} from '../../lib/api/sanskritEdit';
import { BookOpen, Feather, Sparkles, Save, X, AlertTriangle } from 'lucide-react';

interface SanskritEditFormProps {
  productId: string;
  initialData?: SanskritEditProfile | null;
  onSubmit: (data: CreateSanskritEditProfilePayload | UpdateSanskritEditProfilePayload) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const SanskritEditForm: React.FC<SanskritEditFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'source' | 'editorial' | 'publishing'>('content');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<CreateSanskritEditProfilePayload>({
    defaultValues: {
      sanskritTitle: initialData?.sanskritTitle || '',
      devanagariText: initialData?.devanagariText || '',
      transliteration: initialData?.transliteration || '',
      translation: initialData?.translation || '',
      meaning: initialData?.meaning || '',
      pronunciation: initialData?.pronunciation || '',
      pronunciationGuide: initialData?.pronunciationGuide || '',
      source: initialData?.source || '',
      sourceReference: initialData?.sourceReference || '',
      theme: initialData?.theme || '',
      context: initialData?.context || '',
      editorialContent: initialData?.editorialContent || '',
      featuredExcerpt: initialData?.featuredExcerpt || '',
      featuredExcerptTranslation: initialData?.featuredExcerptTranslation || '',
      editorialNote: initialData?.editorialNote || '',
      displayOrder: initialData?.displayOrder ?? 0,
      isFeatured: initialData?.isFeatured || false,
      isPublished: initialData?.isPublished || false,
    },
  });

  const isPublishedVal = watch('isPublished');
  const isFeaturedVal = watch('isFeatured');

  // Backend invariant: A Sanskrit Edit profile must be published before it can be featured.
  const featuredWithoutPublished = Boolean(isFeaturedVal && !isPublishedVal);

  const onFormSubmit = async (formData: CreateSanskritEditProfilePayload) => {
    const payload: CreateSanskritEditProfilePayload = {
      ...formData,
      displayOrder: Number(formData.displayOrder || 0),
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-sand-300 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'content'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Verse & Calligraphy
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('source')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'source'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Feather className="w-4 h-4" />
          Source & Scriptural Context
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('editorial')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'editorial'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Feather className="w-4 h-4" />
          Editorial Essays & Notes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publishing')}
          className={`pb-3 text-sm font-semibold tracking-wider font-sans transition-all flex items-center gap-2 border-b-2 ${
            activeTab === 'publishing'
              ? 'border-gold-600 text-charcoal-900'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Publishing & Curation
        </button>
      </div>

      {/* Featured Invariant Warning */}
      {featuredWithoutPublished && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Publishing Invariant Requirement</p>
            <p>
              A Sanskrit Edit entry must be <strong>Published</strong> before it can be marked as <strong>Featured</strong>. Please enable "Publish to Storefront" or disable "Featured Showcase".
            </p>
          </div>
        </div>
      )}

      {/* Tab 1: Verse & Calligraphy */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Sanskrit Verse / Shloka Content
            </h3>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Sanskrit Title / Shloka Title
              </label>
              <Input
                {...register('sanskritTitle')}
                placeholder="e.g. Mahamrityunjaya Mantra / Rigveda Mandala X"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Devanagari Script (Unicode UTF-8)
              </label>
              <Textarea
                {...register('devanagariText')}
                rows={3}
                placeholder="ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्..."
                className="text-lg font-serif"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  IAST Transliteration (Diacritics)
                </label>
                <Input
                  {...register('transliteration')}
                  placeholder="e.g. oṃ tryambakaṃ yajāmahe sugandhiṃ puṣṭivardhanam"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                  Pronunciation Audio Guide / Phonetics
                </label>
                <Input
                  {...register('pronunciation')}
                  placeholder="e.g. om try-um-bah-kum ya-jaa-ma-hay"
                  disabled={disabled}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
              Translation & Philosophical Significance
            </h3>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                English Translation
              </label>
              <Textarea
                {...register('translation')}
                rows={3}
                placeholder="We meditate on the three-eyed one, fragrant, expanding our inner vitality..."
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Philosophical Meaning & Esoteric Significance
              </label>
              <Textarea
                {...register('meaning')}
                rows={4}
                placeholder="Detailed exposition on the cosmic symbolism and spiritual heritage..."
                disabled={disabled}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Source & Scriptural Context */}
      {activeTab === 'source' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Vedic & Scriptural Lineage
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Primary Scripture / Source
              </label>
              <Input
                {...register('source')}
                placeholder="e.g. Rigveda / Upanishads / Bhagavad Gita"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Scriptural Reference (Mandala / Sukta / Chapter)
              </label>
              <Input
                {...register('sourceReference')}
                placeholder="e.g. Chapter 2, Verse 47 / Mandala 7.59.12"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Vedic Theme / Spiritual Motif
              </label>
              <Input
                {...register('theme')}
                placeholder="e.g. Immortality, Cosmic Order, Divine Consciousness"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Pronunciation Guide Description
              </label>
              <Input
                {...register('pronunciationGuide')}
                placeholder="e.g. Traditional Vedic Chanting Meter (Anustubh Chhandas)"
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Historical & Devotional Context
            </label>
            <Textarea
              {...register('context')}
              rows={4}
              placeholder="Origins in sacred temple ceremonies, court recitations, or meditative rituals..."
              disabled={disabled}
            />
          </div>
        </Card>
      )}

      {/* Tab 3: Editorial Essays & Notes */}
      {activeTab === 'editorial' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Editorial Narrative & Highlights
          </h3>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Featured Excerpt (Callout Highlight)
            </label>
            <Input
              {...register('featuredExcerpt')}
              placeholder="e.g. मृत्युर्मुक्षीय मामृतात्"
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Featured Excerpt Translation
            </label>
            <Input
              {...register('featuredExcerptTranslation')}
              placeholder="e.g. May I be liberated from mortality, not from immortality."
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Full Editorial Essay
            </label>
            <Textarea
              {...register('editorialContent')}
              rows={6}
              placeholder="Comprehensive editorial narrative by Lagoree Arts scholars..."
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
              Internal Curatorial Notes (Admin Only)
            </label>
            <Textarea
              {...register('editorialNote')}
              rows={3}
              placeholder="Scholarly cross-references, upcoming exhibition placements..."
              disabled={disabled}
            />
          </div>
        </Card>
      )}

      {/* Tab 4: Publishing & Curation */}
      {activeTab === 'publishing' && (
        <Card className="p-6 space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-800 font-sans border-b border-sand-200 pb-2">
            Publishing Status & Display Sequencing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="bg-sand-50/80 p-4 rounded-xl border border-sand-200 space-y-2">
              <Switch
                checked={Boolean(isPublishedVal)}
                onChange={(checked) => setValue('isPublished', checked, { shouldDirty: true })}
                label="Publish to Storefront"
                description="Make visible on The Sanskrit Edit portal"
                disabled={disabled}
              />
            </div>

            <div className="bg-sand-50/80 p-4 rounded-xl border border-sand-200 space-y-2">
              <Switch
                checked={Boolean(isFeaturedVal)}
                onChange={(checked) => setValue('isFeatured', checked, { shouldDirty: true })}
                label="Featured Showcase"
                description="Promote to Sanskrit hero carousel"
                disabled={disabled}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 uppercase tracking-wider mb-1">
                Display Order Sequence
              </label>
              <Input
                type="number"
                {...register('displayOrder')}
                placeholder="0"
                disabled={disabled}
              />
              <span className="text-[11px] text-charcoal-500 mt-1 block">Lower numbers appear first.</span>
            </div>
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
          disabled={disabled || !isDirty || featuredWithoutPublished}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {initialData ? 'Update Sanskrit Edit' : 'Save Sanskrit Edit'}
        </Button>
      </div>
    </form>
  );
};
