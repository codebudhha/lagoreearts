import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LookbookStatusBadge } from '../../components/lookbook/LookbookStatusBadge';
import { LookbookSectionTypeBadge } from '../../components/lookbook/LookbookSectionTypeBadge';
import { useLookbookDetail } from '../../hooks/useLookbook';
import { HeroSectionConfig } from '../../lib/api/lookbook';
import {
  Edit2,
  Shield,
  Package,
  FolderArchive,
  User,
  Tags,
  BookOpen,
  Feather,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

export const LookbookPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lookbook, isLoading, isError, error, refetch } = useLookbookDetail(id || '');

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !lookbook) {
    return (
      <PageContainer>
        <ErrorState
          title="Lookbook not found"
          message={(error as Error)?.message || 'Unable to load lookbook for preview.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const sections = [...(lookbook.sections || [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const visibleSections = sections.filter((s) => s.isVisible);

  return (
    <PageContainer>
      <PageHeader
        title={lookbook.title}
        description="Admin preview of the lookbook as it would appear on the storefront."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Lookbooks', path: '/admin/lookbook' },
          { label: 'Preview' },
        ]}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            ADMIN PREVIEW
          </div>

          <LookbookStatusBadge status={lookbook.status} featured={lookbook.featured} />

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/lookbook/${lookbook.id}/edit`)}
            className="gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            Back to Editor
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Cover Media */}
        {lookbook.coverMedia?.url && (
          <div className="relative rounded-xl overflow-hidden shadow-lg">
            <img
              src={lookbook.coverMedia.url}
              alt={lookbook.title}
              className="w-full aspect-[21/9] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <h1 className="text-3xl font-serif font-bold text-white mb-2 drop-shadow-lg">
                {lookbook.title}
              </h1>
              {lookbook.shortDescription && (
                <p className="text-ivory-200 text-lg max-w-2xl drop-shadow">
                  {lookbook.shortDescription}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Title if no cover */}
        {!lookbook.coverMedia?.url && (
          <div className="text-center py-8">
            <h1 className="text-3xl font-serif font-bold text-charcoal-900 mb-2">
              {lookbook.title}
            </h1>
            {lookbook.shortDescription && (
              <p className="text-charcoal-500 text-lg max-w-2xl mx-auto">
                {lookbook.shortDescription}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {lookbook.description && (
          <Card className="p-8 border border-sand-200">
            <div
              className="prose prose-lg max-w-none text-charcoal-700 font-serif"
              dangerouslySetInnerHTML={{ __html: lookbook.description }}
            />
          </Card>
        )}

        {/* Sections */}
        {visibleSections.length > 0 && (
          <div className="space-y-10">
            {visibleSections.map((section) => (
              <div key={section.id} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-3">
                  <LookbookSectionTypeBadge type={section.type} />
                  <div>
                    {section.title && (
                      <h2 className="text-xl font-serif font-bold text-charcoal-900">
                        {section.title}
                      </h2>
                    )}
                    {section.subtitle && (
                      <p className="text-sm text-charcoal-500">{section.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Section Body */}
                {section.body && (
                  <div className="text-sm text-charcoal-700 font-serif leading-relaxed max-w-3xl">
                    {section.body}
                  </div>
                )}

                {/* HERO Section Preview */}
                {section.type === 'HERO' && section.config && (
                  (() => {
                    const hero = section.config as HeroSectionConfig;
                    return (
                  <Card className="overflow-hidden border border-sand-200">
                    <div className="relative bg-gradient-to-r from-charcoal-900 to-charcoal-700 p-12 text-center">
                      {hero.eyebrow && (
                        <p className="text-xs font-bold uppercase tracking-widest text-champagne-400 mb-3">
                          {hero.eyebrow}
                        </p>
                      )}
                      <h3 className="text-2xl font-serif font-bold text-white mb-2">
                        {section.title || 'Hero Title'}
                      </h3>
                      {section.subtitle && (
                        <p className="text-ivory-200 mb-6">{section.subtitle}</p>
                      )}
                      {hero.ctaLabel && (
                        <Button className="bg-gold-600 hover:bg-gold-700 text-white">
                          {hero.ctaLabel}
                        </Button>
                      )}
                      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-ivory-400">
                        {hero.layout && (
                          <span>Layout: {hero.layout}</span>
                        )}
                        {hero.textAlignment && (
                          <span>Align: {hero.textAlignment}</span>
                        )}
                        {hero.overlayOpacity !== undefined && (
                          <span>Overlay: {hero.overlayOpacity}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                    );
                  })()
                )}

                {/* Gallery Section Preview */}
                {section.type === 'GALLERY' && (
                  <div className="grid grid-cols-3 gap-3">
                    {(section.media || []).filter((m) => m.role === 'GALLERY' || m.role === 'PRIMARY').slice(0, 6).map((m, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-ivory-100 border border-ivory-200">
                        {m.media?.url ? (
                          <img
                            src={m.media.thumbnailUrl || m.media.url}
                            alt={m.media.altText || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-charcoal-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Entity Sections */}
                {['PRODUCTS', 'COLLECTIONS', 'ARTISTS', 'CATEGORIES', 'JOURNAL', 'SANSKRIT_EDIT'].includes(section.type) && (
                  <div className="space-y-2">
                    {/* Products */}
                    {section.products && section.products.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {section.products.map((p, idx) => (
                          <Card key={idx} className="overflow-hidden border border-sand-200 hover:border-gold-300 transition-colors">
                            <div className="aspect-square bg-ivory-100">
                              {p.product?.featuredImage?.url ? (
                                <img src={p.product.featuredImage.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-charcoal-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-charcoal-800 line-clamp-1">
                                {p.product?.title || 'Product'}
                              </p>
                              {p.product?.price && (
                                <p className="text-xs text-gold-600 font-semibold mt-1">
                                  ${p.product.price.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Collections */}
                    {section.collections && section.collections.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {section.collections.map((c, idx) => (
                          <Card key={idx} className="overflow-hidden border border-sand-200">
                            <div className="aspect-video bg-ivory-100">
                              {c.collection?.coverImage?.url ? (
                                <img src={c.collection.coverImage.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FolderArchive className="w-8 h-8 text-charcoal-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-charcoal-800">{c.collection?.name || 'Collection'}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Artists */}
                    {section.artists && section.artists.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {section.artists.map((a, idx) => (
                          <Card key={idx} className="p-4 text-center border border-sand-200">
                            {a.artist?.profileImage?.url ? (
                              <img src={a.artist.profileImage.url} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-ivory-100 flex items-center justify-center mx-auto mb-2">
                                <User className="w-6 h-6 text-charcoal-300" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-charcoal-800">{a.artist?.name || 'Artist'}</p>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Categories */}
                    {section.categories && section.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {section.categories.map((c, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <Tags className="w-3.5 h-3.5" />
                            {c.category?.name || 'Category'}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Journals */}
                    {section.journals && section.journals.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {section.journals.map((j, idx) => (
                          <Card key={idx} className="overflow-hidden border border-sand-200">
                            <div className="aspect-video bg-ivory-100">
                              {j.journalPost?.featuredImage?.url ? (
                                <img src={j.journalPost.featuredImage.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-8 h-8 text-charcoal-300" />
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-medium text-charcoal-800 line-clamp-1">
                                {j.journalPost?.title || 'Journal Post'}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Sanskrit Edits */}
                    {section.sanskritEdits && section.sanskritEdits.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {section.sanskritEdits.map((s, idx) => (
                          <Card key={idx} className="p-4 border border-sand-200">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-champagne-100 flex items-center justify-center">
                                <Feather className="w-5 h-5 text-champagne-700" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-charcoal-800">
                                  {s.sanskritEditProfile?.title || 'Sanskrit Edit'}
                                </p>
                                {s.sanskritEditProfile?.product?.slug && (
                                  <p className="text-xs text-charcoal-500 font-mono">
                                    /{s.sanskritEditProfile.product.slug}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CTA Button for non-hero sections */}
                {section.type !== 'HERO' && section.ctaLabel && (
                  <div className="pt-2">
                    <Button variant="outline" className="gap-2">
                      {section.ctaLabel}
                      {section.ctaUrl && (
                        <span className="text-xs text-charcoal-400 font-mono">{section.ctaUrl}</span>
                      )}
                    </Button>
                  </div>
                )}

                {/* Section Divider */}
                <div className="pt-6">
                  <div className="border-b border-sand-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {visibleSections.length === 0 && (
          <Card className="p-12 text-center border border-dashed border-sand-300">
            <Layers className="w-12 h-12 text-charcoal-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-charcoal-600">No visible sections</p>
            <p className="text-xs text-charcoal-400 mt-1">
              Add and enable sections in the editor to see them here.
            </p>
          </Card>
        )}
      </div>
    </PageContainer>
  );
};
