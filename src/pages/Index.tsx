
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilterBar } from "@/components/recipe/RecipeFilters";
import { RecentlyViewedRecipes } from "@/components/recipe/RecentlyViewedRecipes";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { useRecipeData } from "@/hooks/useRecipeData";
import { SalesScrapingTest } from "@/components/sales/SalesScrapingTest";

const Index = () => {
  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useRecipeFilters();

  const { data: recipes, isLoading } = useRecipeData(filters, sortOption);

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
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-center">
          <SalesScrapingTest />
        </div>
      )}
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Recipes</h1>

        <RecentlyViewedRecipes />

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
