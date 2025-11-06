
import { useEffect, useRef, useMemo } from "react";
import { RecipeCard } from "@/components/RecipeCard";
import { RecipeFilterBar } from "@/components/recipe/RecipeFilters";
import { useRecipeFilters } from "@/hooks/useRecipeFilters";
import { useRecipeData } from "@/hooks/useRecipeData";
import { useRecipeDataPaginated } from "@/hooks/useRecipeDataPaginated";
import { SalesScrapingTest } from "@/components/sales/SalesScrapingTest";
import { FEATURES, FeatureFlags } from "@/config/features";
import { perfMonitor } from "@/lib/performance";
import { SalesDataProvider } from "@/contexts/SalesDataContext";

const Index = () => {
  const {
    filters,
    setFilters,
    sortOption,
    setSortOption
  } = useRecipeFilters();

  // Feature flag: Choose between old and new pagination
  const useInfiniteScroll = FEATURES.INFINITE_SCROLL;

  // OLD: Load all recipes at once
  const oldHook = useRecipeData(filters, sortOption);

  // NEW: Paginated infinite scroll
  const newHook = useRecipeDataPaginated(filters, sortOption);

  // Use the appropriate hook based on feature flag
  const activeHook = useInfiniteScroll ? newHook : oldHook;

  // Normalize the data structure for both hooks
  const recipes = useInfiniteScroll
    ? (newHook.data?.pages.flatMap(page => page.recipes) ?? [])
    : (oldHook.data ?? []);

  const totalCount = useInfiniteScroll
    ? (newHook.data?.pages[0]?.totalCount ?? 0)
    : (oldHook.data?.length ?? 0);

  const isLoading = activeHook.isLoading;
  const hasNextPage = useInfiniteScroll ? newHook.hasNextPage : false;
  const isFetchingNextPage = useInfiniteScroll ? newHook.isFetchingNextPage : false;
  const fetchNextPage = useInfiniteScroll ? newHook.fetchNextPage : () => {};

  // Extract recipe IDs for batched sales data fetching (Performance optimization)
  const recipeIds = useMemo(() => recipes.map(recipe => recipe.id), [recipes]);

  // Log feature flag state on mount (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      FeatureFlags.logState();
      console.log(`📄 Index page using: ${useInfiniteScroll ? 'PAGINATED' : 'LEGACY'} hook`);

      // Track performance metrics
      perfMonitor.start('index-page-mount');
      return () => {
        perfMonitor.end('index-page-mount', {
          mode: useInfiniteScroll ? 'paginated' : 'legacy',
          recipesLoaded: recipes.length,
        });
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track recipe loading performance
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      if (import.meta.env.DEV) {
        perfMonitor.end('recipe-load', {
          mode: useInfiniteScroll ? 'paginated' : 'legacy',
          count: recipes.length,
          totalAvailable: totalCount,
        });
      }
    }
  }, [isLoading, recipes.length, totalCount, useInfiniteScroll]);

  // Intersection observer ref for infinite scroll (only used when feature is enabled)
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll (only when enabled)
  useEffect(() => {
    if (!useInfiniteScroll) return; // Skip if feature is disabled

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          if (import.meta.env.DEV) {
            perfMonitor.start('fetch-next-page');
          }
          fetchNextPage();
          if (import.meta.env.DEV) {
            perfMonitor.end('fetch-next-page');
          }
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
  }, [useInfiniteScroll, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
            {/* Batched sales data provider - Reduces queries from N*3 to just 3 */}
            <SalesDataProvider recipeIds={recipeIds}>
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
            </SalesDataProvider>

            {/* Infinite scroll trigger and loading indicator (only shown when feature enabled) */}
            {useInfiniteScroll && (
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
                {!hasNextPage && recipes.length === totalCount && recipes.length > FEATURES.PAGINATION_SIZE && (
                  <div className="text-gray-400 text-sm">You've seen all {totalCount} recipes!</div>
                )}
              </div>
            )}
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

export default Index;
