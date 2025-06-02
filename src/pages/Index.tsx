
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilters } from "@/components/recipe/RecipeFilters";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { SalesScrapingTest } from "@/components/sales/SalesScrapingTest";

const Index = () => {
  const {
    recipes,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedCuisine,
    setSelectedCuisine,
    selectedCookingMethod,
    setSelectedCookingMethod,
    sortBy,
    setSortBy,
    selectedCategories,
    setSelectedCategories,
    selectedDietTags,
    setSelectedDietTags
  } = useRecipeFilters();

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
        
        <RecipeFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedCuisine={selectedCuisine}
          setSelectedCuisine={setSelectedCuisine}
          selectedCookingMethod={selectedCookingMethod}
          setSelectedCookingMethod={setSelectedCookingMethod}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedDietTags={selectedDietTags}
          setSelectedDietTags={setSelectedDietTags}
        />

        {recipes && recipes.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
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
