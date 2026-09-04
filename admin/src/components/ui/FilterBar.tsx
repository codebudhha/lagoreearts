import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Select, SelectOption } from './Select';
import { Button } from './Button';
import { cn } from '../../utils/cn';

export interface FilterSelectConfig {
  key: string;
  label?: string;
  placeholder?: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
}

export interface FilterBarProps {
  // Search
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  // Select Filters
  selectFilters?: FilterSelectConfig[];
  // Clear Action
  onReset?: () => void;
  hasActiveFilters?: boolean;
  // Custom right-side extra actions
  extraActions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  selectFilters = [],
  onReset,
  hasActiveFilters = false,
  extraActions,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 bg-white rounded-xl border border-ivory-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
        {/* Search Field */}
        {onSearchChange !== undefined && searchValue !== undefined && (
          <div className="w-full sm:w-72 flex-shrink-0">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              size="sm"
            />
          </div>
        )}

        {/* Filter Selects */}
        {selectFilters.map((filter) => (
          <div key={filter.key} className="w-full sm:w-44 flex-shrink-0">
            <Select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              placeholder={filter.placeholder || filter.label || 'Select...'}
              className="py-1.5 text-xs bg-ivory-50/50"
              options={filter.options}
            />
          </div>
        ))}

        {/* Reset button */}
        {hasActiveFilters && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-xs text-charcoal-500 hover:text-charcoal-800"
          >
            Reset
          </Button>
        )}
      </div>

      {/* Extra Action Slot */}
      {extraActions && (
        <div className="flex items-center gap-2.5 ml-auto flex-shrink-0">{extraActions}</div>
      )}
    </div>
  );
};
