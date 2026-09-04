import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  size = 'md',
  className,
  ...props
}) => {
  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
        <Search className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-white border border-ivory-300 rounded-lg text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-champagne-500 focus:ring-2 focus:ring-champagne-200 transition-colors',
          size === 'sm' ? 'pl-8 pr-8 py-1.5 text-xs' : 'pl-9 pr-9 py-2 text-sm',
          className
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-600 transition-colors"
          aria-label="Clear search"
        >
          <X className={cn(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        </button>
      )}
    </div>
  );
};
