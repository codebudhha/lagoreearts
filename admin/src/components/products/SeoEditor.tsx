import React from 'react';
import { Globe, Eye } from 'lucide-react';

export interface SeoFormValues {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface SeoEditorProps {
  values: SeoFormValues;
  onChange: (updates: Partial<SeoFormValues>) => void;
  defaultTitle?: string;
  defaultDescription?: string;
  slug?: string;
  disabled?: boolean;
}

export const SeoEditor: React.FC<SeoEditorProps> = ({
  values,
  onChange,
  defaultTitle = '',
  defaultDescription = '',
  slug = '',
  disabled = false,
}) => {
  const displayTitle = values.metaTitle || defaultTitle || 'Lagoree Arts — Luxury Sacred Art';
  const displayDescription =
    values.metaDescription ||
    defaultDescription ||
    'Discover handcrafted masterpieces, sacred Sanskrit art, and timeless antique collectibles at Lagoree Arts.';
  const previewUrl = `https://lagoreearts.com/products/${slug || 'product-slug'}`;

  const titleLength = (values.metaTitle || '').length;
  const descLength = (values.metaDescription || '').length;

  return (
    <div className="space-y-6">
      {/* Live Google Search Preview Box */}
      <div className="bg-white rounded-lg border border-sand-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
          <Eye className="w-4 h-4 text-gold-600" />
          Search Engine Result Preview (SERP)
        </div>

        <div className="p-4 bg-sand-50/70 rounded-md border border-sand-200/80 font-sans max-w-2xl">
          <div className="text-xs text-[#202124] flex items-center gap-1.5 mb-1 truncate">
            <Globe className="w-3.5 h-3.5 text-charcoal-500" />
            <span className="text-[#202124]">{previewUrl}</span>
          </div>
          <h3 className="text-lg text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug line-clamp-1">
            {displayTitle}
          </h3>
          <p className="text-xs text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
            {displayDescription}
          </p>
        </div>
      </div>

      {/* SEO Form Inputs */}
      <div className="space-y-4">
        {/* Meta Title */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
              Page Meta Title
            </label>
            <span
              className={`text-[11px] font-mono ${
                titleLength > 60 ? 'text-amber-600' : 'text-charcoal-400'
              }`}
            >
              {titleLength}/60 chars
            </span>
          </div>
          <input
            type="text"
            value={values.metaTitle || ''}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            placeholder={defaultTitle || 'e.g. Tanjore Radha Krishna Painting | Lagoree Arts'}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
          />
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
              Meta Description
            </label>
            <span
              className={`text-[11px] font-mono ${
                descLength > 160 ? 'text-amber-600' : 'text-charcoal-400'
              }`}
            >
              {descLength}/160 chars
            </span>
          </div>
          <textarea
            rows={3}
            value={values.metaDescription || ''}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
            placeholder={
              defaultDescription ||
              'A brief, compelling summary of this product for search engines and social previews.'
            }
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100 resize-none"
          />
        </div>

        {/* Canonical URL */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1 font-sans">
            Canonical URL (Optional)
          </label>
          <input
            type="url"
            value={values.canonicalUrl || ''}
            onChange={(e) => onChange({ canonicalUrl: e.target.value })}
            placeholder="https://lagoreearts.com/products/original-slug"
            disabled={disabled}
            className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-sand-100"
          />
        </div>

        {/* Social / OpenGraph */}
        <div className="pt-2 border-t border-sand-200">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-800 font-sans mb-3">
            Social Share & OpenGraph (Optional)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-600 mb-1 font-sans">
                OG Title
              </label>
              <input
                type="text"
                value={values.ogTitle || ''}
                onChange={(e) => onChange({ ogTitle: e.target.value })}
                placeholder="Defaults to meta title"
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none disabled:bg-sand-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-600 mb-1 font-sans">
                OG Image URL
              </label>
              <input
                type="text"
                value={values.ogImage || ''}
                onChange={(e) => onChange({ ogImage: e.target.value })}
                placeholder="https://.../image.jpg"
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-sand-300 rounded-md font-serif focus:border-gold-500 focus:outline-none disabled:bg-sand-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
