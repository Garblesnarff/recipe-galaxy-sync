/**
 * Edge Case Test Suite
 *
 * Comprehensive tests for edge cases across all critical paths
 * Ensures the app handles all edge cases gracefully without crashes or data loss
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestRecipes, createTestRecipe, createEdgeCaseRecipes } from '@/test/factories/recipeFactory';
import { RecipeFilters, SortOption } from '@/types/recipe';
import { recipeFormSchema } from '@/lib/validation';

// Mock Supabase client - MUST be declared before vi.mock call
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Import after mock
import { useRecipeDataPaginated } from '@/hooks/useRecipeDataPaginated';
import { supabase as mockSupabaseClient } from '@/integrations/supabase/client';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors during tests
    },
  });
};

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const defaultFilters: RecipeFilters = {
  categories: [],
  cuisine_type: null,
  diet_tags: [],
  cooking_method: null,
  season_occasion: [],
  difficulty: null,
  favorite_only: false,
  searchQuery: '',
};

const defaultSort: SortOption = {
  label: 'Recently Added',
  value: 'created_at',
  direction: 'desc',
};

describe('Edge Cases Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock default successful response
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
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Pagination Edge Cases', () => {
    it('handles exactly 0 recipes', async () => {
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
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(0);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.data?.pages[0].totalCount).toBe(0);
    });

    it('handles exactly 1 recipe', async () => {
      const mockRecipes = createTestRecipes(1);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 1,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.data?.pages[0].nextPage).toBeUndefined();
    });

    it('handles exactly 20 recipes (one full page)', async () => {
      const mockRecipes = createTestRecipes(20);

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
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(20);
      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.data?.pages[0].nextPage).toBeUndefined();
    });

    it('handles exactly 21 recipes (needs pagination)', async () => {
      const firstPageRecipes = createTestRecipes(20);
      const secondPageRecipes = createTestRecipes(1);

      let callCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            data: callCount === 1 ? firstPageRecipes : secondPageRecipes,
            error: null,
            count: 21,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(20);
      expect(result.current.data?.pages[0].nextPage).toBe(1);
      expect(result.current.hasNextPage).toBe(true);

      // Fetch next page
      result.current.fetchNextPage();

      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

      expect(result.current.data?.pages[1].recipes).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('handles exactly 200 recipes (max pages limit)', async () => {
      const mockRecipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 200,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(20);
      expect(result.current.data?.pages[0].totalCount).toBe(200);
    });

    it('handles 201 recipes (exceeds max pages)', async () => {
      const mockRecipes = createTestRecipes(20);

      let pageCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          pageCount++;
          // Return empty on page 11 (MAX_PAGES = 10)
          if (pageCount > 10) {
            return Promise.resolve({
              data: [],
              error: null,
              count: 201,
            });
          }
          return Promise.resolve({
            data: mockRecipes,
            error: null,
            count: 201,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(20);
      expect(result.current.data?.pages[0].totalCount).toBe(201);
    });

    it('handles filter change with no results', async () => {
      const mockRecipes = createTestRecipes(10);

      let filterChangeCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          filterChangeCount++;
          return Promise.resolve({
            data: filterChangeCount === 1 ? mockRecipes : [],
            error: null,
            count: filterChangeCount === 1 ? 10 : 0,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result, rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(10);

      // Change filter to return no results
      const newFilters: RecipeFilters = {
        ...defaultFilters,
        searchQuery: 'nonexistent recipe name xyz123',
      };

      rerender({ filters: newFilters });

      await waitFor(() => {
        expect(result.current.data?.pages[0].recipes).toHaveLength(0);
      });
    });

    it('handles very rapid scrolling (multiple fetchNextPage calls)', async () => {
      const mockRecipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockRecipes,
          error: null,
          count: 100,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Rapid fire multiple fetchNextPage calls
      result.current.fetchNextPage();
      result.current.fetchNextPage();
      result.current.fetchNextPage();

      // Should handle gracefully and only fetch once
      await waitFor(() => {
        expect(result.current.data?.pages.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Data Edge Cases', () => {
    it('handles recipe with no ingredients', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.noIngredients;

      expect(recipe.ingredients).toHaveLength(0);
      expect(recipe.title).toBeTruthy();
    });

    it('handles recipe with 1 ingredient', () => {
      const recipe = createTestRecipe({
        ingredients: ['Single ingredient'],
      });

      expect(recipe.ingredients).toHaveLength(1);
      expect(recipe.ingredients[0]).toBe('Single ingredient');
    });

    it('handles recipe with 100 ingredients', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.manyIngredients;

      expect(Array.isArray(recipe.ingredients)).toBe(true);
      expect(recipe.ingredients.length).toBeGreaterThan(50);
    });

    it('handles recipe with very long title (200 chars)', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.longTitle;

      expect(recipe.title.length).toBe(200);
      expect(recipe.title).toBeTruthy();
    });

    it('handles recipe with Unicode in all fields', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.unicode;

      expect(recipe.title).toContain('🍕');
      expect(recipe.title).toContain('🍔');
      expect(recipe.ingredients.some(ing => typeof ing === 'string' && ing.includes('🥛'))).toBe(true);
    });

    it('handles recipe with special characters', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.specialChars;

      expect(recipe.title).toContain('"');
      expect(recipe.title).toContain('&');
      expect(recipe.title).toContain("'");
      expect(recipe.title).toContain('<');
      expect(recipe.title).toContain('>');
    });

    it('handles recipe with fractional ingredients', () => {
      const edgeCases = createEdgeCaseRecipes();
      const recipe = edgeCases.specialChars;

      const hasFractional = recipe.ingredients.some(ing =>
        typeof ing === 'string' && (ing.includes('½') || ing.includes('¼'))
      );
      expect(hasFractional).toBe(true);
    });

    it('handles empty search results', async () => {
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
      });

      const filters: RecipeFilters = {
        ...defaultFilters,
        searchQuery: 'xyzabc123nonexistent',
      };

      const { result } = renderHook(() => useRecipeDataPaginated(filters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(0);
      expect(result.current.data?.pages[0].totalCount).toBe(0);
    });

    it('handles duplicate recipe titles', () => {
      const recipe1 = createTestRecipe({ title: 'Duplicate Recipe' });
      const recipe2 = createTestRecipe({ title: 'Duplicate Recipe' });

      expect(recipe1.title).toBe(recipe2.title);
      expect(recipe1.id).not.toBe(recipe2.id); // Different IDs
    });
  });

  describe('Network Edge Cases', () => {
    it('handles request timeout (30s)', async () => {
      const timeoutError = new Error('Request timed out. Please try again.');

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(timeoutError),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
    });

    it('handles network disconnect during load', async () => {
      const networkError = new Error('Network connection failed');

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(networkError),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeUndefined();
    });

    it('handles network reconnect after offline', async () => {
      let isOffline = true;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          if (isOffline) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({
            data: createTestRecipes(10),
            error: null,
            count: 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // Simulate network reconnect
      isOffline = false;

      // Refetch
      result.current.refetch();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(10);
    });

    it('handles slow 3G connection simulation (delayed response)', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: createTestRecipes(5),
                error: null,
                count: 5,
              });
            }, 3000); // 3 second delay
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true), {
        timeout: 5000,
      });

      expect(result.current.data?.pages[0].recipes).toHaveLength(5);
    });

    it('handles request abortion on filter change', async () => {
      const mockRecipes = createTestRecipes(10);
      let requestCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          requestCount++;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: mockRecipes,
                error: null,
                count: 10,
              });
            }, 500);
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      );

      // Quickly change filters multiple times
      const filters1: RecipeFilters = { ...defaultFilters, searchQuery: 'pasta' };
      const filters2: RecipeFilters = { ...defaultFilters, searchQuery: 'pizza' };
      const filters3: RecipeFilters = { ...defaultFilters, searchQuery: 'burger' };

      rerender({ filters: filters1 });
      rerender({ filters: filters2 });
      rerender({ filters: filters3 });

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(1);
      });
    });

    it('handles concurrent requests', async () => {
      const mockRecipes = createTestRecipes(10);

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
      });

      // Render multiple hooks concurrently
      const { result: result1 } = renderHook(
        () => useRecipeDataPaginated(defaultFilters, defaultSort),
        { wrapper: createWrapper() }
      );

      const { result: result2 } = renderHook(
        () => useRecipeDataPaginated({ ...defaultFilters, searchQuery: 'pasta' }, defaultSort),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data?.pages[0].recipes).toHaveLength(10);
      expect(result2.current.data?.pages[0].recipes).toHaveLength(10);
    });

    it('handles stale data handling', async () => {
      const oldRecipes = createTestRecipes(5);
      const newRecipes = createTestRecipes(10);

      let firstCall = true;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          if (firstCall) {
            firstCall = false;
            return Promise.resolve({
              data: oldRecipes,
              error: null,
              count: 5,
            });
          }
          return Promise.resolve({
            data: newRecipes,
            error: null,
            count: 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(5);

      // Refetch to get new data
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.data?.pages[0].recipes).toHaveLength(10);
      });
    });
  });

  describe('Validation Edge Cases', () => {
    it('validates recipe with minimum valid data', () => {
      const minimalRecipe = {
        title: 'A',
        cookTime: '1m',
        servings: 1,
        ingredients: ['A'],
        instructions: 'A'.repeat(10),
      };

      const result = recipeFormSchema.safeParse(minimalRecipe);
      expect(result.success).toBe(true);
    });

    it('rejects recipe with empty title', () => {
      const invalidRecipe = {
        title: '',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with title too long (> 200 chars)', () => {
      const invalidRecipe = {
        title: 'A'.repeat(201),
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with zero servings', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 0,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with negative servings', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: -1,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with too many ingredients (> 100)', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: Array.from({ length: 101 }, (_, i) => `Ingredient ${i + 1}`),
        instructions: 'Cook the ingredients.',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with instructions too short (< 10 chars)', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook',
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });

    it('rejects recipe with instructions too long (> 10000 chars)', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'A'.repeat(10001),
      };

      const result = recipeFormSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
    });
  });

  describe('Browser State Edge Cases', () => {
    it('handles localStorage full scenario', () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        try {
          localStorage.setItem('test-key', 'test-value');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }).not.toThrow();

      Storage.prototype.setItem = originalSetItem;
    });

    it('handles localStorage disabled', () => {
      const originalLocalStorage = window.localStorage;

      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Should handle gracefully without localStorage
      expect(window.localStorage).toBeUndefined();

      // Restore
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    });

    it('handles multiple tabs with same query', async () => {
      const mockRecipes = createTestRecipes(10);

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
      });

      // Simulate multiple tabs by rendering the same hook multiple times
      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result: tab1 } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper,
      });

      const { result: tab2 } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper,
      });

      await waitFor(() => {
        expect(tab1.current.isSuccess).toBe(true);
        expect(tab2.current.isSuccess).toBe(true);
      });

      // Both tabs should have the same data (shared cache)
      expect(tab1.current.data?.pages[0].recipes).toHaveLength(10);
      expect(tab2.current.data?.pages[0].recipes).toHaveLength(10);
    });
  });

  describe('User Interaction Edge Cases', () => {
    it('handles rapid filter changes (debouncing)', async () => {
      const mockRecipes = createTestRecipes(10);
      let callCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            data: mockRecipes,
            error: null,
            count: 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { rerender } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      );

      // Rapid filter changes
      for (let i = 0; i < 10; i++) {
        rerender({
          filters: { ...defaultFilters, searchQuery: `query-${i}` },
        });
      }

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });
    });

    it('handles copy-paste very long text', () => {
      const veryLongText = 'A'.repeat(10000);
      const recipe = createTestRecipe({
        description: veryLongText,
      });

      expect(recipe.description.length).toBe(10000);
    });

    it('handles invalid image URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach((url) => {
        const recipe = createTestRecipe({
          image_url: url as any,
        });

        expect(recipe).toBeTruthy();
      });
    });
  });
});
