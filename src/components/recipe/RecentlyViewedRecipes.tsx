import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { normalizeImageUrl } from "@/utils/ingredientUtils";
import { Skeleton } from "@/components/ui/skeleton";

const MAX_DISPLAY_RECIPES = 5;

export const RecentlyViewedRecipes = () => {
  const { recentlyViewed, isLoading } = useRecentlyViewed();

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (recentlyViewed.length === 0) {
    return null; // Don't show section if no recently viewed recipes
  }

  const displayRecipes = recentlyViewed.slice(0, MAX_DISPLAY_RECIPES);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Recently Viewed</h2>
        </div>
        <Button variant="outline" asChild>
          <Link to="/recently-viewed" className="flex items-center">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-5">
        {displayRecipes.map((recipe) => (
          <Link key={recipe.id} to={`/recipe/${recipe.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="aspect-square relative">
                <img
                  src={normalizeImageUrl(recipe.image_url) || '/placeholder.svg'}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{recipe.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(recipe.viewed_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
