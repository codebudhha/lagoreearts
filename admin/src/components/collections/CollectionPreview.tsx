import React, { useState } from 'react';
import { AdminCollection } from '../../lib/api/collections';
import { AdminProduct } from '../../lib/api/products';
import { CollectionStatusBadge } from './CollectionStatusBadge';
import { CollectionTypeBadge } from './CollectionTypeBadge';
import { Monitor, Smartphone, Sparkles, Package } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface CollectionPreviewProps {
  collection: Partial<AdminCollection>;
  products?: AdminProduct[];
  productTotal?: number;
}

export const CollectionPreview: React.FC<CollectionPreviewProps> = ({
  collection,
  products = [],
  productTotal = 0,
}) => {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const name = collection.name || 'Untitled Collection';
  const heroTitle = collection.heroTitle || name;
  const heroDescription =
    collection.heroDescription || collection.shortDescription || collection.description || '';
  const bannerImage = collection.bannerImage || collection.image;

  return (
    <div className="space-y-4 font-sans">
      {/* Viewport Toolbar */}
      <div className="flex items-center justify-between bg-sand-50 p-3 rounded-lg border border-sand-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
            Storefront Simulation
          </span>
          <CollectionStatusBadge
            status={collection.status || 'ACTIVE'}
            isFeatured={Boolean(collection.isFeatured)}
          />
          <CollectionTypeBadge type={collection.type || 'MANUAL'} />
        </div>

        <div className="flex items-center gap-1 bg-white border border-sand-200 rounded-lg p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              deviceView === 'desktop'
                ? 'bg-charcoal-900 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-sand-100'
            }`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              deviceView === 'mobile'
                ? 'bg-charcoal-900 text-white shadow-xs'
                : 'text-charcoal-600 hover:bg-sand-100'
            }`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Storefront Frame Preview */}
      <div className="flex justify-center bg-sand-100 p-4 sm:p-8 rounded-xl border border-sand-300 overflow-hidden">
        <div
          className={`bg-white rounded-xl shadow-lg border border-sand-300 overflow-hidden transition-all duration-300 ${
            deviceView === 'desktop' ? 'w-full max-w-5xl' : 'w-full max-w-sm'
          }`}
        >
          {/* Simulated Browser Bar */}
          <div className="bg-sand-100/80 px-4 py-2 border-b border-sand-200 flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sand-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-sand-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-sand-300" />
            </div>
            <div className="bg-white px-3 py-1 rounded text-xs text-charcoal-600 truncate flex-1 border border-sand-200 font-mono">
              https://lagoreearts.com/collections/{collection.slug || 'collection-slug'}
            </div>
          </div>

          {/* Simulated Collection Hero Banner */}
          <div className="relative overflow-hidden bg-charcoal-950 text-sand-50">
            {bannerImage ? (
              <div className="absolute inset-0">
                <img
                  src={bannerImage}
                  alt={heroTitle}
                  className="w-full h-full object-cover opacity-40 mix-blend-luminosity scale-105 filter blur-[0.5px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-charcoal-950 via-charcoal-900 to-charcoal-800 opacity-95" />
            )}

            <div
              className={`relative z-10 text-center py-12 px-6 sm:py-16 ${
                deviceView === 'mobile' ? 'py-8 px-4' : ''
              }`}
            >
              {collection.isFeatured && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 text-xs font-serif uppercase tracking-widest mb-3">
                  <Sparkles className="w-3 h-3" />
                  Curated Collection
                </div>
              )}
              <h1
                className={`font-serif tracking-wide text-sand-50 max-w-2xl mx-auto leading-tight ${
                  deviceView === 'mobile' ? 'text-2xl' : 'text-3xl sm:text-4xl'
                }`}
              >
                {heroTitle}
              </h1>
              {heroDescription && (
                <p
                  className={`mt-3 text-sand-200/90 font-serif max-w-xl mx-auto line-clamp-3 ${
                    deviceView === 'mobile' ? 'text-xs' : 'text-sm sm:text-base'
                  }`}
                >
                  {heroDescription}
                </p>
              )}

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-sand-400 font-mono">
                <span>{productTotal || products.length} Artworks</span>
                <span>•</span>
                <span>Lagoree Heritage Curation</span>
              </div>
            </div>
          </div>

          {/* Collection Catalog Grid */}
          <div className="p-6 bg-sand-50/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-charcoal-700 uppercase tracking-wider">
                Exhibition Catalog ({productTotal || products.length} Pieces)
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center rounded-lg border border-dashed border-sand-300 bg-white p-6">
                <Package className="w-8 h-8 text-charcoal-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-charcoal-700">No products assigned yet</p>
                <p className="text-xs text-charcoal-500 mt-1">
                  Assign products to this collection to display them in the storefront curation.
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  deviceView === 'mobile'
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                }`}
              >
                {products.slice(0, 8).map((product) => {
                  const productImg =
                    product.image ||
                    product.thumbnail ||
                    (product.media && product.media[0]?.url);
                  const productTitle = product.name || product.title || 'Untitled Artwork';

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg border border-sand-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-[4/5] bg-sand-100 relative overflow-hidden">
                        {productImg ? (
                          <img
                            src={productImg}
                            alt={productTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-300 text-xs">
                            No Image
                          </div>
                        )}
                        {product.isFeatured && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="champagne" size="sm">
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-medium text-charcoal-900 truncate mt-0.5">
                          {productTitle}
                        </h4>
                        <p className="text-xs font-mono font-semibold text-gold-700 mt-1">
                          ₹{Number(product.price || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
