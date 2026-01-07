
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecipeFilters, SortOption } from "@/types/recipe";

export const useRecipeData = (filters: RecipeFilters, sortOption: SortOption) => {
  return useQuery({
    queryKey: ['recipes', filters, sortOption],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*');

      // Apply search filter - comprehensive search across title, description, ingredients, and categories
      if (filters.searchQuery) {
        const searchTerm = `%${filters.searchQuery}%`;
        query = query.or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},ingredients::text.ilike.${searchTerm},categories::text.ilike.${searchTerm},cuisine_type.ilike.${searchTerm},diet_tags::text.ilike.${searchTerm}`
        );
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

      // Apply season/occasion filter
      if (filters.season_occasion.length > 0) {
        query = query.contains('season_occasion', filters.season_occasion);
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
      } else if (sortOption.value === 'cook_count') {
        query = query.order('cook_count', { ascending: sortOption.direction === 'asc', nullsFirst: false });
      } else {
        query = query.order(sortOption.value, { ascending: sortOption.direction === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });
};
