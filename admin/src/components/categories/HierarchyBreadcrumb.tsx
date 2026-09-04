import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Folder } from 'lucide-react';
import { AdminCategory } from '../../lib/api/categories';

export interface HierarchyBreadcrumbProps {
  ancestors: AdminCategory[];
  currentName?: string;
  className?: string;
}

export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({
  ancestors = [],
  currentName,
  className = '',
}) => {
  if (!ancestors.length && !currentName) {
    return null;
  }

  return (
    <nav aria-label="Category hierarchy" className={`flex items-center flex-wrap text-xs text-charcoal-500 ${className}`}>
      <Link
        to="/admin/categories"
        className="inline-flex items-center text-charcoal-500 hover:text-gold-600 transition-colors font-medium"
      >
        <Folder className="w-3.5 h-3.5 mr-1" />
        Categories
      </Link>

      {ancestors.map((cat) => (
        <React.Fragment key={cat.id}>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-charcoal-400 flex-shrink-0" />
          <Link
            to={`/admin/categories/${cat.id}`}
            className="hover:text-gold-600 transition-colors truncate max-w-[150px]"
            title={cat.name}
          >
            {cat.name}
          </Link>
        </React.Fragment>
      ))}

      {currentName && (
        <>
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-charcoal-400 flex-shrink-0" />
          <span className="font-semibold text-charcoal-900 truncate max-w-[200px]" title={currentName}>
            {currentName}
          </span>
        </>
      )}
    </nav>
  );
};
