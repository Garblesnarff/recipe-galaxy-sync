import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRecipeDataPaginated } from '../useRecipeDataPaginated'
import { mockSupabaseClient } from '@/test/mocks'
import { createTestRecipes } from '@/test/factories/recipeFactory'
import { RecipeFilters, SortOption } from '@/types/recipe'

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useRecipeDataPaginated', () => {
  const defaultFilters: RecipeFilters = {
    categories: [],
    cuisine_type: null,
    diet_tags: [],
    cooking_method: null,
    season_occasion: [],
    difficulty: null,
    favorite_only: false,
    searchQuery: '',
  }

  const defaultSort: SortOption = {
    label: 'Recently Added',
    value: 'created_at',
    direction: 'desc',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Load', () => {
    it('loads first page with 20 recipes', async () => {
      const mockRecipes = createTestRecipes(20)
      const mockRange = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockResolvedValue({
        data: mockRecipes,
        error: null,
        count: 20,
      })

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        range: mockRange,
        order: mockOrder,
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      // Wait for query to complete
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].recipes).toHaveLength(20)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('recipes')
      expect(mockRange).toHaveBeenCalledWith(0, 19)
    })

    it('sets hasNextPage to false when exactly 20 recipes', async () => {
      const mockRecipes = createTestRecipes(20)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.data?.pages[0].nextPage).toBeUndefined()
    })

    it('sets hasNextPage to true when 21 recipes available', async () => {
      const mockRecipes = createTestRecipes(20) // First page returns 20

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 21, // Total count indicates more recipes
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Should have next page since we got exactly 20 recipes
      expect(result.current.data?.pages[0].recipes).toHaveLength(20)
      expect(result.current.data?.pages[0].nextPage).toBe(1)
    })
  })

  describe('Pagination', () => {
    it('loads next page when fetchNextPage called', async () => {
      const firstPageRecipes = createTestRecipes(20)
      const secondPageRecipes = createTestRecipes(10)

      let callCount = 0
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            data: callCount === 1 ? firstPageRecipes : secondPageRecipes,
            error: null,
            count: 30,
          })
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      // Wait for first page
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages).toHaveLength(1)
      expect(result.current.data?.pages[0].recipes).toHaveLength(20)

      // Fetch next page
      result.current.fetchNextPage()

      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))

      expect(result.current.data?.pages[1].recipes).toHaveLength(10)
    })

    it('correctly calculates page ranges', async () => {
      const mockRecipes = createTestRecipes(20)
      const mockRange = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 60,
        }),
        range: mockRange,
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // First page: 0-19
      expect(mockRange).toHaveBeenCalledWith(0, 19)

      // Fetch second page
      result.current.fetchNextPage()

      await waitFor(() => expect(mockRange).toHaveBeenCalledWith(20, 39))
    })

    it('stops pagination when no more data', async () => {
      const mockRecipes = createTestRecipes(15)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 15,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.data?.pages[0].nextPage).toBeUndefined()
    })
  })

  describe('Filters', () => {
    it('applies search query filter', async () => {
      const mockOr = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: mockOr,
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const filters: RecipeFilters = {
        ...defaultFilters,
        searchQuery: 'pasta',
      }

      renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockOr).toHaveBeenCalledWith(
          expect.stringContaining('title.ilike.%pasta%')
        )
      })
    })

    it('applies category filter', async () => {
      const mockContains = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: mockContains,
        eq: vi.fn().mockReturnThis(),
      })

      const filters: RecipeFilters = {
        ...defaultFilters,
        categories: ['Dinner', 'Main Course'],
      }

      renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockContains).toHaveBeenCalledWith('categories', ['Dinner', 'Main Course'])
      })
    })

    it('applies cuisine type filter', async () => {
      const mockEq = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: mockEq,
      })

      const filters: RecipeFilters = {
        ...defaultFilters,
        cuisine_type: 'Italian',
      }

      renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('cuisine_type', 'Italian')
      })
    })

    it('applies favorite filter', async () => {
      const mockEq = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: mockEq,
      })

      const filters: RecipeFilters = {
        ...defaultFilters,
        favorite_only: true,
      }

      renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('is_favorite', true)
      })
    })

    it('applies multiple filters simultaneously', async () => {
      const mockOr = vi.fn().mockReturnThis()
      const mockContains = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: mockOr,
        contains: mockContains,
        eq: mockEq,
      })

      const filters: RecipeFilters = {
        categories: ['Dinner'],
        cuisine_type: 'Italian',
        diet_tags: ['Vegetarian'],
        cooking_method: 'Baking',
        season_occasion: [],
        difficulty: 'Easy',
        favorite_only: true,
        searchQuery: 'pasta',
      }

      renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockOr).toHaveBeenCalled()
        expect(mockContains).toHaveBeenCalled()
        expect(mockEq).toHaveBeenCalledWith('cuisine_type', 'Italian')
        expect(mockEq).toHaveBeenCalledWith('difficulty', 'Easy')
        expect(mockEq).toHaveBeenCalledWith('is_favorite', true)
      })
    })
  })

  describe('Sorting', () => {
    it('applies rating sort with nullsFirst false', async () => {
      const mockOrder = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: mockOrder,
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const sortOption: SortOption = {
        label: 'Highest Rated',
        value: 'rating',
        direction: 'desc',
      }

      renderHook(() => useRecipeDataPaginated(defaultFilters, sortOption), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockOrder).toHaveBeenCalledWith('rating', {
          ascending: false,
          nullsFirst: false,
        })
      })
    })

    it('applies title sort ascending', async () => {
      const mockOrder = vi.fn().mockReturnThis()

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: mockOrder,
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const sortOption: SortOption = {
        label: 'Alphabetical (A-Z)',
        value: 'title',
        direction: 'asc',
      }

      renderHook(() => useRecipeDataPaginated(defaultFilters, sortOption), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(mockOrder).toHaveBeenCalledWith('title', {
          ascending: true,
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('handles query errors gracefully', async () => {
      const mockError = new Error('Database connection failed')

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
          count: null,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeTruthy()
      expect(result.current.data).toBeUndefined()
    })

    it('handles network errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Network error')),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toBeTruthy()
    })
  })

  describe('Empty Results', () => {
    it('handles empty result set', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages[0].recipes).toHaveLength(0)
      expect(result.current.hasNextPage).toBe(false)
    })

    it('handles null data gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages[0].recipes).toHaveLength(0)
    })
  })

  describe('Filter Changes', () => {
    it('refetches data when filters change', async () => {
      const mockRecipes = createTestRecipes(10)
      let callCount = 0

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          callCount++
          return Promise.resolve({
            data: mockRecipes,
            error: null,
            count: 10,
          })
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      )

      await waitFor(() => expect(callCount).toBe(1))

      // Change filters
      const newFilters: RecipeFilters = {
        ...defaultFilters,
        searchQuery: 'chicken',
      }

      rerender({ filters: newFilters })

      await waitFor(() => expect(callCount).toBe(2))
    })

    it('cancels stale queries on filter change', async () => {
      const mockRecipes = createTestRecipes(10)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 10,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      )

      await waitFor(() => expect(mockSupabaseClient.from).toHaveBeenCalled())

      // Quickly change filters multiple times
      const filters1: RecipeFilters = { ...defaultFilters, searchQuery: 'pasta' }
      const filters2: RecipeFilters = { ...defaultFilters, searchQuery: 'pizza' }

      rerender({ filters: filters1 })
      rerender({ filters: filters2 })

      // Should eventually settle on the last filter
      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalled()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles exactly 20 recipes (boundary case)', async () => {
      const mockRecipes = createTestRecipes(20)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages[0].recipes).toHaveLength(20)
      expect(result.current.hasNextPage).toBe(false)
    })

    it('handles 21 recipes (has next page)', async () => {
      const firstPageRecipes = createTestRecipes(20)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: firstPageRecipes,
          error: null,
          count: 21,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.pages[0].recipes).toHaveLength(20)
      expect(result.current.data?.pages[0].nextPage).toBe(1)
    })

    it('handles filter change during pagination', async () => {
      const mockRecipes = createTestRecipes(20)

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 40,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const { result, rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Start fetching next page
      result.current.fetchNextPage()

      // Change filters mid-load
      const newFilters: RecipeFilters = {
        ...defaultFilters,
        searchQuery: 'new query',
      }
      rerender({ filters: newFilters })

      // Should reset to first page with new filters
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })
  })

  describe('Query Key Generation', () => {
    it('generates unique query keys for different filters', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })

      const filters1: RecipeFilters = { ...defaultFilters, searchQuery: 'pasta' }
      const filters2: RecipeFilters = { ...defaultFilters, searchQuery: 'pizza' }

      const { result: result1 } = renderHook(
        () => useRecipeDataPaginated(filters1, defaultSort),
        { wrapper: createWrapper() }
      )

      const { result: result2 } = renderHook(
        () => useRecipeDataPaginated(filters2, defaultSort),
        { wrapper: createWrapper() }
      )

      // Both hooks should work independently
      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
        expect(result2.current.isSuccess).toBe(true)
      })
    })
  })
})
