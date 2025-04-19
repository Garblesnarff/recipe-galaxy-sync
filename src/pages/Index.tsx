import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import debounce from "lodash/debounce";
import { BottomNavigation } from "@/components/BottomNavigation";
import { triggerSalesScrape } from "@/services/salesService";
import { toast } from "sonner";
import { RecipeFilterBar } from "@/components/recipe/RecipeFilters";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { IngredientSale } from "@/services/sales";

const Index = () => {
  const navigate = useNavigate();
  const [isScrapingSales, setIsScrapingSales] = useState(false);
  const { filters, setFilters, sortOption, setSortOption } = useRecipeFilters();
  
  const {
    data: recipes,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["recipes", filters, sortOption],
    queryFn: async () => {
      let query = supabase.from("recipes").select("*");
      
      // Apply filters
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }
      
      if (filters.categories.length > 0) {
        query = query.overlaps('categories', filters.categories);
      }
      
      if (filters.cuisine_type) {
        query = query.eq('cuisine_type', filters.cuisine_type);
      }
      
      if (filters.diet_tags.length > 0) {
        query = query.overlaps('diet_tags', filters.diet_tags);
      }
      
      if (filters.cooking_method) {
        query = query.eq('cooking_method', filters.cooking_method);
      }
      
      if (filters.season_occasion.length > 0) {
        query = query.overlaps('season_occasion', filters.season_occasion);
      }
      
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      
      if (filters.favorite_only) {
        query = query.eq('is_favorite', true);
      }
      
      // Apply sorting
      query = query.order(sortOption.value, { 
        ascending: sortOption.direction === 'asc' 
      });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const handleRefreshSales = async () => {
    setIsScrapingSales(true);
    try {
      const success = await triggerSalesScrape();
      if (success) {
        // Refresh the recipe cards to show updated sale indicators
        refetch();
      }
    } catch (error) {
      console.error("Error refreshing sales data:", error);
      toast.error("Failed to refresh sales data");
    } finally {
      setIsScrapingSales(false);
    }
  };

  const toggleFavorite = async (recipeId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({ is_favorite: !isFavorite })
        .eq("id", recipeId);
        
      if (error) throw error;
      
      refetch();
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      console.error("Error updating favorite status:", error);
      toast.error("Failed to update favorite status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-recipe-green-light border-b sticky top-0 z-10">
        <div className="container py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">KitchenSync</h1>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 md:w-auto w-full">
            <Button 
              variant="outline" 
              size="icon" 
              className="md:flex hidden"
              onClick={handleRefreshSales} 
              disabled={isScrapingSales}
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingSales ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="app" className="rounded-full" onClick={() => navigate("/add-recipe")}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 animate-fade-in">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Recipes</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex md:hidden items-center gap-2"
            onClick={handleRefreshSales}
            disabled={isScrapingSales}
          >
            <RefreshCw className={`h-4 w-4 ${isScrapingSales ? 'animate-spin' : ''}`} />
            {isScrapingSales ? 'Updating Sales...' : 'Update Sales'}
          </Button>
        </div>
        
        {/* Recipe Filters */}
        <RecipeFilterBar 
          filters={filters}
          onFiltersChange={setFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />
        
        {isLoading ? (
          <div className="text-center text-gray-500 py-10">Loading recipes...</div>
        ) : recipes?.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="mb-4">No recipes found</p>
            <Button variant="app" onClick={() => navigate("/add-recipe")}>Add Your First Recipe</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map(recipe => (
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
                onFavoriteToggle={() => toggleFavorite(recipe.id, recipe.is_favorite)}
                tags={[
                  ...(recipe.cuisine_type ? [recipe.cuisine_type] : []),
                  ...(recipe.categories?.slice(0, 1) || [])
                ]}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNavigation />

      <Button variant="app" size="fab" className="fixed bottom-20 right-4 z-10" onClick={() => navigate("/add-recipe")}>
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default Index;
