
import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult, queries } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { createTestRecipe, createTestRecipes, createTestIngredient } from './factories/recipeFactory'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Use @testing-library/react's default query set for generic parameter
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions<typeof queries, HTMLElement>, 'queries'>,
): RenderResult<typeof queries, HTMLElement> {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

/**
 * Create a custom QueryClient for testing with specific options
 */
export const createTestQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
        ...options,
      },
      mutations: {
        retry: false,
        ...options,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors during tests
    },
  })
}

/**
 * Render hook with Query Client provider
 */
export const createWrapper = () => {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

/**
 * Wait for a specific amount of time (useful for async testing)
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock file for file upload testing
 */
export const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  const file = new File(['test'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Mock URL for URL.createObjectURL
 */
export const mockCreateObjectURL = () => {
  global.URL.createObjectURL = vi.fn(() => 'mock-url') as any
  global.URL.revokeObjectURL = vi.fn() as any
}

// Import vi for mocking
import { vi } from 'vitest'

export * from '@testing-library/react'
export { customRender as render }
export { createTestRecipe, createTestRecipes, createTestIngredient }

