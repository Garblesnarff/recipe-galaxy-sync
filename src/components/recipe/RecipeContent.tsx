
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Recipe } from "@/types/recipe";
import { DietaryRestriction } from "@/types/dietary";

interface RecipeContentProps {
  recipe: Recipe;
  isAdapted: boolean;
  currentServings: number;
  setCurrentServings: (servings: number) => void;
  handleAdaptRecipe: (recipe: any) => void;
  handleResetAdaptation: () => void;
  isFavorite: boolean;
  handleToggleFavorite: () => void;
}

export const RecipeContent = ({
  recipe,
  isAdapted,
  currentServings,
  setCurrentServings,
  handleAdaptRecipe,
  handleResetAdaptation,
  isFavorite,
  handleToggleFavorite
}: RecipeContentProps) => {
  return (
    <Card className={cn("p-4", isAdapted && "border-indigo-300")}>
      <div className="space-y-6">
        <RecipeHeader
          title={recipe.title || ""}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          rating={recipe.rating}
          ratingsCount={recipe.ratings?.length || 0}
          imageUrl={recipe.image_url}
        />

        <RecipeImage imageUrl={recipe.image_url} />

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <AdaptRecipeDialog 
              recipeId={recipe.id}
              onAdapt={handleAdaptRecipe}
            />
            
            <SaleIndicator
              salesCount={2}
            />
          </div>

          <RecipeTimer
            minutes={recipe.cook_time ? parseInt(recipe.cook_time) : 0}
            label={recipe.cook_time ? `${recipe.cook_time} Cooking Time` : ""}
          />
        </div>

        <RecipeMetadata
          prepTime={recipe.prep_time}
          cookTime={recipe.cook_time}
          servings={currentServings}
          difficulty={recipe.difficulty}
          rating={recipe.rating}
          onServingsChange={setCurrentServings}
        />

        <DietaryWarnings
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
        />

        <RecipeIngredientsList
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
          servings={recipe.servings}
          currentServings={currentServings}
        />

        <RecipeInstructionsList
          instructions={recipe.instructions || ""}
        />

        <RecipeTags
          categories={recipe.categories}
          cuisineType={recipe.cuisine_type}
          dietTags={recipe.diet_tags}
          cookingMethod={recipe.cooking_method}
          seasonOccasion={recipe.season_occasion}
        />

        <RecipeSource
          sourceUrl={recipe.source_url}
          sourceType={recipe.source_type}
        />

        <RecipeActions
          recipeId={recipe.id}
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
        />
      </div>
    </Card>
  );
};
