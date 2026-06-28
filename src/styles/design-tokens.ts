/**
 * DESIGN TOKENS - Volume 5 Design System
 * 
 * Centralized design tokens for consistent styling across the application.
 * Inspired by: Linear, Notion, Stripe, Vercel
 * 
 * Version: 1.0.0
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Primary Brand Color
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Primary
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Status Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#EAB308',
    600: '#CA8A04',
    700: '#A16207',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  info: {
    50: '#F0F9FF',
    100: '#E0F2FE',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
  },

  // Capacity Status Colors
  capacity: {
    low: '#22C55E',      // 0-50% Green
    medium: '#EAB308',   // 51-80% Yellow
    high: '#F97316',     // 81-99% Orange
    full: '#EF4444',     // 100% Red
  },

  // Light Theme
  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
    },
    border: '#E2E8F0',
    hover: '#F1F5F9',
    muted: '#F8FAFC',
  },

  // Dark Theme
  dark: {
    background: '#09090B',
    card: '#18181B',
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
      tertiary: '#71717A',
    },
    border: '#27272A',
    hover: '#27272A',
    muted: '#18181B',
  },

  // Gray Scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },

  fontSize: {
    xs: '12px',      // Caption
    sm: '14px',      // Body, Table Header
    base: '14px',    // Body (default)
    lg: '18px',      // Card Title
    xl: '24px',      // Section Heading
    '2xl': '32px',   // Page Title
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.01em',
  },
} as const

// ============================================================================
// SPACING (8px Grid)
// ============================================================================

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '10px',      // Buttons, Inputs
  xl: '16px',      // Cards, Charts
  '2xl': '20px',   // Dialogs
  full: '9999px',  // Pills, Avatars
} as const

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

// ============================================================================
// Z-INDEX
// ============================================================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  commandPalette: 1090,
} as const

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Framer Motion Variants
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// LAYOUT
// ============================================================================

export const layout = {
  sidebar: {
    collapsed: '80px',
    expanded: '260px',
  },

  header: {
    height: '64px',
  },

  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
  },
} as const

// ============================================================================
// COMPONENT SPECIFIC
// ============================================================================

export const components = {
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: {
      sm: '8px 12px',
      md: '10px 16px',
      lg: '12px 24px',
    },
  },

  input: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
    },
    padding: '10px 12px',
  },

  card: {
    padding: spacing[6], // 24px
    borderRadius: borderRadius.xl, // 16px
  },

  table: {
    rowHeight: '48px',
    headerHeight: '40px',
  },

  avatar: {
    size: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '64px',
    },
  },
} as const

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const shortcuts = {
  commandPalette: ['ctrl+k', 'cmd+k'],
  newProject: ['n'],
  newAssociate: ['a'],
  recommend: ['r'],
  dashboard: ['d'],
  closeModal: ['escape'],
  save: ['ctrl+s', 'cmd+s'],
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get capacity color based on utilization percentage
 */
export function getCapacityColor(percentage: number): string {
  if (percentage <= 50) return colors.capacity.low
  if (percentage <= 80) return colors.capacity.medium
  if (percentage < 100) return colors.capacity.high
  return colors.capacity.full
}

/**
 * Get capacity status text
 */
export function getCapacityStatus(percentage: number): string {
  if (percentage <= 50) return 'Low'
  if (percentage <= 80) return 'Medium'
  if (percentage < 100) return 'High'
  return 'Full'
}

/**
 * Format spacing value
 */
export function getSpacing(...values: Array<keyof typeof spacing>): string {
  return values.map(v => spacing[v]).join(' ')
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Color = keyof typeof colors
export type Spacing = keyof typeof spacing
export type BorderRadius = keyof typeof borderRadius
export type Shadow = keyof typeof shadows
export type ZIndex = keyof typeof zIndex
