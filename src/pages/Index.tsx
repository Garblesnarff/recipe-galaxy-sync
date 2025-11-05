
import { useEffect, useRef } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilterBar } from "@/components/recipe/RecipeFilters";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { useRecipeDataPaginated } from "@/hooks/useRecipeDataPaginated";
import { SalesScrapingTest } from "@/components/sales/SalesScrapingTest";

const Index = () => {
  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useRecipeFilters();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useRecipeDataPaginated(filters, sortOption);

  // Flatten all pages into a single array
  const recipes = data?.pages.flatMap(page => page.recipes) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Intersection observer ref for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
          {totalCount > 0 && (
            <p className="text-gray-600">
              {recipes.length === totalCount
                ? `${totalCount} recipe${totalCount === 1 ? '' : 's'}`
                : `Showing ${recipes.length} of ${totalCount} recipes`}
            </p>
          )}
        </div>

        <RecipeFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        {recipes && recipes.length > 0 ? (
          <>
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

            {/* Infinite scroll trigger and loading indicator */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-8">
              {isFetchingNextPage && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                  <span>Loading more recipes...</span>
                </div>
              )}
              {!hasNextPage && recipes.length > 0 && recipes.length < totalCount && (
                <div className="text-gray-400 text-sm">All recipes loaded</div>
              )}
              {!hasNextPage && recipes.length === totalCount && recipes.length > RECIPES_PER_PAGE && (
                <div className="text-gray-400 text-sm">You've seen all {totalCount} recipes!</div>
              )}
            </div>
          </>
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

const RECIPES_PER_PAGE = 20; // For the loading indicator logic

export default Index;
