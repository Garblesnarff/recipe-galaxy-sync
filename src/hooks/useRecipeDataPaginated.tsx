import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFilters, SortOption, Recipe } from "@/types/recipe";
import { parseSupabaseError } from "@/lib/errors";
import { withTimeout } from "@/lib/queryClient";
import { toast } from "sonner";

const RECIPES_PER_PAGE = 20;
const MAX_PAGES = 10; // Limit to 10 pages = 200 recipes max

interface RecipePage {
  recipes: Recipe[];
  nextPage: number | undefined;
  totalCount: number | null;
}

/**
 * Paginated recipe data hook using infinite scroll pattern
 * Loads recipes in batches of 20 for better performance
 * Includes enhanced error handling and automatic retries
 * Limited to 10 pages (200 recipes) for optimal performance
 */
export const useRecipeDataPaginated = (filters: RecipeFilters, sortOption: SortOption) => {
  return useInfiniteQuery({
    queryKey: ['recipes-paginated', filters, sortOption],
    queryFn: async ({ pageParam = 0 }): Promise<RecipePage> => {
      // Check max pages limit
      if (pageParam >= MAX_PAGES) {
        toast.warning('Maximum recipes loaded', {
          description: `Showing first ${MAX_PAGES * RECIPES_PER_PAGE} recipes. Please refine your search.`,
          duration: 5000,
        });
        return {
          recipes: [],
          nextPage: undefined,
          totalCount: null,
        };
      }

      const start = pageParam * RECIPES_PER_PAGE;
      const end = start + RECIPES_PER_PAGE - 1;

      let query = supabase
        .from('recipes')
        .select('*', { count: 'exact' })  // Get total count for UI
        .range(start, end);

      // Apply search filter
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }

      // Apply category filter
      if (filters.categories.length > 0) {
        query = query.contains('categories', filters.categories);
      }

      // Apply cuisine filter
      if (filters.cuisine_type) {
        query = query.eq('cuisine_type', filters.cuisine_type);
      }

      // Apply diet tags filter
      if (filters.diet_tags.length > 0) {
        query = query.contains('diet_tags', filters.diet_tags);
      }

      // Apply cooking method filter
      if (filters.cooking_method) {
        query = query.eq('cooking_method', filters.cooking_method);
      }

      // Apply difficulty filter
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }

      // Apply favorites filter
      if (filters.favorite_only) {
        query = query.eq('is_favorite', true);
      }

      // Apply sorting
      if (sortOption.value === 'rating') {
        query = query.order('rating', { ascending: sortOption.direction === 'asc', nullsFirst: false });
      } else {
        query = query.order(sortOption.value, { ascending: sortOption.direction === 'asc' });
      }

      // Execute query with timeout
      const { data, error, count } = await withTimeout(
        query,
        30000, // 30 second timeout
        new Error('Recipe page fetch timed out. Please try again.')
      );

      if (error) {
        // Parse and throw enhanced error
        throw parseSupabaseError(error);
      }

      return {
        recipes: data || [],
        nextPage: (data?.length === RECIPES_PER_PAGE && pageParam < MAX_PAGES - 1)
          ? pageParam + 1
          : undefined,
        totalCount: count
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    maxPages: MAX_PAGES, // Limit total pages loaded
    // Retry configuration is handled globally by queryClient
    // but can be overridden here if needed
    meta: {
      errorMessage: 'Failed to load recipe page',
    },
  });
};
