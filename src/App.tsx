import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from './lib/toast'
import AppRoutes from './routes'

// Create a React Query client with optimized configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.PROD,
      // Retry failed requests once
      retry: 1,
      // Consider data stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Show errors in the UI
      throwOnError: false,
    },
    mutations: {
      // Don't retry mutations automatically
      retry: 0,
      // Show errors in the UI
      throwOnError: false,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
              <Toaster />
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
        {/* React Query DevTools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
