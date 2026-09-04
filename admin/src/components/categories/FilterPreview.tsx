import React from 'react';
import { useCategoryPublicFilters } from '../../hooks/useCategories';
import { CategoryPublicFilterFacet, CategoryFilterFacetValue } from '../../lib/api/categories';
import { Skeleton } from '../feedback/Skeleton';
import { Filter, CheckSquare, Sliders, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface FilterPreviewProps {
  categorySlug: string;
  className?: string;
}

export const FilterPreview: React.FC<FilterPreviewProps> = ({ categorySlug, className = '' }) => {
  const { data: filterResponse, isLoading, isError, error } = useCategoryPublicFilters(
    categorySlug,
    Boolean(categorySlug)
  );

  if (isLoading) {
    return (
      <div className={`p-6 bg-sand-50/50 rounded-lg border border-sand-200 space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="w-48 h-5" />
        </div>
        <div className="space-y-3 pt-2">
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-8" />
          <Skeleton className="w-full h-8" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`p-6 bg-sand-50 rounded-lg border border-sand-200 text-center ${className}`}>
        <AlertCircle className="w-6 h-6 mx-auto text-amber-500 mb-2" />
        <p className="text-sm font-medium text-charcoal-700 font-serif">
          Unable to preview storefront filters
        </p>
        <p className="text-xs text-charcoal-500 mt-1 font-sans">
          {(error as any)?.message || 'Make sure the category exists and has a valid slug.'}
        </p>
      </div>
    );
  }

  const facets: CategoryPublicFilterFacet[] = filterResponse || [];

  if (facets.length === 0) {
    return (
      <div className={`p-8 bg-sand-50/70 rounded-lg border border-dashed border-sand-300 text-center ${className}`}>
        <Filter className="w-8 h-8 mx-auto text-charcoal-400 mb-2 opacity-60" />
        <h4 className="text-sm font-medium text-charcoal-800 font-serif">
          No Storefront Filters Configured
        </h4>
        <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto font-sans">
          Assign filterable attributes to this category in the "Attributes & Filters" tab to display dynamic facets for shoppers.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-sand-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header bar */}
      <div className="bg-sand-100/60 px-4 py-3 border-b border-sand-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-gold-600" />
          <h3 className="text-sm font-serif font-semibold text-charcoal-900">
            Storefront Filter Preview
          </h3>
        </div>
        <Badge variant="champagne" size="sm">
          {facets.length} {facets.length === 1 ? 'Facet' : 'Facets'} Active
        </Badge>
      </div>

      <div className="p-4 space-y-6">
        {facets.map((facet) => (
          <div key={facet.attributeId || facet.slug} className="border-b border-sand-100 last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-700 font-sans">
                {facet.name}
              </span>
              <span className="text-[10px] text-charcoal-400 font-mono uppercase bg-sand-100 px-1.5 py-0.5 rounded">
                {facet.type}
              </span>
            </div>

            {/* Range / Number facet */}
            {facet.type === 'RANGE' || facet.type === 'NUMBER' ? (
              <div className="space-y-1.5 py-1">
                <div className="flex items-center justify-between text-xs text-charcoal-600 font-mono">
                  <span>Min: {facet.range?.min ?? 0}</span>
                  <span>Max: {facet.range?.max ?? 1000}</span>
                </div>
                <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gold-500 h-full w-2/3" />
                </div>
              </div>
            ) : (
              /* Values list facet */
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {facet.values && facet.values.length > 0 ? (
                  facet.values.map((v: CategoryFilterFacetValue) => (
                    <div
                      key={v.id || v.slug}
                      className="flex items-center justify-between py-1 px-2 rounded text-xs hover:bg-sand-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <CheckSquare className="w-3.5 h-3.5 text-charcoal-300" />
                        <span className="text-charcoal-800 truncate font-serif">{v.name}</span>
                      </div>
                      {typeof v.count === 'number' && (
                        <span className="text-[11px] text-charcoal-400 font-mono bg-sand-100 px-1.5 py-0.2 rounded">
                          {v.count}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-charcoal-400 italic py-1 font-sans">
                    No discrete values registered yet.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
