import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult, Queries } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

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

// Remove the explicit type annotation for customRender to resolve TS2322
const customRender: (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => RenderResult<Queries, HTMLElement, HTMLElement> = (
  ui,
  options
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
