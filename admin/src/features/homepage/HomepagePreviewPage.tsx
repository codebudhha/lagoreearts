import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { SectionTypeBadge } from '../../components/homepage/SectionTypeBadge';
import { useHomepage } from '../../hooks/useHomepage';
import { AdminHomepageSection } from '../../lib/api/homepage';
import {
  Monitor,
  Tablet,
  Smartphone,
  Edit2,
  Package,
  FolderArchive,
  User,
  ArrowRight,
} from 'lucide-react';

export const HomepagePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const { data: homepage, isLoading, isError, error, refetch } = useHomepage(id || '');

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (isError || !homepage) {
    return (
      <PageContainer>
        <ErrorState
          title="Preview unavailable"
          message={(error as Error)?.message || 'Failed to load homepage layout for preview.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const sections = [...(homepage.sections || [])]
    .filter((s) => s.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      case 'desktop':
      default:
        return 'max-w-5xl';
    }
  };

  const renderSectionContent = (section: AdminHomepageSection) => {
    const config = (section.config as Record<string, any>) || {};
    const heroMedia =
      section.media?.find((m) => m.role === 'BACKGROUND')?.media ||
      section.media?.find((m) => m.role === 'PRIMARY')?.media;

    switch (section.type) {
      case 'HERO':
        return (
          <div
            className="relative rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center p-8 text-center text-white bg-neutral-900"
            style={{
              backgroundImage: heroMedia?.url ? `url(${heroMedia.url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
            <div className="relative z-10 max-w-xl space-y-3">
              <span className="text-xs uppercase tracking-widest text-gold-400 font-semibold">
                Lagoree Heritage
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white">
                {section.title || 'Sacred Living & Timeless Craft'}
              </h1>
              {section.subtitle && (
                <p className="text-xs sm:text-sm text-neutral-200">
                  {section.subtitle}
                </p>
              )}
              {config.ctaText && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold px-4 py-2 rounded shadow">
                    {config.ctaText}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'FEATURED_PRODUCTS':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {section.title || 'Curated Masterpieces'}
              </h2>
              {section.subtitle && (
                <p className="text-xs text-neutral-500">{section.subtitle}</p>
              )}
            </div>

            {(!section.products || section.products.length === 0) ? (
              <div className="p-6 border border-dashed rounded-lg text-center text-xs text-neutral-400">
                No products linked to this section yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {section.products.map((p) => (
                  <div
                    key={p.productId}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 space-y-2 bg-white dark:bg-neutral-800"
                  >
                    <div className="aspect-square bg-neutral-100 dark:bg-neutral-900 rounded flex items-center justify-center overflow-hidden">
                      {p.product?.thumbnailUrl ? (
                        <img
                          src={p.product.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {p.product?.title || 'Product'}
                    </p>
                    <p className="text-xs text-gold-600 font-semibold font-mono">
                      {p.product?.price ? `₹${p.product.price}` : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'FEATURED_COLLECTIONS':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {section.title || 'Featured Collections'}
              </h2>
              {section.subtitle && (
                <p className="text-xs text-neutral-500">{section.subtitle}</p>
              )}
            </div>

            {(!section.collections || section.collections.length === 0) ? (
              <div className="p-6 border border-dashed rounded-lg text-center text-xs text-neutral-400">
                No collections linked to this section yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {section.collections.map((c) => (
                  <div
                    key={c.collectionId}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 space-y-2 bg-white dark:bg-neutral-800 text-center"
                  >
                    <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 rounded flex items-center justify-center overflow-hidden">
                      {c.collection?.imageUrl ? (
                        <img
                          src={c.collection.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderArchive className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {c.collection?.title || 'Collection'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'FEATURED_ARTISTS':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
                {section.title || 'Featured Master Artisans'}
              </h2>
              {section.subtitle && (
                <p className="text-xs text-neutral-500">{section.subtitle}</p>
              )}
            </div>

            {(!section.artists || section.artists.length === 0) ? (
              <div className="p-6 border border-dashed rounded-lg text-center text-xs text-neutral-400">
                No artists linked to this section yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {section.artists.map((a) => (
                  <div
                    key={a.artistId}
                    className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-3 space-y-2 bg-white dark:bg-neutral-800 text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden">
                      {a.artist?.avatarUrl ? (
                        <img
                          src={a.artist.avatarUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-neutral-400" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {a.artist?.name || 'Artist'}
                    </p>
                    {a.artist?.origin && (
                      <p className="text-xs text-neutral-400">{a.artist.origin}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'PROMOTIONAL_BANNER':
      case 'IMAGE_BANNER':
        return (
          <div className="p-6 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold font-serif">
                {section.title || 'Seasonal Heritage Collection'}
              </h3>
              {section.subtitle && (
                <p className="text-xs text-neutral-300">{section.subtitle}</p>
              )}
            </div>
            {config.ctaText && (
              <span className="text-xs font-semibold bg-gold-500 text-black px-4 py-2 rounded whitespace-nowrap">
                {config.ctaText}
              </span>
            )}
          </div>
        );

      case 'SPACER':
        return <div className="h-8 border-t border-dashed border-neutral-300 dark:border-neutral-700 my-2" />;

      default:
        return (
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-2">
            <h3 className="text-sm font-semibold">{section.title || section.type}</h3>
            {section.subtitle && <p className="text-xs text-neutral-500">{section.subtitle}</p>}
          </div>
        );
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Storefront Preview: ${homepage.name}`}
        description="Simulate the customer-facing storefront visual hierarchy across desktop, tablet, and mobile screens."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Homepage CMS', path: '/admin/homepage' },
          { label: homepage.name, path: `/admin/homepage/${homepage.id}/edit` },
          { label: 'Preview' },
        ]}
      >
        <div className="flex items-center gap-3">
          {/* Viewport switcher */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-neutral-900 shadow-sm text-gold-600 font-medium'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-neutral-900 shadow-sm text-gold-600 font-medium'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              Tablet
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-neutral-900 shadow-sm text-gold-600 font-medium'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/homepage/${homepage.id}/edit`)}
            className="gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            Edit Layout
          </Button>
        </div>
      </PageHeader>

      {/* Simulator canvas */}
      <div className="flex justify-center p-6 bg-neutral-100 dark:bg-neutral-950 rounded-xl min-h-[700px] border border-neutral-200 dark:border-neutral-800">
        <div
          className={`w-full ${getViewportWidth()} transition-all duration-300 bg-white dark:bg-neutral-900 shadow-lg rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800`}
        >
          {/* Mock Storefront Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
            <span className="font-serif font-bold text-base tracking-widest text-neutral-900 dark:text-neutral-100">
              LAGOREE
            </span>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span>Art</span>
              <span>Antiques</span>
              <span>The Sanskrit Edit</span>
              <span>Journal</span>
            </div>
          </div>

          {/* Sections Stack */}
          <div className="p-6 space-y-10">
            {sections.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-sm">
                No active sections to display.
              </div>
            ) : (
              sections.map((section) => (
                <section key={section.id} className="relative group">
                  <div className="absolute -top-3 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <SectionTypeBadge type={section.type} />
                  </div>
                  {renderSectionContent(section)}
                </section>
              ))
            )}
          </div>

          {/* Mock Storefront Footer */}
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 text-center text-xs text-neutral-400 space-y-1">
            <p className="font-serif font-medium text-neutral-600 dark:text-neutral-300">
              Lagoree Arts & Antiques
            </p>
            <p>© {new Date().getFullYear()} All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
