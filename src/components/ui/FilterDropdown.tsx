/**
 * FILTER DROPDOWN - Volume 6 Component
 * 
 * Multi-select filter dropdown
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from './Badge'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDropdownProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  className?: string
}

export function FilterDropdown({
  label,
  options,
  selected,
  onSelectedChange,
  className,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter((v) => v !== value))
    } else {
      onSelectedChange([...selected, value])
    }
  }

  const clearAll = () => {
    onSelectedChange([])
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 h-10 rounded-lg border transition-colors',
          'hover:bg-accent focus-ring',
          selected.length > 0
            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
            : 'border-border bg-background'
        )}
      >
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
        {selected.length > 0 && (
          <Badge variant="info" size="sm">
            {selected.length}
          </Badge>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">{label}</span>
              {selected.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Options */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {options.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-sm text-foreground">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                )
              })}
            </div>

            {options.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No options available
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
