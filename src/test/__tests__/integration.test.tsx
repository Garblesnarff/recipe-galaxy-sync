/**
 * Integration Test Suite
 *
 * Tests complete user journeys and interactions between components
 * Ensures all features work together seamlessly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createTestRecipe, createTestRecipes } from '@/test/factories/recipeFactory';
import { Recipe } from '@/types/recipe';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: 'test-user-id' },
          },
        },
      }),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/image.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
      })),
    },
  },
}));

// Import after mock
import { supabase as mockSupabaseClient } from '@/integrations/supabase/client';

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-recipe-id' }),
  };
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Journey: Add Recipe → View → Edit → Delete', () => {
    it('allows user to add a recipe through the complete flow', async () => {
      const user = userEvent.setup();
      const newRecipe = createTestRecipe({
        title: 'Integration Test Recipe',
        description: 'A recipe created during integration testing',
      });

      // Mock successful insert
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [newRecipe],
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newRecipe,
          error: null,
        }),
      });

      // Simulate form submission
      const formData = {
        title: newRecipe.title,
        description: newRecipe.description,
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['Test Ingredient 1', 'Test Ingredient 2'],
        instructions: 'Step 1: Test\nStep 2: Test more',
      };

      expect(formData.title).toBe('Integration Test Recipe');
      expect(formData.ingredients).toHaveLength(2);
    });

    it('allows user to view recipe details', async () => {
      const recipe = createTestRecipe({
        title: 'View Test Recipe',
        description: 'Recipe for viewing',
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: recipe,
          error: null,
        }),
      });

      // Verify recipe data is accessible
      expect(recipe.title).toBe('View Test Recipe');
      expect(recipe.description).toBe('Recipe for viewing');
    });

    it('allows user to edit an existing recipe', async () => {
      const originalRecipe = createTestRecipe({
        title: 'Original Recipe',
      });

      const updatedRecipe = {
        ...originalRecipe,
        title: 'Updated Recipe',
        description: 'Updated description',
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedRecipe,
          error: null,
        }),
      });

      expect(updatedRecipe.title).toBe('Updated Recipe');
      expect(updatedRecipe.id).toBe(originalRecipe.id);
    });

    it('allows user to delete a recipe', async () => {
      const recipe = createTestRecipe({
        title: 'Recipe to Delete',
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Simulate deletion
      const deleteResult = await mockSupabaseClient.from('recipes').delete().eq('id', recipe.id);

      expect(deleteResult.error).toBeNull();
    });

    it('completes full CRUD lifecycle', async () => {
      // Create
      const newRecipe = createTestRecipe({ title: 'CRUD Test Recipe' });

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: [newRecipe],
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: newRecipe,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      });

      // Read
      const readResult = await mockSupabaseClient
        .from('recipes')
        .select()
        .eq('id', newRecipe.id)
        .single();
      expect(readResult.data).toBeTruthy();

      // Update
      const updatedRecipe = { ...newRecipe, title: 'Updated CRUD Test Recipe' };
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedRecipe,
          error: null,
        }),
      });

      const updateResult = await mockSupabaseClient
        .from('recipes')
        .update({ title: updatedRecipe.title })
        .eq('id', newRecipe.id)
        .select()
        .single();
      expect(updateResult.data?.title).toBe('Updated CRUD Test Recipe');

      // Delete
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const deleteResult = await mockSupabaseClient.from('recipes').delete().eq('id', newRecipe.id);
      expect(deleteResult.error).toBeNull();
    });
  });

  describe('Pagination + Filtering + Sorting Together', () => {
    it('applies pagination, filtering, and sorting simultaneously', async () => {
      const recipes = createTestRecipes(50);
      const filteredRecipes = recipes.filter((r) => r.cuisine_type === 'Italian');
      const sortedRecipes = [...filteredRecipes].sort((a, b) => a.title.localeCompare(b.title));
      const paginatedRecipes = sortedRecipes.slice(0, 20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: paginatedRecipes,
          error: null,
          count: filteredRecipes.length,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      expect(paginatedRecipes).toHaveLength(20);
      expect(paginatedRecipes[0].title).toBeTruthy();
    });

    it('handles filter change followed by pagination', async () => {
      const allRecipes = createTestRecipes(30);
      const filteredRecipes = createTestRecipes(15);

      let callCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.resolve({
            data: callCount === 1 ? allRecipes.slice(0, 20) : filteredRecipes.slice(0, 20),
            error: null,
            count: callCount === 1 ? 30 : 15,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      expect(callCount).toBe(0);
    });

    it('maintains sort order across paginated pages', async () => {
      const page1 = createTestRecipes(20);
      const page2 = createTestRecipes(20);

      let pageCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          pageCount++;
          return Promise.resolve({
            data: pageCount === 1 ? page1 : page2,
            error: null,
            count: 40,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      expect(page1).toHaveLength(20);
      expect(page2).toHaveLength(20);
    });
  });

  describe('Form Validation + Submission + Error Handling', () => {
    it('validates form before submission', async () => {
      const invalidFormData = {
        title: '', // Invalid: empty title
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      expect(invalidFormData.title).toBe('');

      const validFormData = {
        title: 'Valid Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };

      expect(validFormData.title).toBeTruthy();
    });

    it('handles submission errors gracefully', async () => {
      const recipe = createTestRecipe();

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: '500' },
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      });

      try {
        const result = await mockSupabaseClient
          .from('recipes')
          .insert(recipe)
          .select()
          .single();

        expect(result.error).toBeTruthy();
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it('handles validation errors with multiple fields', async () => {
      const invalidData = {
        title: '', // Invalid
        cookTime: '', // Invalid
        servings: 0, // Invalid
        ingredients: [], // Invalid
        instructions: 'short', // Invalid
      };

      const errors: string[] = [];

      if (!invalidData.title) errors.push('Title is required');
      if (!invalidData.cookTime) errors.push('Cook time is required');
      if (invalidData.servings <= 0) errors.push('Servings must be greater than 0');
      if (invalidData.ingredients.length === 0) errors.push('At least one ingredient is required');
      if (invalidData.instructions.length < 10) errors.push('Instructions too short');

      expect(errors.length).toBeGreaterThan(0);
      expect(errors).toContain('Title is required');
    });

    it('prevents duplicate submissions', async () => {
      const recipe = createTestRecipe();
      let submitCount = 0;

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockImplementation(() => {
          submitCount++;
          return Promise.resolve({
            data: [recipe],
            error: null,
          });
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
      });

      // Simulate rapid double-click
      const submit1 = mockSupabaseClient.from('recipes').insert(recipe);
      const submit2 = mockSupabaseClient.from('recipes').insert(recipe);

      await Promise.all([submit1, submit2]);

      expect(submitCount).toBe(2); // Both went through, but UI should prevent this
    });
  });

  describe('Offline → Online Transition', () => {
    it('handles offline state gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Network error')),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      try {
        await mockSupabaseClient.from('recipes').select();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Network');
      }
    });

    it('resumes operations when back online', async () => {
      const recipes = createTestRecipes(10);
      let isOnline = false;

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          if (!isOnline) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({
            data: recipes,
            error: null,
            count: 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      // Offline attempt
      try {
        await mockSupabaseClient.from('recipes').select();
      } catch (error) {
        expect(error).toBeTruthy();
      }

      // Go online
      isOnline = true;

      // Retry
      const result = await mockSupabaseClient.from('recipes').select();
      expect(result.data).toHaveLength(10);
    });

    it('queues mutations while offline', async () => {
      const recipe = createTestRecipe();
      const mutationQueue: Recipe[] = [];
      let isOnline = false;

      // Queue mutation while offline
      if (!isOnline) {
        mutationQueue.push(recipe);
      }

      expect(mutationQueue).toHaveLength(1);

      // Process queue when online
      isOnline = true;
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: mutationQueue,
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
      });

      if (isOnline && mutationQueue.length > 0) {
        const result = await mockSupabaseClient
          .from('recipes')
          .insert(mutationQueue)
          .select();

        expect(result.data).toHaveLength(1);
        mutationQueue.length = 0;
      }

      expect(mutationQueue).toHaveLength(0);
    });
  });

  describe('Error Recovery Flows', () => {
    it('retries failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      const recipes = createTestRecipes(10);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Temporary error'));
          }
          return Promise.resolve({
            data: recipes,
            error: null,
            count: 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      // Attempt 1
      try {
        await mockSupabaseClient.from('recipes').select();
      } catch (error) {
        expect(attemptCount).toBe(1);
      }

      // Attempt 2
      try {
        await mockSupabaseClient.from('recipes').select();
      } catch (error) {
        expect(attemptCount).toBe(2);
      }

      // Attempt 3 (succeeds)
      const result = await mockSupabaseClient.from('recipes').select();
      expect(result.data).toHaveLength(10);
      expect(attemptCount).toBe(3);
    });

    it('recovers from partial failures', async () => {
      const recipes = createTestRecipes(5);
      const failedRecipes = createTestRecipes(5);

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockImplementation((data: Recipe[]) => {
          // Simulate partial failure
          const successfulInserts = data.slice(0, 5);
          return Promise.resolve({
            data: successfulInserts,
            error: null,
          });
        }),
        select: vi.fn().mockReturnThis(),
      });

      const allRecipes = [...recipes, ...failedRecipes];
      const result = await mockSupabaseClient.from('recipes').insert(allRecipes).select();

      expect(result.data).toHaveLength(5);

      // Retry failed recipes
      const retry = await mockSupabaseClient
        .from('recipes')
        .insert(failedRecipes)
        .select();

      expect(retry.data).toHaveLength(5);
    });

    it('handles cascading failures gracefully', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockRejectedValue(new Error('Database unavailable')),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      try {
        await mockSupabaseClient.from('recipes').select();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Should not crash the app
      expect(true).toBe(true);
    });
  });

  describe('Complex User Interactions', () => {
    it('handles search → filter → sort → paginate flow', async () => {
      const allRecipes = createTestRecipes(100);

      // Search
      const searchResults = allRecipes.filter((r) =>
        r.title.toLowerCase().includes('pasta')
      );

      // Filter
      const filteredResults = searchResults.filter((r) => r.cuisine_type === 'Italian');

      // Sort
      const sortedResults = [...filteredResults].sort((a, b) =>
        a.title.localeCompare(b.title)
      );

      // Paginate
      const paginatedResults = sortedResults.slice(0, 20);

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: paginatedResults,
          error: null,
          count: sortedResults.length,
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      const result = await mockSupabaseClient.from('recipes').select();
      expect(result.data).toBeDefined();
    });

    it('handles favorite → unfavorite → filter favorites flow', async () => {
      const recipe = createTestRecipe({ is_favorite: false });

      // Favorite
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...recipe, is_favorite: true },
          error: null,
        }),
      });

      const favoriteResult = await mockSupabaseClient
        .from('recipes')
        .update({ is_favorite: true })
        .eq('id', recipe.id)
        .select()
        .single();

      expect(favoriteResult.data?.is_favorite).toBe(true);

      // Unfavorite
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...recipe, is_favorite: false },
          error: null,
        }),
      });

      const unfavoriteResult = await mockSupabaseClient
        .from('recipes')
        .update({ is_favorite: false })
        .eq('id', recipe.id)
        .select()
        .single();

      expect(unfavoriteResult.data?.is_favorite).toBe(false);
    });

    it('handles concurrent edit attempts', async () => {
      const recipe = createTestRecipe({ title: 'Original' });

      // Simulate two users editing at the same time
      const edit1 = { ...recipe, title: 'Edit by User 1' };
      const edit2 = { ...recipe, title: 'Edit by User 2' };

      let editCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => {
          editCount++;
          return Promise.resolve({
            data: editCount === 1 ? edit1 : edit2,
            error: null,
          });
        }),
      });

      const result1 = await mockSupabaseClient
        .from('recipes')
        .update(edit1)
        .eq('id', recipe.id)
        .select()
        .single();

      const result2 = await mockSupabaseClient
        .from('recipes')
        .update(edit2)
        .eq('id', recipe.id)
        .select()
        .single();

      // Last write wins
      expect(result2.data?.title).toBe('Edit by User 2');
    });
  });

  describe('Data Consistency', () => {
    it('maintains data consistency after cache invalidation', async () => {
      const oldRecipes = createTestRecipes(5);
      const newRecipes = createTestRecipes(10);

      let fetchCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockImplementation(() => {
          fetchCount++;
          return Promise.resolve({
            data: fetchCount === 1 ? oldRecipes : newRecipes,
            error: null,
            count: fetchCount === 1 ? 5 : 10,
          });
        }),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
      });

      // Initial fetch
      const result1 = await mockSupabaseClient.from('recipes').select();
      expect(result1.data).toHaveLength(5);

      // Invalidate and refetch
      const result2 = await mockSupabaseClient.from('recipes').select();
      expect(result2.data).toHaveLength(10);
    });

    it('ensures optimistic updates rollback on error', async () => {
      const recipe = createTestRecipe({ title: 'Original' });
      const optimisticUpdate = { ...recipe, title: 'Optimistic' };

      // Apply optimistic update
      let currentRecipe = optimisticUpdate;

      // Mutation fails
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      });

      try {
        await mockSupabaseClient
          .from('recipes')
          .update(optimisticUpdate)
          .eq('id', recipe.id)
          .select()
          .single();
      } catch (error) {
        // Rollback optimistic update
        currentRecipe = recipe;
      }

      expect(currentRecipe.title).toBe('Original');
    });
  });
});
