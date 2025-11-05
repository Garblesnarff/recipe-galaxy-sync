import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFilters, SortOption, Recipe } from "@/types/recipe";

const RECIPES_PER_PAGE = 20;

interface RecipePage {
  recipes: Recipe[];
  nextPage: number | undefined;
  totalCount: number | null;
}

/**
 * Paginated recipe data hook using infinite scroll pattern
 * Loads recipes in batches of 20 for better performance
 */
export const useRecipeDataPaginated = (filters: RecipeFilters, sortOption: SortOption) => {
  return useInfiniteQuery({
    queryKey: ['recipes-paginated', filters, sortOption],
    queryFn: async ({ pageParam = 0 }): Promise<RecipePage> => {
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

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        recipes: data || [],
        nextPage: (data?.length === RECIPES_PER_PAGE) ? pageParam + 1 : undefined,
        totalCount: count
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};
