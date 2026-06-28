/**
 * TOAST NOTIFICATIONS
 * 
 * Wrapper around react-hot-toast for consistent notifications
 */

import toast, { Toaster as HotToaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

/**
 * Success toast
 */
export function toastSuccess(message: string) {
  toast.success(message, {
    icon: <CheckCircle className="h-5 w-5" />,
    duration: 4000,
    style: {
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      border: '1px solid hsl(var(--border))',
    },
  })
}

/**
 * Error toast
 */
export function toastError(message: string) {
  toast.error(message, {
    icon: <XCircle className="h-5 w-5" />,
    duration: 6000,
    style: {
      background: 'hsl(var(--background))',
      color: 'hsl(var(--destructive))',
      border: '1px solid hsl(var(--destructive))',
    },
  })
}

/**
 * Warning toast
 */
export function toastWarning(message: string) {
  toast(message, {
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    duration: 5000,
    style: {
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      border: '1px solid hsl(var(--border))',
    },
  })
}

/**
 * Info toast
 */
export function toastInfo(message: string) {
  toast(message, {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    duration: 4000,
    style: {
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      border: '1px solid hsl(var(--border))',
    },
  })
}

/**
 * Loading toast
 */
export function toastLoading(message: string) {
  return toast.loading(message, {
    style: {
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))',
      border: '1px solid hsl(var(--border))',
    },
  })
}

/**
 * Promise toast
 * Automatically shows loading, success, or error based on promise state
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    }
  )
}

/**
 * Dismiss a specific toast
 */
export function toastDismiss(toastId: string) {
  toast.dismiss(toastId)
}

/**
 * Dismiss all toasts
 */
export function toastDismissAll() {
  toast.dismiss()
}

/**
 * Toaster component
 * Add this to your App.tsx
 */
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
}
