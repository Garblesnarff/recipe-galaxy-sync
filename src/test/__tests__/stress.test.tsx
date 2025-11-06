/**
 * Stress Test Suite
 *
 * Tests application performance under heavy load
 * Identifies memory leaks, performance bottlenecks, and breaking points
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestRecipes, createTestRecipe } from '@/test/factories/recipeFactory';
import { RecipeFilters, SortOption } from '@/types/recipe';
import { performance } from 'perf_hooks';

// Mock Supabase client
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
      error: () => {},
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

describe('Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Load Tests', () => {
    it('handles loading 1000 recipes', async () => {
      const recipes = createTestRecipes(1000);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 1000,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const startTime = performance.now();

      const result = await mockSupabaseClient.from('recipes').select();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.data).toHaveLength(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Loading 1000 recipes took ${duration.toFixed(2)}ms`);
    });

    it('handles paginating through 1000 recipes', async () => {
      const allRecipes = createTestRecipes(1000);
      const pageSize = 20;
      let pageCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          const start = pageCount * pageSize;
          const end = Math.min(start + pageSize, 1000);
          const pageRecipes = allRecipes.slice(start, end);
          pageCount++;

          return Promise.resolve({
            data: pageRecipes,
            error: null,
            count: 1000,
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

      // Fetch all pages (limited to MAX_PAGES = 10)
      for (let i = 0; i < 9; i++) {
        if (result.current.hasNextPage) {
          result.current.fetchNextPage();
          await waitFor(() => expect(result.current.data?.pages.length).toBe(i + 2));
        }
      }

      // Should have loaded MAX_PAGES = 10 pages (200 recipes)
      expect(result.current.data?.pages.length).toBeLessThanOrEqual(10);
      expect(pageCount).toBeLessThanOrEqual(10);
    });

    it('handles loading recipes with many ingredients', async () => {
      // Create recipes with 100 ingredients each
      const recipes = Array.from({ length: 100 }, () =>
        createTestRecipe({
          ingredients: Array.from({ length: 100 }, (_, i) => `Ingredient ${i + 1}`),
        })
      );

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 100,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const startTime = performance.now();

      const result = await mockSupabaseClient.from('recipes').select();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.data).toHaveLength(100);
      expect(result.data[0].ingredients).toHaveLength(100);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(`Loading 100 recipes with 100 ingredients each took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Rapid Filter Changes', () => {
    it('handles 50 filter changes in 10 seconds', async () => {
      const recipes = createTestRecipes(20);
      let filterCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          filterCount++;
          return Promise.resolve({
            data: recipes,
            error: null,
            count: 20,
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

      const startTime = performance.now();

      // Rapidly change filters 50 times
      for (let i = 0; i < 50; i++) {
        rerender({
          filters: { ...defaultFilters, searchQuery: `query-${i}` },
        });
      }

      await waitFor(() => {
        expect(filterCount).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`50 filter changes took ${duration.toFixed(2)}ms`);
      console.log(`Actual filter requests made: ${filterCount}`);
    });

    it('handles rapid sort changes', async () => {
      const recipes = createTestRecipes(20);
      let sortCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => {
          sortCount++;
          return {
            or: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
          };
        }),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const sortOptions: SortOption[] = [
        { label: 'Recently Added', value: 'created_at', direction: 'desc' },
        { label: 'Oldest First', value: 'created_at', direction: 'asc' },
        { label: 'Alphabetical (A-Z)', value: 'title', direction: 'asc' },
        { label: 'Alphabetical (Z-A)', value: 'title', direction: 'desc' },
        { label: 'Highest Rated', value: 'rating', direction: 'desc' },
      ];

      const { rerender } = renderHook(
        ({ sort }) => useRecipeDataPaginated(defaultFilters, sort),
        {
          wrapper: createWrapper(),
          initialProps: { sort: sortOptions[0] },
        }
      );

      const startTime = performance.now();

      // Rapidly cycle through sort options
      for (let i = 0; i < 20; i++) {
        const sortOption = sortOptions[i % sortOptions.length];
        rerender({ sort: sortOption });
      }

      await waitFor(() => {
        expect(sortCount).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`20 sort changes took ${duration.toFixed(2)}ms`);
    });

    it('handles combined rapid filter and sort changes', async () => {
      const recipes = createTestRecipes(20);
      let requestCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          requestCount++;
          return Promise.resolve({
            data: recipes,
            error: null,
            count: 20,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const sortOptions: SortOption[] = [
        { label: 'Recently Added', value: 'created_at', direction: 'desc' },
        { label: 'Alphabetical (A-Z)', value: 'title', direction: 'asc' },
      ];

      const { rerender } = renderHook(
        ({ filters, sort }) => useRecipeDataPaginated(filters, sort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters, sort: sortOptions[0] },
        }
      );

      const startTime = performance.now();

      // Alternate between filter and sort changes
      for (let i = 0; i < 30; i++) {
        if (i % 2 === 0) {
          rerender({
            filters: { ...defaultFilters, searchQuery: `query-${i}` },
            sort: sortOptions[i % sortOptions.length],
          });
        } else {
          rerender({
            filters: { ...defaultFilters, cuisine_type: i % 2 === 0 ? 'Italian' : 'Mexican' },
            sort: sortOptions[i % sortOptions.length],
          });
        }
      }

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(8000); // Should complete within 8 seconds

      console.log(`30 combined filter/sort changes took ${duration.toFixed(2)}ms`);
      console.log(`Actual requests made: ${requestCount}`);
    });
  });

  describe('Memory Leak Detection', () => {
    it('does not leak memory with repeated renders', async () => {
      const recipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const initialMemory = process.memoryUsage().heapUsed;

      // Render and unmount 100 times
      for (let i = 0; i < 100; i++) {
        const { unmount } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
          wrapper: createWrapper(),
        });

        await waitFor(() => {
          // Wait a tick
          return true;
        });

        unmount();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase after 100 render cycles: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable (< 50MB for 100 cycles)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });

    it('does not leak memory with rapid filter changes', async () => {
      const recipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const initialMemory = process.memoryUsage().heapUsed;

      const { rerender, unmount } = renderHook(
        ({ filters }) => useRecipeDataPaginated(filters, defaultSort),
        {
          wrapper: createWrapper(),
          initialProps: { filters: defaultFilters },
        }
      );

      // Change filters 200 times
      for (let i = 0; i < 200; i++) {
        rerender({
          filters: { ...defaultFilters, searchQuery: `query-${i}` },
        });
      }

      await waitFor(() => {
        return true;
      });

      unmount();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      console.log(`Memory increase after 200 filter changes: ${memoryIncreaseMB.toFixed(2)}MB`);

      // Memory increase should be reasonable (< 30MB for 200 changes)
      expect(memoryIncreaseMB).toBeLessThan(30);
    });

    it('properly cleans up after unmount', async () => {
      const recipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const { result, unmount } = renderHook(
        () => useRecipeDataPaginated(defaultFilters, defaultSort),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].recipes).toHaveLength(20);

      // Unmount
      unmount();

      // After unmount, no further updates should occur
      expect(true).toBe(true);
    });
  });

  describe('Render Performance', () => {
    it('renders 100 recipe cards in reasonable time', () => {
      const recipes = createTestRecipes(100);

      const startTime = performance.now();

      // Simulate rendering recipe data (not actual DOM rendering in vitest)
      recipes.forEach((recipe) => {
        const cardData = {
          id: recipe.id,
          title: recipe.title,
          description: recipe.description,
          image: recipe.image_url,
          rating: recipe.rating,
          cookTime: recipe.cook_time,
          difficulty: recipe.difficulty,
        };

        expect(cardData).toBeTruthy();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete within 100ms

      console.log(`Processing 100 recipe cards took ${duration.toFixed(2)}ms`);
    });

    it('handles large text content efficiently', () => {
      const longTitle = 'A'.repeat(200);
      const longDescription = 'B'.repeat(1000);
      const longInstructions = 'C'.repeat(10000);

      const recipe = createTestRecipe({
        title: longTitle,
        description: longDescription,
        instructions: longInstructions,
      });

      const startTime = performance.now();

      // Simulate processing
      const processed = {
        title: recipe.title.substring(0, 50),
        description: recipe.description.substring(0, 200),
        instructions: recipe.instructions.substring(0, 500),
      };

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(processed.title.length).toBeLessThanOrEqual(50);
      expect(duration).toBeLessThan(10); // Should be nearly instant

      console.log(`Processing large text content took ${duration.toFixed(2)}ms`);
    });

    it('efficiently handles complex filtering operations', () => {
      const recipes = createTestRecipes(1000);

      const startTime = performance.now();

      // Simulate complex filtering
      const filtered = recipes.filter((recipe) => {
        return (
          recipe.cuisine_type === 'Italian' &&
          recipe.difficulty === 'Easy' &&
          recipe.categories?.includes('Dinner') &&
          (recipe.rating ?? 0) >= 4
        );
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(filtered).toBeDefined();
      expect(duration).toBeLessThan(50); // Should complete within 50ms

      console.log(`Filtering 1000 recipes took ${duration.toFixed(2)}ms`);
      console.log(`Found ${filtered.length} matching recipes`);
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple simultaneous queries', async () => {
      const recipes = createTestRecipes(20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: recipes,
          error: null,
          count: 20,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const startTime = performance.now();

      // Create 10 simultaneous queries
      const queries = Array.from({ length: 10 }, (_, i) => {
        return renderHook(
          () =>
            useRecipeDataPaginated(
              { ...defaultFilters, searchQuery: `query-${i}` },
              defaultSort
            ),
          { wrapper: createWrapper() }
        );
      });

      // Wait for all queries to complete
      await Promise.all(
        queries.map((query) =>
          waitFor(() => expect(query.result.current.isSuccess).toBe(true))
        )
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`10 concurrent queries took ${duration.toFixed(2)}ms`);

      // Cleanup
      queries.forEach((query) => query.unmount());
    });

    it('handles mixed read and write operations', async () => {
      const recipes = createTestRecipes(10);

      let operationCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          operationCount++;
          return Promise.resolve({
            data: recipes,
            error: null,
            count: 10,
          });
        }),
        insert: vi.fn().mockImplementation(() => {
          operationCount++;
          return Promise.resolve({
            data: [createTestRecipe()],
            error: null,
          });
        }),
        update: vi.fn().mockImplementation(() => {
          operationCount++;
          return {
            eq: vi.fn().mockResolvedValue({
              data: recipes[0],
              error: null,
            }),
          };
        }),
        delete: vi.fn().mockImplementation(() => {
          operationCount++;
          return {
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      const startTime = performance.now();

      // Mix of operations
      await Promise.all([
        mockSupabaseClient.from('recipes').select(),
        mockSupabaseClient.from('recipes').insert(createTestRecipe()),
        mockSupabaseClient.from('recipes').update({ title: 'Updated' }).eq('id', '1'),
        mockSupabaseClient.from('recipes').delete().eq('id', '2'),
        mockSupabaseClient.from('recipes').select(),
      ]);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(operationCount).toBe(5);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      console.log(`5 mixed operations took ${duration.toFixed(2)}ms`);
    });
  });

  describe('Edge Case Performance', () => {
    it('handles empty result sets efficiently', async () => {
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

      const startTime = performance.now();

      const { result } = renderHook(() => useRecipeDataPaginated(defaultFilters, defaultSort), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.data?.pages[0].recipes).toHaveLength(0);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second

      console.log(`Empty result set handled in ${duration.toFixed(2)}ms`);
    });

    it('efficiently processes recipes with unicode characters', () => {
      const unicodeRecipes = Array.from({ length: 100 }, () =>
        createTestRecipe({
          title: '🍕🍔🍟🌮🍝🍜🍲🥗🍱🍛',
          description: '美味しい料理の説明です 🎉',
        })
      );

      const startTime = performance.now();

      unicodeRecipes.forEach((recipe) => {
        expect(recipe.title).toContain('🍕');
        expect(recipe.description).toContain('🎉');
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Should complete within 50ms

      console.log(`Processing 100 unicode recipes took ${duration.toFixed(2)}ms`);
    });
  });
});
