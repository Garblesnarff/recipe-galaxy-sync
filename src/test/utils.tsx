
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

// Explicitly type using the signature from @testing-library/react's render
function customRender<
  Q extends Queries = typeof import('@testing-library/dom').queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
>(
  ui: React.ReactElement,
  options?: Omit<RenderOptions<Q, Container>, 'queries'>,
): RenderResult<Q, Container, BaseElement> {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
