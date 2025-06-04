
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilterBar } from "@/components/recipe/RecipeFilters";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { SalesScrapingTest } from "@/components/sales/SalesScrapingTest";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useRecipeFilters();

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes', filters, sortOption],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*');

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
        query = query.order('rating', { ascending: sortOption.direction === 'asc', nullsLast: true });
      } else {
        query = query.order(sortOption.value, { ascending: sortOption.direction === 'asc' });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Sales Scraping Test - Remove this in production */}
      <div className="flex justify-center">
        <SalesScrapingTest />
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Recipes</h1>
        
        <RecipeFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        {recipes && recipes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard 
                key={recipe.id} 
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                image={recipe.image_url}
                rating={recipe.rating || 0}
                cookTime={recipe.cook_time}
                difficulty={recipe.difficulty}
                isFavorite={recipe.is_favorite}
                tags={recipe.categories || []}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No recipes found</p>
            <p className="text-gray-400">Try adjusting your filters or add your first recipe!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
