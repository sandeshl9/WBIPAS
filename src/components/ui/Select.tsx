/**
 * SELECT - Volume 6 Component
 * 
 * Dropdown select with validation support
 */

import React from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  label?: string
  required?: boolean
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      error,
      label,
      required,
      placeholder,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-error-600 ml-1">*</span>}
          </label>
        )}

        {/* Select Input */}
        <select
          ref={ref}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn(
            'input',
            error && 'border-error-600 focus:ring-error-600',
            disabled && 'bg-muted cursor-not-allowed',
            className
          )}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-error-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
