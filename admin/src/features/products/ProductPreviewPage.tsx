import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProductDetail } from '../../hooks/useProducts';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/feedback/Skeleton';
import { ErrorState } from '../../components/feedback/ErrorState';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Package,
} from 'lucide-react';

export const ProductPreviewPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, error, refetch } = useProductDetail(id);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50/40 p-8 space-y-6">
        <Skeleton className="h-12 w-full max-w-4xl mx-auto" />
        <Skeleton className="h-[600px] w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-sand-50/40 p-8">
        <div className="max-w-2xl mx-auto">
          <ErrorState
            title="Product not found"
            message={(error as any)?.message || 'Could not load storefront preview.'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const mediaList = product.media && product.media.length > 0
    ? product.media
    : product.image
    ? [{ id: 'main', url: product.image, isPrimary: true, altText: product.name }]
    : [];

  const currentImage = mediaList[selectedImageIndex]?.url || product.image || product.thumbnail;

  const variants = product.variants || [];
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];

  const displayPrice = activeVariant?.price !== null && activeVariant?.price !== undefined
    ? Number(activeVariant.price)
    : Number(product.price);

  const isLowStock = product.stockQuantity <= (product.lowStockThreshold || 5);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-charcoal-900 pb-16 font-serif selection:bg-gold-500 selection:text-white">
      {/* Top Staff Preview Simulation Header */}
      <div className="bg-charcoal-950 text-white px-4 py-3 sticky top-0 z-40 shadow-lg border-b border-gold-900/40 font-sans">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
              Storefront Preview Simulation
            </span>
            <span className="text-xs text-charcoal-400 hidden sm:inline">
              (All internal costing & supplier data masked)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/admin/products/${product.id}/edit`}>
              <Button variant="outline" size="sm" className="text-xs text-white border-charcoal-700 hover:bg-charcoal-800">
                Edit Product
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/admin/products/${product.id}`)}
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Back to Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Main Luxury Storefront Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* Storefront Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-charcoal-500 font-sans uppercase tracking-widest">
          <span>Home</span>
          <span>/</span>
          <span>{product.category?.name || 'Catalog'}</span>
          <span>/</span>
          <span className="text-charcoal-900 font-medium truncate max-w-xs">{product.name || product.title}</span>
        </div>

        {/* Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-sand-100 rounded-xl overflow-hidden border border-sand-200/80 shadow-sm relative flex items-center justify-center group">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name || product.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <Package className="w-16 h-16 text-charcoal-300" />
              )}
              {product.isFeatured && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-charcoal-900 text-gold-400 text-xs font-sans uppercase tracking-widest font-semibold rounded-full shadow-md">
                    Signature Collection
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {mediaList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {mediaList.map((m, idx) => (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-gold-600 ring-2 ring-gold-400/30'
                        : 'border-sand-200 hover:border-sand-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details & Purchase Simulation */}
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-700 font-sans font-bold block mb-1">
                {product.category?.name || 'Handcrafted Masterpiece'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-normal text-charcoal-950 font-serif leading-tight">
                {product.name || product.title}
              </h1>
              <p className="text-xs text-charcoal-500 font-mono mt-1">Item Code: {activeVariant?.sku || product.sku}</p>
            </div>

            {/* Price Box */}
            <div className="border-y border-sand-200/80 py-4 flex items-baseline gap-4">
              <span className="text-2xl sm:text-3xl font-semibold text-charcoal-950">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && Number(product.compareAtPrice) > displayPrice && (
                <span className="text-base text-charcoal-400 line-through">
                  ₹{Number(product.compareAtPrice).toLocaleString('en-IN')}
                </span>
              )}
              <span className="text-xs text-charcoal-500 font-sans ml-auto">Inclusive of all luxury art taxes & insurance</span>
            </div>

            {/* Short Narrative */}
            {product.shortDescription && (
              <p className="text-sm text-charcoal-700 font-serif leading-relaxed italic">
                "{product.shortDescription}"
              </p>
            )}

            {/* Variant Picker if VARIABLE */}
            {variants.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-800 font-sans">
                  Select Artwork Edition / Size
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {variants.map((v) => {
                    const label = (v.optionValues || []).map((ov) => ov.valueName || ov.optionName).join(' - ') || v.sku;
                    const isSelected = (activeVariant?.id === v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-3 rounded-lg border text-left transition-all font-sans text-xs ${
                          isSelected
                            ? 'border-gold-600 bg-sand-100 ring-1 ring-gold-600 font-semibold text-charcoal-900'
                            : 'border-sand-300 bg-white hover:border-sand-400 text-charcoal-700'
                        }`}
                      >
                        <div className="truncate">{label}</div>
                        <div className="text-gold-700 font-serif font-bold mt-1">
                          ₹{(v.price ? Number(v.price) : Number(product.price)).toLocaleString('en-IN')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inventory / Availability Badge */}
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-sans font-medium text-emerald-800">
                {product.stockQuantity > 0
                  ? isLowStock
                    ? `Rare piece — Only ${product.stockQuantity} available`
                    : 'In Stock — Ready for white-glove dispatched delivery'
                  : 'Handcrafted on Order — Made to bespoke commission'}
              </span>
            </div>

            {/* Storefront Simulated CTA */}
            <div className="space-y-3 pt-4">
              <button
                type="button"
                disabled
                className="w-full py-3.5 bg-charcoal-900 text-gold-400 rounded-lg font-sans text-xs uppercase tracking-widest font-semibold shadow-md cursor-not-allowed opacity-90"
              >
                Add to Cart • ₹{displayPrice.toLocaleString('en-IN')}
              </button>
              <button
                type="button"
                disabled
                className="w-full py-3 border border-charcoal-900 text-charcoal-900 rounded-lg font-sans text-xs uppercase tracking-widest font-semibold hover:bg-sand-100 transition-colors cursor-not-allowed"
              >
                Inquire with Art Curator
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-sand-200/80 font-sans text-center">
              <div className="p-3 bg-sand-50/60 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-gold-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-charcoal-800 block">Certificate</span>
                <span className="text-[10px] text-charcoal-500">100% Authentic</span>
              </div>
              <div className="p-3 bg-sand-50/60 rounded-lg">
                <Truck className="w-5 h-5 text-gold-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-charcoal-800 block">Secure Shipping</span>
                <span className="text-[10px] text-charcoal-500">Insured Transit</span>
              </div>
              <div className="p-3 bg-sand-50/60 rounded-lg">
                <Sparkles className="w-5 h-5 text-gold-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-charcoal-800 block">Master Artisans</span>
                <span className="text-[10px] text-charcoal-500">Heritage Lineage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Story Section */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-sand-200 p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-normal text-charcoal-950 font-serif border-b border-sand-200 pb-3">
              Provenance & Masterpiece Story
            </h2>
            <div className="text-sm font-serif text-charcoal-800 leading-loose whitespace-pre-line max-w-4xl">
              {product.description}
            </div>
          </div>
        )}

        {/* Dynamic Specifications */}
        {product.attributes && product.attributes.length > 0 && (
          <div className="bg-white rounded-2xl border border-sand-200 p-8 shadow-xs space-y-4">
            <h2 className="text-xl font-normal text-charcoal-950 font-serif border-b border-sand-200 pb-3">
              Specifications & Materials
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {product.attributes.map((attr, i) => (
                <div key={attr.attributeId || i} className="border-b border-sand-100 pb-2">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                    {attr.attributeName || 'Specification'}
                  </dt>
                  <dd className="text-sm font-serif font-medium text-charcoal-900 mt-0.5">
                    {attr.textValue ||
                      (attr.valueId ? 'Assigned' : null) ||
                      (attr.numberValue !== null && attr.numberValue !== undefined
                        ? String(attr.numberValue)
                        : null) ||
                      (attr.booleanValue !== null && attr.booleanValue !== undefined
                        ? attr.booleanValue
                          ? 'Yes'
                          : 'No'
                        : '—')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};
