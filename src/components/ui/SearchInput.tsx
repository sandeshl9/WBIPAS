/**
 * SEARCH INPUT - Volume 6 Component
 * 
 * Search input with icon and clear button
 */

import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onValueChange,
  placeholder = 'Search...',
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'input pl-10 pr-10',
          value && 'pr-10'
        )}
        {...props}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
