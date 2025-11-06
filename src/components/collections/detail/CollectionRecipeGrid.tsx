
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types/recipe";

interface CollectionRecipeGridProps {
  recipes: Recipe[];
  onRemoveRecipe: (recipeId: string) => void;
}

export const CollectionRecipeGrid = ({ recipes, onRemoveRecipe }: CollectionRecipeGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map(recipe => (
        <div key={recipe.id} className="relative group">
          <RecipeCard
            id={recipe.id}
            title={recipe.title}
            description={recipe.description}
            image={recipe.image_url}
            rating={recipe.rating || 0}
            cookTime={recipe.cook_time}
            difficulty={recipe.difficulty}
            isFavorite={recipe.is_favorite}
            onFavoriteToggle={() => {}} // This would need to be implemented
            tags={[
              ...(recipe.cuisine_type ? [recipe.cuisine_type] : []),
              ...(recipe.categories?.slice(0, 1) || [])
            ]}
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveRecipe(recipe.id);
            }}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};
