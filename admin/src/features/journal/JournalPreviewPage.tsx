import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useJournalPost } from '../../hooks/useJournal';
import {
  Monitor,
  Smartphone,
  Edit2,
  Calendar,
  Clock,
  User,
  Package,
} from 'lucide-react';

export const JournalPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  const { data: post, isLoading, isError, error, refetch } = useJournalPost(id || '');

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </PageContainer>
    );
  }

  if (isError || !post) {
    return (
      <PageContainer>
        <ErrorState
          title="Preview unavailable"
          message={(error as Error)?.message || 'Failed to load article for preview.'}
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Storefront Preview: ${post.title}`}
        description="Simulate the customer-facing editorial article layout, typography, and shoppable product pairings."
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Journal & Blog', path: '/admin/journal' },
          { label: post.title, path: `/admin/journal/${post.id}` },
          { label: 'Preview' },
        ]}
      >
        <div className="flex items-center gap-3">
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
            onClick={() => navigate(`/admin/journal/${post.id}/edit`)}
            className="gap-1.5"
          >
            <Edit2 className="w-4 h-4" />
            Edit Article
          </Button>
        </div>
      </PageHeader>

      <div className="flex justify-center p-6 bg-neutral-100 dark:bg-neutral-950 rounded-xl min-h-[700px] border border-neutral-200 dark:border-neutral-800">
        <div
          className={`w-full ${
            viewport === 'mobile' ? 'max-w-md' : 'max-w-4xl'
          } transition-all duration-300 bg-white dark:bg-neutral-900 shadow-lg rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800`}
        >
          {/* Storefront Mini Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="font-serif font-bold text-sm tracking-widest text-neutral-900 dark:text-neutral-100">
              LAGOREE JOURNAL
            </span>
            <span className="text-xs text-neutral-400">
              {post.category?.name || post.type}
            </span>
          </div>

          {/* Article Hero */}
          <div className="p-6 sm:p-10 space-y-6">
            <div className="space-y-3 text-center">
              <Badge variant="champagne" size="sm">
                {post.type}
              </Badge>
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto italic">
                  "{post.excerpt}"
                </p>
              )}

              {/* Author & Meta row */}
              <div className="flex items-center justify-center gap-4 text-xs text-neutral-500 pt-2 flex-wrap">
                {post.author && (
                  <span className="flex items-center gap-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                    <User className="w-3.5 h-3.5 text-gold-600" />
                    {post.author.name}
                  </span>
                )}
                {post.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                )}
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTime} min read
                  </span>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage?.url && (
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm">
                <img
                  src={post.coverImage.url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Prose Body */}
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-serif text-neutral-800 dark:text-neutral-200 pt-4">
              {post.content}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                {post.tags.map((t) => (
                  <span
                    key={t.tagId}
                    className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300"
                  >
                    #{t.tag?.name || t.tagId}
                  </span>
                ))}
              </div>
            )}

            {/* Shoppable Products Section in Preview */}
            {post.products && post.products.length > 0 && (
              <div className="p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-4 mt-8">
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-neutral-900 dark:text-neutral-100">
                    Featured Artifacts from this Essay
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Explore curated pieces discussed in this story.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {post.products.map((p) => (
                    <div
                      key={p.productId}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-white dark:bg-neutral-800 space-y-2"
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
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {p.product?.title || 'Product'}
                      </p>
                      <p className="text-xs text-gold-600 font-bold font-mono">
                        {p.product?.price ? `₹${p.product.price}` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
