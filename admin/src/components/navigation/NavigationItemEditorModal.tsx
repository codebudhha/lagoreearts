import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Button } from '../ui/Button';
import {
  AdminNavigationItem,
  NavigationItemTargetType,
  NavigationItemDisplayType,
  navigationItemTargetTypes,
  navigationItemDisplayTypes,
} from '../../lib/api/navigation';
import { useCategoriesList } from '../../hooks/useCategories';
import { useCollectionsList } from '../../hooks/useCollections';
import { useProductsList } from '../../hooks/useProducts';
import { useArtists } from '../../hooks/useArtists';
import { useJournalPosts } from '../../hooks/useJournal';
import { useLookbooks } from '../../hooks/useLookbook';
import { useSanskritEditList } from '../../hooks/useSanskritEdit';

interface NavigationItemEditorFormData {
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

export interface NavigationItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigationId: string;
  item?: AdminNavigationItem;
  parentId?: string | null;
  onSubmit: (data: NavigationItemEditorFormData) => void | Promise<void>;
  isLoading: boolean;
}

const FORBIDDEN_URL_PREFIXES = ['javascript:', 'data:', 'vbscript:'];

function validateUrl(url: string, targetType: NavigationItemTargetType): string | true {
  if (!url) return true;
  if (url.startsWith('//')) return 'Protocol-relative URLs are not allowed';
  for (const prefix of FORBIDDEN_URL_PREFIXES) {
    if (url.toLowerCase().startsWith(prefix)) return `URLs starting with ${prefix} are not allowed`;
  }
  if (targetType === 'INTERNAL_URL' && !url.startsWith('/')) {
    return 'Internal URLs must start with /';
  }
  if (targetType === 'EXTERNAL_URL') {
    if (!/^https?:\/\//i.test(url)) {
      return 'External URLs must start with http:// or https://';
    }
  }
  return true;
}

const ENTITY_TYPES: NavigationItemTargetType[] = [
  'CATEGORY', 'COLLECTION', 'PRODUCT', 'ARTIST', 'JOURNAL', 'LOOKBOOK', 'SANSKRIT_EDIT',
];

const ENTITY_LABELS: Record<string, string> = {
  CATEGORY: 'Category',
  COLLECTION: 'Collection',
  PRODUCT: 'Product',
  ARTIST: 'Artist',
  JOURNAL: 'Journal Post',
  LOOKBOOK: 'Lookbook',
  SANSKRIT_EDIT: 'Sanskrit Edit',
};

export const NavigationItemEditorModal: React.FC<NavigationItemEditorModalProps> = ({
  isOpen,
  onClose,
  navigationId: _navigationId,
  item,
  parentId: _parentId,
  onSubmit,
  isLoading,
}) => {
  const isEditing = Boolean(item);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NavigationItemEditorFormData>({
    defaultValues: {
      label: '',
      description: '',
      targetType: 'NONE',
      displayType: 'LINK',
      url: '',
      targetId: '',
      openInNewTab: false,
      isVisible: true,
      isFeatured: false,
    },
  });

  const targetType = watch('targetType');
  const isEntityType = ENTITY_TYPES.includes(targetType);

  useEffect(() => {
    if (isOpen) {
      reset({
        label: item?.label || '',
        description: item?.description || '',
        targetType: item?.targetType || 'NONE',
        displayType: item?.displayType || 'LINK',
        url: item?.url || '',
        targetId: item?.targetId || '',
        openInNewTab: item?.openInNewTab || false,
        isVisible: item?.isVisible ?? true,
        isFeatured: item?.isFeatured || false,
      });
    }
  }, [isOpen, item, reset]);

  const [entitySearch, setEntitySearch] = useState('');

  const { data: categories } = useCategoriesList(
    isOpen && targetType === 'CATEGORY' ? { search: entitySearch || undefined, limit: 50 } : undefined,
    isOpen && targetType === 'CATEGORY'
  );
  const { data: collections } = useCollectionsList(
    isOpen && targetType === 'COLLECTION' ? { search: entitySearch || undefined, limit: 50 } : undefined,
    isOpen && targetType === 'COLLECTION'
  );
  const { data: products } = useProductsList(
    isOpen && targetType === 'PRODUCT' ? { search: entitySearch || undefined, limit: 50 } : undefined,
  );
  const { data: artists } = useArtists(
    isOpen && targetType === 'ARTIST' ? { search: entitySearch || undefined, limit: 50 } : undefined,
  );
  const { data: journalPosts } = useJournalPosts(
    isOpen && targetType === 'JOURNAL' ? { search: entitySearch || undefined, limit: 50 } : undefined,
  );
  const { data: lookbooks } = useLookbooks(
    isOpen && targetType === 'LOOKBOOK' ? { search: entitySearch || undefined, limit: 50 } : undefined,
  );
  const { data: sanskritEdits } = useSanskritEditList(
    isOpen && targetType === 'SANSKRIT_EDIT' ? { search: entitySearch || undefined, limit: 50 } : undefined,
  );

  const entityOptions = useMemo(() => {
    const noOption = { value: '', label: '— Select —' };
    switch (targetType) {
      case 'CATEGORY': {
        const raw: any = categories;
        const items = Array.isArray(raw) ? raw : raw?.items || raw?.categories || [];
        return [noOption, ...items.map((c: any) => ({ value: c.id, label: c.name }))];
      }
      case 'COLLECTION': {
        const raw: any = collections;
        const items = Array.isArray(raw) ? raw : raw?.items || raw?.collections || [];
        return [noOption, ...items.map((c: any) => ({ value: c.id, label: c.name }))];
      }
      case 'PRODUCT': {
        const raw: any = products;
        const items = Array.isArray(raw) ? raw : raw?.products || raw?.items || [];
        return [noOption, ...items.map((p: any) => ({ value: p.id, label: p.title || p.name }))];
      }
      case 'ARTIST': {
        const raw: any = artists;
        const items = Array.isArray(raw) ? raw : raw?.items || raw?.artists || [];
        return [noOption, ...items.map((a: any) => ({ value: a.id, label: a.name }))];
      }
      case 'JOURNAL': {
        const raw: any = journalPosts;
        const items = Array.isArray(raw) ? raw : raw?.items || [];
        return [noOption, ...items.map((p: any) => ({ value: p.id, label: p.title }))];
      }
      case 'LOOKBOOK': {
        const raw: any = lookbooks;
        const items = Array.isArray(raw) ? raw : raw?.items || [];
        return [noOption, ...items.map((l: any) => ({ value: l.id, label: l.title || l.name }))];
      }
      case 'SANSKRIT_EDIT': {
        const raw: any = sanskritEdits;
        const items = Array.isArray(raw) ? raw : raw?.items || [];
        return [noOption, ...items.map((s: any) => ({ value: s.id, label: s.title || s.name }))];
      }
      default:
        return [noOption];
    }
  }, [targetType, categories, collections, products, artists, journalPosts, lookbooks, sanskritEdits]);

  const handleFormSubmit = async (data: NavigationItemEditorFormData) => {
    await onSubmit(data);
    setEntitySearch('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setEntitySearch(''); }}
      title={isEditing ? 'Edit Navigation Item' : 'Add Navigation Item'}
      description={isEditing ? 'Update the menu item properties.' : 'Configure a new menu item.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { onClose(); setEntitySearch(''); }} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            form="nav-item-form"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </>
      }
    >
      <form id="nav-item-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <Controller
          name="label"
          control={control}
          rules={{ required: 'Label is required' }}
          render={({ field }) => (
            <Input
              {...field}
              label="Label *"
              placeholder="e.g. Shop by Category"
              error={errors.label?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="Description"
              placeholder="Optional tooltip or description"
            />
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="targetType"
            control={control}
            render={({ field }) => (
              <Select
                label="Link Type"
                value={field.value}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setEntitySearch('');
                  setValue('targetId', '');
                }}
                options={navigationItemTargetTypes.map(t => ({ value: t.value, label: t.label }))}
              />
            )}
          />

          <Controller
            name="displayType"
            control={control}
            render={({ field }) => (
              <Select
                label="Display Type"
                value={field.value}
                onChange={field.onChange}
                options={navigationItemDisplayTypes.map(t => ({ value: t.value, label: t.label }))}
              />
            )}
          />
        </div>

        {targetType === 'INTERNAL_URL' && (
          <Controller
            name="url"
            control={control}
            rules={{
              validate: (v) => validateUrl(v, targetType),
            }}
            render={({ field }) => (
              <Input
                {...field}
                label="Internal URL"
                placeholder="/collections/new-arrivals"
                leftIcon={<span className="text-xs font-mono">/</span>}
                error={errors.url?.message}
              />
            )}
          />
        )}

        {targetType === 'EXTERNAL_URL' && (
          <Controller
            name="url"
            control={control}
            rules={{
              validate: (v) => validateUrl(v, targetType),
            }}
            render={({ field }) => (
              <Input
                {...field}
                label="External URL"
                placeholder="https://example.com/page"
                leftIcon={<span className="text-xs font-mono">https://</span>}
                error={errors.url?.message}
              />
            )}
          />
        )}

        {isEntityType && (
          <Controller
            name="targetId"
            control={control}
            rules={{
              required: isEntityType ? `Please select a ${ENTITY_LABELS[targetType]}` : false,
            }}
            render={({ field }) => (
              <Select
                label={`${ENTITY_LABELS[targetType]} *`}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                options={entityOptions}
                error={errors.targetId?.message}
              />
            )}
          />
        )}

        {isEntityType && (
          <Input
            value={entitySearch}
            onChange={(e) => setEntitySearch(e.target.value)}
            placeholder={`Search ${ENTITY_LABELS[targetType]?.toLowerCase()}s...`}
            label="Search Entities"
          />
        )}

        <div className="space-y-3 pt-2 border-t border-ivory-200">
          <Controller
            name="openInNewTab"
            control={control}
            render={({ field }) => (
              <Switch
                id="open-in-new-tab"
                label="Open in new tab"
                description="Open this link in a new browser tab"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="isVisible"
            control={control}
            render={({ field }) => (
              <Switch
                id="is-visible"
                label="Visible"
                description="Show this item in the navigation menu"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="isFeatured"
            control={control}
            render={({ field }) => (
              <Switch
                id="is-featured"
                label="Featured"
                description="Highlight this item as featured in the navigation"
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
};
